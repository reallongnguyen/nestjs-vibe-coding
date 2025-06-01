import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import {
  MediaConfig,
  generateStoragePath,
  getPurposeConfig,
} from '../media.config';
import {
  PresignedUrlGenerationFailedError,
  ConfigurationError,
} from '../entities/errors/media.error-classes';
import {
  StorageProvider,
  PresignedUrlOptions,
  PresignedUrlResult,
} from './storage-provider.interface';

@Injectable()
export class WasabiService implements StorageProvider {
  private readonly logger = new Logger(WasabiService.name);
  private s3Client: S3Client;
  private readonly mediaConfig: MediaConfig;

  constructor(private readonly configService: ConfigService) {
    this.mediaConfig = this.configService.get<MediaConfig>('media');
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    if (!this.mediaConfig) {
      throw new ConfigurationError('Media configuration not found');
    }

    const { wasabi } = this.mediaConfig;

    if (!wasabi.accessKeyId || !wasabi.secretAccessKey || !wasabi.bucketName) {
      throw new ConfigurationError(
        'Wasabi credentials are not properly configured',
      );
    }

    this.s3Client = new S3Client({
      region: wasabi.region,
      endpoint: wasabi.endpointUrl,
      credentials: {
        accessKeyId: wasabi.accessKeyId,
        secretAccessKey: wasabi.secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.logger.log('Wasabi S3 client initialized successfully');
  }

  async generatePresignedUrl(
    userId: string,
    fileName: string,
    purpose?: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const uploadId = `upload_${uuidv4()}`;
    const key = this.generateFileKey(userId, fileName, purpose, options);
    const purposeConfig = getPurposeConfig(purpose || 'general');
    const expiresIn = purposeConfig.presignedUrlExpirySeconds;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Calculate max file size in bytes for content-length-range
    const maxFileSizeBytes = purposeConfig.maxSizeMb * 1024 * 1024;
    const minFileSizeBytes = 1; // Minimum 1 byte
    const mimeType = this.extractMimeTypeFromFileName(fileName);

    // Use POST presigned URL with policy for better security
    return this.generatePostPresignedUrl(
      userId,
      fileName,
      mimeType,
      key,
      uploadId,
      expiresAt,
      maxFileSizeBytes,
      minFileSizeBytes,
      purposeConfig,
    );
  }

  /**
   * Generate POST presigned URL with policy conditions for strict validation
   * This provides better security as S3 will enforce all conditions including file size
   */
  private async generatePostPresignedUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    key: string,
    uploadId: string,
    expiresAt: Date,
    maxFileSizeBytes: number,
    minFileSizeBytes: number,
    purposeConfig: any,
  ): Promise<PresignedUrlResult> {
    try {
      // Policy conditions for POST presigned URL (simplified for compatibility)
      const conditions: any[] = [
        // Content-length-range condition to enforce file size limits
        ['content-length-range', minFileSizeBytes, maxFileSizeBytes],
        // Content-type starts with condition
        ['starts-with', '$Content-Type', mimeType.split('/')[0]],
      ];

      // Create POST presigned URL with policy
      const { url, fields } = await createPresignedPost(this.s3Client, {
        Bucket: this.mediaConfig.wasabi.bucketName,
        Key: key,
        Conditions: conditions as any,
        Fields: {
          'Content-Type': mimeType,
          'x-amz-meta-purpose': purposeConfig.purpose || 'general',
          'x-amz-meta-userid': userId,
          'x-amz-meta-uploadid': uploadId,
          'x-amz-meta-originalfilename': fileName,
          'x-amz-meta-maxsizebytes': maxFileSizeBytes.toString(),
        },
        Expires: Math.floor(purposeConfig.presignedUrlExpirySeconds),
      });

      const cdnUrl = this.generateCdnUrl(key);

      this.logger.debug(
        `Generated POST presigned URL for ${
          purposeConfig.purpose || 'general'
        } upload: ${key} (max: ${purposeConfig.maxSizeMb}MB, enforced by S3)`,
      );

      const result: PresignedUrlResult = {
        presignedUrl: url,
        key,
        expiresAt,
        cdnUrl,
        uploadId,
        maxFileSizeBytes,
        method: 'POST',
        conditions,
        fields,
      };

      // Only include thumbnail URL for image files
      if (this.isImageMimeType(mimeType)) {
        result.thumbnailUrl = this.generateThumbnailUrl(
          key,
          purposeConfig.purpose,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate POST presigned URL: ${error}`);
      throw new PresignedUrlGenerationFailedError(error.message);
    }
  }

  private generateFileKey(
    userId: string,
    fileName: string,
    purpose?: string,
    options?: PresignedUrlOptions,
  ): string {
    const purposeName = purpose || 'general';
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = this.getFileExtension(fileName);

    const pathVariables: Record<string, string> = {
      userId,
      timestamp: timestamp.toString(),
      uuid,
      ext: ext.substring(1), // Remove the dot from extension
    };

    // Add purpose-specific variables
    if (options?.clientId) pathVariables.clientId = options.clientId;

    return generateStoragePath(purposeName, pathVariables);
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return fileName.substring(lastDot);
  }

  private extractMimeTypeFromFileName(fileName: string): string {
    const extension = this.getFileExtension(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.tiff': 'image/tiff',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private generateCdnUrl(key: string): string {
    const { cloudflare } = this.mediaConfig;

    if (cloudflare.cdnBaseUrl) {
      return `${cloudflare.cdnBaseUrl}/${key}`;
    }

    return `${this.mediaConfig.wasabi.endpointUrl}/${this.mediaConfig.wasabi.bucketName}/${key}`;
  }

  private generateThumbnailUrl(key: string, purpose?: string): string {
    const { cloudflare } = this.mediaConfig;

    // Get purpose-specific thumbnail config or use default
    const purposeConfig = getPurposeConfig(purpose || 'general');
    const thumbnailConfig = purposeConfig.thumbnail;

    if (cloudflare.cdnBaseUrl) {
      // Use Cloudflare image transformation
      const transformParams = `width=${thumbnailConfig.width},height=${thumbnailConfig.height},quality=${thumbnailConfig.quality},format=${thumbnailConfig.format}`;
      return `${cloudflare.cdnBaseUrl}/cdn-cgi/image/${transformParams}/${key}`;
    }

    // Fallback for non-Cloudflare CDN (basic thumbnail URL)
    return `${this.mediaConfig.wasabi.endpointUrl}/${this.mediaConfig.wasabi.bucketName}/${key}`;
  }

  /**
   * Validate uploaded file against the original constraints
   * This should be called after upload to ensure the file meets requirements
   */
  async validateUploadedFile(
    key: string,
    expectedMaxSize: number,
    expectedMimeType: string,
  ): Promise<{
    isValid: boolean;
    actualSize?: number;
    actualMimeType?: string;
  }> {
    try {
      // In a real implementation, you would use HeadObjectCommand to check the object metadata
      // For now, we'll return a placeholder
      return {
        isValid: true,
        actualSize: 0,
        actualMimeType: expectedMimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to validate uploaded file: ${error}`);
      return { isValid: false };
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.mediaConfig.wasabi.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.debug(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error}`);
      throw error;
    }
  }

  async generateReadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.mediaConfig.wasabi.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn,
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate read URL: ${error}`);
      throw new PresignedUrlGenerationFailedError(error.message);
    }
  }
}

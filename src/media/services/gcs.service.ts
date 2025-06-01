import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
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
export class GcsService implements StorageProvider {
  private readonly logger = new Logger(GcsService.name);
  private storage: Storage;
  private readonly mediaConfig: MediaConfig;

  constructor(private readonly configService: ConfigService) {
    this.mediaConfig = this.configService.get<MediaConfig>('media');
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!this.mediaConfig) {
      throw new ConfigurationError('Media configuration not found');
    }

    const { gcs } = this.mediaConfig;

    if (!gcs.bucketName) {
      throw new ConfigurationError(
        'GCS bucket name is not properly configured',
      );
    }

    this.storage = new Storage({
      projectId: gcs.projectId,
    });

    this.logger.log('Google Cloud Storage client initialized successfully');
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

    // Calculate max file size in bytes
    const maxFileSizeBytes = purposeConfig.maxSizeMb * 1024 * 1024;
    const mimeType = this.extractMimeTypeFromFileName(fileName);

    return this.generateUploadUrl(
      userId,
      fileName,
      mimeType,
      key,
      uploadId,
      expiresAt,
      maxFileSizeBytes,
      purposeConfig,
    );
  }

  private async generateUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    key: string,
    uploadId: string,
    expiresAt: Date,
    maxFileSizeBytes: number,
    purposeConfig: any,
  ): Promise<PresignedUrlResult> {
    try {
      const writeOptions: GetSignedUrlConfig = {
        version: 'v4',
        action: 'write',
        expires: expiresAt,
        contentType: mimeType,
        extensionHeaders: {
          'x-goog-content-length-range': `0,${maxFileSizeBytes}`,
          'x-goog-meta-purpose': purposeConfig.purpose || 'general',
          'x-goog-meta-userid': userId,
          'x-goog-meta-uploadid': uploadId,
          'x-goog-meta-originalfilename': fileName,
        },
      };

      const [uploadUrl] = await this.storage
        .bucket(this.mediaConfig.gcs.bucketName)
        .file(key)
        .getSignedUrl(writeOptions);

      const cdnUrl = this.generateCdnUrl(key);

      // Generate conditions array for client-side validation
      const conditions = [
        ['content-length-range', 0, maxFileSizeBytes],
        ['starts-with', '$Content-Type', mimeType.split('/')[0]],
      ];

      this.logger.debug(
        `Generated GCS presigned URL for ${
          purposeConfig.purpose || 'general'
        } upload: ${key} (max: ${purposeConfig.maxSizeMb}MB)`,
      );

      const result: PresignedUrlResult = {
        presignedUrl: uploadUrl,
        key,
        expiresAt,
        cdnUrl,
        uploadId,
        maxFileSizeBytes,
        method: 'PUT',
        conditions,
        fields: {
          'Content-Type': mimeType,
          'x-goog-meta-purpose': purposeConfig.purpose || 'general',
          'x-goog-meta-userid': userId,
          'x-goog-meta-uploadid': uploadId,
          'x-goog-meta-originalfilename': fileName,
        },
      };

      // Only include thumbnail URL for image files
      if (this.isImageMimeType(mimeType)) {
        result.thumbnailUrl = this.generateThumbnailUrl(key);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate GCS presigned URL: ${error}`);
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
    if (lastDot === -1) return '';
    return fileName.substring(lastDot);
  }

  private extractMimeTypeFromFileName(fileName: string): string {
    const ext = this.getFileExtension(fileName).toLowerCase();
    const mimeTypeMap: Record<string, string> = {
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
    return mimeTypeMap[ext] || 'application/octet-stream';
  }

  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private generateCdnUrl(key: string): string {
    const cdnBaseUrl = this.mediaConfig.cloudflare?.cdnBaseUrl;
    if (cdnBaseUrl) {
      return `${cdnBaseUrl}/${key}`;
    }
    // Fallback to GCS public URL
    return `https://storage.googleapis.com/${this.mediaConfig.gcs.bucketName}/${key}`;
  }

  private generateThumbnailUrl(key: string): string {
    const cdnBaseUrl = this.mediaConfig.cloudflare?.cdnBaseUrl;
    const thumbnailKey = `thumbnails/${key}`;

    if (cdnBaseUrl) {
      return `${cdnBaseUrl}/${thumbnailKey}`;
    }
    // Fallback to GCS public URL
    return `https://storage.googleapis.com/${this.mediaConfig.gcs.bucketName}/${thumbnailKey}`;
  }

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
      const file = this.storage
        .bucket(this.mediaConfig.gcs.bucketName)
        .file(key);

      const [metadata] = await file.getMetadata();
      const actualSize = parseInt(String(metadata.size || '0'), 10);
      const actualMimeType = metadata.contentType;

      const isValid =
        actualSize <= expectedMaxSize &&
        (actualMimeType === expectedMimeType ||
          actualMimeType?.startsWith(expectedMimeType.split('/')[0]));

      return {
        isValid,
        actualSize,
        actualMimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to validate uploaded file: ${error}`);
      return { isValid: false };
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.storage
        .bucket(this.mediaConfig.gcs.bucketName)
        .file(key)
        .delete();

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
      const readOptions: GetSignedUrlConfig = {
        version: 'v4',
        action: 'read',
        expires: new Date(Date.now() + expiresIn * 1000),
      };

      const [url] = await this.storage
        .bucket(this.mediaConfig.gcs.bucketName)
        .file(key)
        .getSignedUrl(readOptions);

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate read URL: ${error}`);
      throw new PresignedUrlGenerationFailedError(error.message);
    }
  }
}

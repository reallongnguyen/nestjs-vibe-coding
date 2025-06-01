import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationService } from './validation.service';
import { GcsService } from './gcs.service';
import { PresignedUrlResult } from './storage-provider.interface';
import { CreatePresignedUrlDto } from '../presentation/dto/create-presigned-url.dto';
import {
  getPurposeConfig,
  validatePurposeRequirements,
  MediaConfig,
} from '../media.config';
import {
  ValidationFailedError,
  ConfigurationError,
} from '../entities/errors/media.error-classes';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly storageProvider: string;

  constructor(
    private validationService: ValidationService,
    private gcsService: GcsService,
    private configService: ConfigService,
  ) {
    const mediaConfig = this.configService.get<MediaConfig>('media');

    if (!mediaConfig) {
      throw new ConfigurationError('Media configuration not found');
    }

    this.storageProvider = mediaConfig.storageProvider || 'gcs';
    this.logger.log(
      `Using ${this.storageProvider.toUpperCase()} as storage provider`,
    );
  }

  async generatePresignedUrl(
    userId: string,
    request: CreatePresignedUrlDto,
  ): Promise<PresignedUrlResult> {
    const purpose = request.purpose || 'general';

    this.logger.log(
      `Generating presigned URL for user: ${userId}, purpose: ${purpose}, file: ${request.fileName}`,
    );

    // Get purpose-specific configuration
    const purposeConfig = getPurposeConfig(purpose);

    // Validate purpose-specific requirements
    const validation = validatePurposeRequirements(purpose, {});

    if (!validation.isValid) {
      throw new ValidationFailedError(validation.errors);
    }

    // Validate file with purpose-specific rules
    this.validationService.validateFileName(request.fileName);
    this.validationService.validateFileSize(
      request.fileSize,
      purposeConfig.maxSizeMb,
    );
    this.validationService.validateMimeType(
      request.mimeType,
      purposeConfig.allowedMimeTypes,
    );

    // Use the configured storage provider
    const result = await this.gcsService.generatePresignedUrl(
      userId,
      request.fileName,
      purpose,
      {},
    );

    this.logger.log(`Generated presigned URL for purpose: ${purpose}`);

    return result;
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
    return this.gcsService.validateUploadedFile(
      key,
      expectedMaxSize,
      expectedMimeType,
    );
  }

  async deleteFile(key: string): Promise<void> {
    return this.gcsService.deleteFile(key);
  }

  async generateReadUrl(key: string, expiresIn?: number): Promise<string> {
    return this.gcsService.generateReadUrl(key, expiresIn);
  }

  getMaxFileSize(purpose?: string): { mb: number; bytes: number } {
    const purposeConfig = getPurposeConfig(purpose || 'general');
    const mb = purposeConfig.maxSizeMb;
    return {
      mb,
      bytes: mb * 1024 * 1024,
    };
  }

  getSupportedMimeTypes(purpose?: string): string[] {
    const purposeConfig = getPurposeConfig(purpose || 'general');
    return purposeConfig.allowedMimeTypes;
  }

  getPurposeConfiguration(purpose: string): any {
    return getPurposeConfig(purpose);
  }

  getStorageProvider(): string {
    const mediaConfig = this.configService.get<MediaConfig>('media');
    return mediaConfig?.storageProvider || 'gcs';
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }
}

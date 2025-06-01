import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FileTooLargeError,
  InvalidFileTypeError,
  InvalidMimeTypeError,
} from '../entities/errors/media.error-classes';
import { MediaConfig } from '../media.config';

@Injectable()
export class ValidationService {
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
  ];

  constructor(private readonly configService: ConfigService) {}

  validateFileSize(fileSize: number, maxSizeMb?: number): void {
    const maxSizeBytes = maxSizeMb
      ? maxSizeMb * 1024 * 1024
      : this.getMaxFileSizeInBytes();

    if (fileSize > maxSizeBytes) {
      throw new FileTooLargeError(fileSize, maxSizeBytes);
    }
  }

  validateMimeType(mimeType: string, allowedTypes?: string[]): void {
    const typesToCheck = allowedTypes || this.allowedImageTypes;

    if (!typesToCheck.includes(mimeType.toLowerCase())) {
      throw new InvalidMimeTypeError(mimeType);
    }
  }

  validateImageType(mimeType: string): void {
    this.validateMimeType(mimeType, this.allowedImageTypes);
  }

  validateFileName(fileName: string): void {
    if (!fileName || fileName.trim().length === 0) {
      throw new InvalidFileTypeError(fileName, ['non-empty filename']);
    }

    const extension = this.getFileExtension(fileName);
    if (!extension) {
      throw new InvalidFileTypeError(fileName, ['file with extension']);
    }
  }

  getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return fileName.substring(lastDot);
  }

  private getMaxFileSizeInBytes(): number {
    const mediaConfig = this.configService.get<MediaConfig>('media');
    return mediaConfig.globalSettings.maxSizeMb * 1024 * 1024;
  }

  getMaxFileSizeInMb(): number {
    const mediaConfig = this.configService.get<MediaConfig>('media');
    return mediaConfig.globalSettings.maxSizeMb;
  }
}

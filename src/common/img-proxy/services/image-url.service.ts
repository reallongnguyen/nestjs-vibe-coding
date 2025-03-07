import { Injectable } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

export enum ImageSize {
  // Thumbnails
  TINY = 32, // Icon size
  SMALL = 64, // Small thumbnail
  MEDIUM = 128, // Medium thumbnail
  LARGE = 256, // Large thumbnail

  // Content sizes
  CONTENT_SM = 640, // Small content (e.g., mobile)
  CONTENT_MD = 1024, // Medium content (e.g., tablet)
  CONTENT_LG = 1440, // Large content (e.g., desktop)
  CONTENT_XL = 1920, // Extra large (e.g., large desktop)
  CONTENT_2XL = 2560, // 2K displays
  CONTENT_4K = 3840, // 4K displays
}

export interface ImageProcessingOptions {
  // Size options
  width?: number | ImageSize;
  height?: number | ImageSize;

  // Format options
  format?: 'jpg' | 'webp' | 'avif';
  quality?: number;
  resizeType?: 'fit' | 'fill' | 'auto';

  // Thumbnail options
  generateThumbnail?: boolean;
  thumbnailSize?: ImageSize;
  thumbnailResizeType?: 'fit' | 'fill' | 'auto';
  thumbnailQuality?: number;
}

export interface ImageUrlSet {
  original: string;
  thumbnail?: string; // Optional now since thumbnail generation is configurable
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  // Original image defaults
  width: undefined,
  height: undefined,
  format: 'webp',
  quality: 85,
  resizeType: 'fit',

  // Thumbnail defaults
  generateThumbnail: false,
  thumbnailSize: ImageSize.SMALL,
  thumbnailResizeType: 'fill',
  thumbnailQuality: 80,
};

@Injectable()
export class ImageUrlService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cache: Cache,
  ) {}

  async generateImageUrlMap(
    entity: any,
    options: ImageProcessingOptions = {},
  ): Promise<{ [key: string]: ImageUrlSet }> {
    const gcsPaths = this.findGCSPaths(entity);
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    const imageUrlMap = await gcsPaths.reduce(
      async (accPromise, path) => {
        const acc = await accPromise;

        // Generate original URL
        const originalUrl = await this.getCachedUrl(path, {
          width: finalOptions.width,
          height: finalOptions.height,
          format: finalOptions.format,
          quality: finalOptions.quality,
          resizeType: finalOptions.resizeType,
        });

        // Generate thumbnail URL if requested
        const thumbnailUrl = finalOptions.generateThumbnail
          ? await this.getCachedUrl(path, {
              width: finalOptions.thumbnailSize,
              height: finalOptions.thumbnailSize,
              format: finalOptions.format,
              quality: finalOptions.thumbnailQuality,
              resizeType: finalOptions.thumbnailResizeType,
            })
          : undefined;

        return {
          ...acc,
          [path]: {
            original: originalUrl,
            ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
          },
        };
      },
      Promise.resolve({} as { [key: string]: ImageUrlSet }),
    );

    return imageUrlMap;
  }

  /**
   * Generate a signed URL for image processing
   * @param bucketPath - GCS bucket path (e.g., 'user-assets/profile/image.jpg')
   * @param options - Image processing options
   * @returns Signed image URL
   */
  generateSignedUrl(
    bucketPath: string,
    options: ImageProcessingOptions = {},
  ): string {
    const processingPath = this.buildProcessingPath(options);
    const format = options.format || 'auto';
    const path = `/${processingPath}/plain/gs://${bucketPath}@${format}`;
    const signature = this.generateSignature(path);

    return `${this.configService.get('imageProxy.url')}/${signature}${path}`;
  }

  private async getCachedUrl(
    path: string,
    options: ImageProcessingOptions,
  ): Promise<string> {
    const url = this.generateSignedUrl(path.replace('gs://', ''), options);

    return url;
  }

  private createCacheKey(
    path: string,
    options: ImageProcessingOptions,
  ): string {
    return `img:${path}:${JSON.stringify(options)}`;
  }

  private findGCSPaths(obj: any, paths: string[] = []): string[] {
    if (!obj || typeof obj !== 'object') {
      return paths;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (typeof item === 'string' && item.startsWith('gs://')) {
          paths.push(item);
        } else {
          this.findGCSPaths(item, paths);
        }
      });
    } else {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string' && value.startsWith('gs://')) {
          paths.push(value);
        } else if (typeof value === 'object' && value !== null) {
          this.findGCSPaths(value, paths);
        }
      }
    }

    return paths;
  }

  private buildProcessingPath(options: ImageProcessingOptions): string {
    const parts: string[] = [];

    if (options.resizeType && (options.width || options.height)) {
      parts.push(
        `resize:${options.resizeType}:${options.width || '0'}:${
          options.height || '0'
        }:1`,
      );
    }

    if (options.quality) {
      parts.push(`quality:${options.quality}`);
    }

    return parts.length > 0 ? `${parts.join('/')}` : '';
  }

  private generateSignature(path: string): string {
    const key = Buffer.from(this.configService.get('imageProxy.key'), 'hex');
    const salt = Buffer.from(this.configService.get('imageProxy.salt'), 'hex');
    return createHmac('sha256', key)
      .update(salt)
      .update(path)
      .digest('base64url');
  }
}

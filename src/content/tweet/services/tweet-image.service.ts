import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { isURL } from 'class-validator';
import axios from 'axios';
import { EventBus } from '@nestjs/cqrs';
import { TweetImageCleanupEvent } from '../events/tweet-image-cleanup.event';

interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class TweetImageService {
  private readonly logger = new Logger(TweetImageService.name);
  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private static readonly VALIDATION_TIMEOUT = 5000; // 5 seconds

  constructor(private readonly eventBus: EventBus) {}

  async validateImages(imageUrls: string[]): Promise<void> {
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    if (imageUrls.length > 4) {
      throw new BadRequestException('Maximum of 4 images allowed per tweet');
    }

    const validationResults = await Promise.all(
      imageUrls.map((url) => this.validateImage(url)),
    );

    const errors = validationResults
      .map((result, index) => {
        if (!result.isValid) {
          return `Image ${index + 1}: ${result.error}`;
        }
        return null;
      })
      .filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(', '));
    }
  }

  private async validateImage(url: string): Promise<ImageValidationResult> {
    try {
      // Validate URL format
      if (!isURL(url)) {
        return {
          isValid: false,
          error: 'Invalid URL format',
        };
      }

      // Fetch image headers with timeout
      const response = await axios.head(url, {
        timeout: TweetImageService.VALIDATION_TIMEOUT,
        validateStatus: (status) => status === 200,
      });

      // Validate content type
      const contentType = response.headers['content-type'];
      if (!TweetImageService.ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
          isValid: false,
          error:
            'Invalid image format. Supported formats: JPEG, PNG, GIF, WebP',
        };
      }

      // Validate file size
      const contentLength = parseInt(response.headers['content-length'], 10);
      if (
        Number.isNaN(contentLength) ||
        contentLength > TweetImageService.MAX_IMAGE_SIZE
      ) {
        return {
          isValid: false,
          error: 'Image size exceeds maximum allowed size of 5MB',
        };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error(`Failed to validate image URL ${url}:`, error);
      return {
        isValid: false,
        error: 'Failed to validate image. Please ensure the URL is accessible',
      };
    }
  }

  async triggerCleanup(imageUrls: string[], tweetId: string): Promise<void> {
    try {
      await this.eventBus.publish(
        new TweetImageCleanupEvent({
          tweetId,
          imageUrls,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger cleanup for tweet ${tweetId} images:`,
        error,
      );
    }
  }
}

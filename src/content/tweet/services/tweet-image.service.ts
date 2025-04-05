import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { IEventBus } from 'src/common/event-manager';
import { TweetErrorFactory } from '../entities/errors';
import { TweetImageCleanupEvent } from '../entities/events/tweet.events';

@Injectable()
export class TweetImageService {
  private static readonly GCS_URL_PATTERN =
    /^gs:\/\/([^/]+)\/images\/users\/([^/]+)\/tweets\/([^/]+)\//;
  private readonly expectedBucket: string;
  private readonly logger = new Logger(TweetImageService.name);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly configService: ConfigService,
  ) {
    this.expectedBucket = this.configService.get<string>(
      'storage.bucket',
      'isling-storage',
    );
  }

  async validateImages(imageUrls: string[], userId?: string): Promise<void> {
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    if (imageUrls.length > 4) {
      throw TweetErrorFactory.imageLimitExceeded();
    }

    const invalidUrls = imageUrls.filter((url) => !this.isValidGcsUrl(url));
    if (invalidUrls.length > 0) {
      throw TweetErrorFactory.imageInvalid(invalidUrls);
    }

    // If userId is provided, verify that it matches all URLs
    if (userId) {
      this.verifyUserIdInUrls(imageUrls, userId);
    }

    // Verify bucket name
    this.verifyBucketInUrls(imageUrls);
  }

  private isValidGcsUrl(url: string): boolean {
    return TweetImageService.GCS_URL_PATTERN.test(url);
  }

  private verifyUserIdInUrls(urls: string[], userId: string): void {
    for (const url of urls) {
      const match = TweetImageService.GCS_URL_PATTERN.exec(url);
      if (match) {
        const urlUserId = match[2];
        if (urlUserId !== userId) {
          throw TweetErrorFactory.imageUserMismatch(urlUserId, userId);
        }
      }
    }
  }

  private verifyBucketInUrls(urls: string[]): void {
    for (const url of urls) {
      const match = TweetImageService.GCS_URL_PATTERN.exec(url);
      if (match) {
        const bucket = match[1];
        if (bucket !== this.expectedBucket) {
          throw TweetErrorFactory.imageBucketInvalid(
            bucket,
            this.expectedBucket,
          );
        }
      }
    }
  }

  async triggerCleanup(imageUrls: string[], tweetId: string): Promise<void> {
    try {
      await Promise.all(
        imageUrls.map((imageUrl) =>
          this.eventBus.publish(new TweetImageCleanupEvent(imageUrl)),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger cleanup for tweet ${tweetId} images:`,
        error,
      );
    }
  }
}

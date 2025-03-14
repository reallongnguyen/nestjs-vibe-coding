import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { OnEvent } from '@nestjs/event-emitter';
import { Retry } from 'src/common/decorators/retry.decorator';
import { ContentProcessedEvent } from '../entities/events/content.event';

@Injectable()
export class FeedCacheService {
  private readonly redis: Redis;
  private readonly USER_FEED_PREFIX = 'feed:user:';
  private readonly CACHE_TTL = 60; // 1 minute

  constructor(
    redisService: RedisService,
    private readonly logger: Logger,
  ) {
    this.redis = redisService.getOrThrow();
  }

  @Retry({
    maxAttempts: 2,
  })
  async getCachedFeed(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<any> {
    const cacheKey = this.createUserFeedKey(userId, offset, limit);
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  @Retry({
    maxAttempts: 2,
  })
  async cacheFeed(
    userId: string,
    offset: number,
    limit: number,
    feed: any,
  ): Promise<void> {
    const cacheKey = this.createUserFeedKey(userId, offset, limit);
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(feed));
  }

  @OnEvent('content.processed')
  async handleContentProcessed(event: ContentProcessedEvent): Promise<void> {
    try {
      await this.invalidateUserFeeds();
      const payload = event.toJSON();
      this.logger.log(
        `Cache invalidated for content: ${payload.type} ${payload.id}`,
      );
    } catch (error) {
      const payload = event.toJSON();
      this.logger.error(
        `Failed to invalidate cache for content ${payload.id}: ${error.message}`,
      );
    }
  }

  @Retry({
    maxAttempts: 2,
  })
  async invalidateUserFeeds(): Promise<void> {
    const pattern = `${this.USER_FEED_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.log(`Invalidated ${keys.length} feed cache entries`);
    }
  }

  private createUserFeedKey(
    userId: string,
    offset: number,
    limit: number,
  ): string {
    return `${this.USER_FEED_PREFIX}${userId}:${offset}:${limit}`;
  }
}

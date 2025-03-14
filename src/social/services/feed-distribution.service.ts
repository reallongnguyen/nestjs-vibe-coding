import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { Retry } from 'src/common/decorators/retry.decorator';
import { ContentProcessedEvent } from '../entities/events/content.event';
import { FeedItem } from '../entities/feed-content.entity';

@Injectable()
export class FeedDistributionService {
  private readonly redis: Redis;
  private readonly GLOBAL_FEED_KEY = 'feed:global';
  private readonly FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    redisService: RedisService,
    private readonly logger: Logger,
  ) {
    this.redis = redisService.getOrThrow();
  }

  @Retry({
    maxAttempts: 3,
  })
  async distributeContent(content: ContentProcessedEvent): Promise<void> {
    const contentKey = this.createContentKey(content);
    const contentData = content.toJSON();

    if (contentData.score === 0) {
      await this.removeFromFeed(contentKey);
      return;
    }

    await this.addToFeed(content, contentKey);
  }

  @Retry({
    maxAttempts: 2,
  })
  async getGlobalFeed(offset: number, limit: number): Promise<FeedItem[]> {
    const contentKeys = await this.redis.zrevrange(
      this.GLOBAL_FEED_KEY,
      offset,
      offset + limit - 1,
    );

    if (!contentKeys.length) {
      return [];
    }

    const contents = await Promise.all(
      contentKeys.map((key) => this.redis.get(key)),
    );

    return contents
      .filter(Boolean)
      .map((content) => JSON.parse(content) as FeedItem);
  }

  async getTotalFeedCount(): Promise<number> {
    return this.redis.zcard(this.GLOBAL_FEED_KEY);
  }

  private async removeFromFeed(contentKey: string): Promise<void> {
    await Promise.all([
      this.redis.zrem(this.GLOBAL_FEED_KEY, contentKey),
      this.redis.del(contentKey),
    ]);
    this.logger.log(`Removed content ${contentKey} from feed`);
  }

  private async addToFeed(
    content: ContentProcessedEvent,
    contentKey: string,
  ): Promise<void> {
    const contentData = content.toJSON();
    await Promise.all([
      this.redis.zadd(this.GLOBAL_FEED_KEY, contentData.score, contentKey),
      this.redis.setex(
        contentKey,
        this.FEED_TTL,
        JSON.stringify({
          type: contentData.type,
          id: contentData.id,
          score: contentData.score,
          timestamp: contentData.timestamp,
        }),
      ),
    ]);
  }

  private createContentKey(content: ContentProcessedEvent): string {
    const contentData = content.toJSON();
    return `feed:content:${contentData.type}:${contentData.id}`;
  }
}

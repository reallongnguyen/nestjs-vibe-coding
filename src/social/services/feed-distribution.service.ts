import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
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

  async distributeContent(content: ContentProcessedEvent): Promise<void> {
    const contentKey = this.createContentKey(content);

    if (content.score === 0) {
      await this.removeFromFeed(contentKey);
      return;
    }

    await this.addToFeed(content, contentKey);
  }

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
      contentKeys.map((key) => this.redis.get(key).then(JSON.parse)),
    );

    return contents.filter(Boolean) as FeedItem[];
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
    await Promise.all([
      this.redis.zadd(this.GLOBAL_FEED_KEY, content.score, contentKey),
      this.redis.setex(
        contentKey,
        this.FEED_TTL,
        JSON.stringify({
          type: content.type,
          id: content.id,
          score: content.score,
          timestamp: content.timestamp,
        }),
      ),
    ]);
  }

  private createContentKey(content: ContentProcessedEvent): string {
    return `feed:content:${content.type}:${content.id}`;
  }
}

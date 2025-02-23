import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { ContentProcessedEvent } from '../entities/events/content.event';

@Injectable()
export class FeedDistributionService {
  private readonly redis: Redis | null;
  private readonly GLOBAL_FEED_KEY = 'feed:global';
  private readonly FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    redisService: RedisService,
    private readonly logger: Logger,
  ) {
    this.redis = redisService.getOrThrow();
  }

  @OnEvent('content.processed')
  async handleContentProcessed(event: ContentProcessedEvent): Promise<void> {
    try {
      await this.addToGlobalFeed(event);
      this.logger.log(
        `Content ${event.id} added to global feed with score ${event.score}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to distribute content ${event.id}: ${error.message}`,
      );
      throw error;
    }
  }

  private async addToGlobalFeed(content: ContentProcessedEvent): Promise<void> {
    const contentKey = this.createContentKey(content);

    await Promise.all([
      // Add to sorted set with score
      this.redis.zadd(this.GLOBAL_FEED_KEY, content.score, contentKey),
      // Store content details with TTL
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

  async getGlobalFeed(offset: number, limit: number): Promise<any[]> {
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

    return contents.filter(Boolean); // Remove any null values from expired keys
  }

  async getTotalFeedCount(): Promise<number> {
    return this.redis.zcard(this.GLOBAL_FEED_KEY);
  }

  private createContentKey(content: ContentProcessedEvent): string {
    return `feed:content:${content.type}:${content.id}`;
  }
}

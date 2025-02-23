import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { GetFeedInput } from './dto/get-feed.input';
import { GetFeedOutput } from './dto/get-feed.output';
import { FeedDistributionService } from './feed-distribution.service';

@Injectable()
export class FeedService {
  private readonly redis: Redis | null;
  private readonly CACHE_TTL = 60; // 1 minute

  constructor(
    private readonly distributionService: FeedDistributionService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getOrThrow();
  }

  // private calculateScore(intensity: number, createdAt: Date): number {
  //   const timeDiff = (Date.now() - createdAt.getTime()) / 1000 / 60 / 60;
  //   return (intensity * 1000) / (timeDiff + 1);
  // }

  async getFeed(input: GetFeedInput): Promise<GetFeedOutput> {
    const cacheKey = `feed:user:${input.userId}:${input.offset}:${input.limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get feed items from Redis sorted set
    const feedItems = await this.distributionService.getGlobalFeed(
      input.offset,
      input.limit,
    );

    // Fetch full content details from database
    const enrichedItems = await this.enrichFeedItems(feedItems);

    const result = {
      total: await this.distributionService.getTotalFeedCount(),
      items: enrichedItems,
    };

    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    return result;
  }

  private async enrichFeedItems(feedItems: any[]): Promise<any[]> {
    // Implementation coming in next PR
    return feedItems;
  }
}

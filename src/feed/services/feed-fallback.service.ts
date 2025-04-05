import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { PageOptionsDto } from 'src/common';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { FeedType } from '../entities/feed.types';
import { FeedItem } from '../entities/feed.entity';
import { FeedErrorFactory } from '../errors';

/**
 * Redis-based fallback service for feed generation
 * Used when Gorse recommendation service is unavailable
 */
@Injectable()
export class FeedFallbackService {
  private readonly redis: Redis;
  private readonly FEED_FALLBACK_PREFIX = 'feed:fallback:';
  private readonly TRENDING_KEY = 'feed:trending';
  private readonly LATEST_KEY = 'feed:latest';
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly MAX_ITEMS = 1000; // Maximum items to keep in sorted sets

  constructor(
    private readonly redisService: RedisService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Get feed items using fallback strategy
   */
  async getFallbackFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): Promise<FeedItem[]> {
    try {
      switch (feedType) {
        case FeedType.PERSONALIZED:
          return this.getPersonalizedFallback(userId, pageOptions);
        case FeedType.TRENDING:
          return this.getTrendingFallback(pageOptions);
        case FeedType.LATEST:
          return this.getLatestFallback(pageOptions);
        default:
          throw FeedErrorFactory.feedGenerationFailed(
            new Error(`Invalid feed type: ${feedType}`),
          );
      }
    } catch (error) {
      this.logger.error('Failed to get fallback feed', {
        error,
        userId,
        feedType,
      });
      if (error instanceof Error) {
        throw FeedErrorFactory.feedGenerationFailed(error);
      }
      throw FeedErrorFactory.feedGenerationFailed();
    }
  }

  /**
   * Add content to fallback feed with score
   */
  async addToFallback(
    contentId: string,
    score: number,
    timestamp: Date,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const member = JSON.stringify({ id: contentId, ...metadata });

      // Add to trending sorted set with engagement score
      await this.redis
        .multi()
        .zadd(this.TRENDING_KEY, score, member)
        .zremrangebyrank(this.TRENDING_KEY, 0, -this.MAX_ITEMS - 1)
        .expire(this.TRENDING_KEY, this.DEFAULT_TTL)
        .exec();

      // Add to latest sorted set with timestamp score
      await this.redis
        .multi()
        .zadd(this.LATEST_KEY, timestamp.getTime(), member)
        .zremrangebyrank(this.LATEST_KEY, 0, -this.MAX_ITEMS - 1)
        .expire(this.LATEST_KEY, this.DEFAULT_TTL)
        .exec();
    } catch (error) {
      this.logger.error('Failed to add content to fallback', {
        error,
        contentId,
      });
      throw FeedErrorFactory.feedGenerationFailed(
        error instanceof Error ? error : new Error('Unknown error'),
      );
    }
  }

  /**
   * Get personalized fallback feed (mix of trending and latest)
   */
  private async getPersonalizedFallback(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<FeedItem[]> {
    const trendingRatio = 0.7; // 70% trending, 30% latest

    const trendingPageSize = Math.ceil(pageOptions.pageSize * trendingRatio);
    const latestPageSize = pageOptions.pageSize - trendingPageSize;

    const [trending, latest] = await Promise.all([
      this.getTrendingFallback(
        new PageOptionsDto(pageOptions.pageNumber, trendingPageSize),
      ),
      this.getLatestFallback(
        new PageOptionsDto(pageOptions.pageNumber, latestPageSize),
      ),
    ]);

    return [...trending, ...latest];
  }

  /**
   * Get trending fallback feed
   */
  private async getTrendingFallback(
    pageOptions: PageOptionsDto,
  ): Promise<FeedItem[]> {
    const { skip, take } = pageOptions.toDatabaseQuery();

    const items = await this.redis.zrevrange(
      this.TRENDING_KEY,
      skip,
      take - 1,
      'WITHSCORES',
    );

    return this.parseSortedSetItems(items);
  }

  /**
   * Get latest fallback feed
   */
  private async getLatestFallback(
    pageOptions: PageOptionsDto,
  ): Promise<FeedItem[]> {
    const { skip, take } = pageOptions.toDatabaseQuery();

    const items = await this.redis.zrevrange(
      this.LATEST_KEY,
      skip,
      take - 1,
      'WITHSCORES',
    );

    return this.parseSortedSetItems(items);
  }

  /**
   * Parse sorted set items into feed items
   */
  private parseSortedSetItems(items: string[]): FeedItem[] {
    const result: FeedItem[] = [];

    for (let i = 0; i < items.length; i += 2) {
      const item = JSON.parse(items[i]);
      const score = parseFloat(items[i + 1]);

      result.push({
        id: item.id,
        type: item.type,
        score,
        content: item.content,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      });
    }

    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { AppError, PageOptionsDto } from 'src/common';
import { FeedType } from '../entities/feed.types';
import { FeedItem } from '../entities/feed.entity';

/**
 * Advanced feed cache management service
 * Handles cache warming, invalidation, and monitoring
 */
@Injectable()
export class FeedCacheManagerService {
  private readonly redis: Redis;
  private readonly FEED_CACHE_PREFIX = 'feed:cache:';
  private readonly FEED_STATS_PREFIX = 'feed:stats:';
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly STATS_TTL = 86400; // 24 hours

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Get feed items from cache with monitoring
   */
  async getFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): Promise<FeedItem[] | null> {
    try {
      const key = this.getCacheKey(userId, pageOptions, feedType);
      const cached = await this.redis.get(key);

      // Update cache stats
      await this.updateCacheStats(userId, feedType, !!cached);

      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error('Failed to get feed from cache', {
        error,
        userId,
        feedType,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.cache.failed');
    }
  }

  /**
   * Cache feed items with TTL and monitoring
   */
  async cacheFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
    items: FeedItem[],
  ): Promise<void> {
    try {
      const key = this.getCacheKey(userId, pageOptions, feedType);
      await this.redis.setex(key, this.DEFAULT_TTL, JSON.stringify(items));

      // Update cache write stats
      await this.updateCacheWriteStats(userId, feedType);
    } catch (error) {
      this.logger.error('Failed to cache feed', { error, userId, feedType });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.cache.failed');
    }
  }

  /**
   * Invalidate user's feed cache with monitoring
   */
  async invalidateUserFeed(userId: string, feedType?: FeedType): Promise<void> {
    try {
      const pattern = feedType
        ? `${this.FEED_CACHE_PREFIX}${userId}:${feedType}:*`
        : `${this.FEED_CACHE_PREFIX}${userId}:*`;

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} feed cache entries for user ${userId}`,
        );

        // Update invalidation stats
        await this.updateInvalidationStats(userId, feedType);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate user feed cache', {
        error,
        userId,
        feedType,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.cache.failed');
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(
    userId: string,
    feedType: FeedType,
  ): Promise<{
    hits: number;
    misses: number;
    writes: number;
    invalidations: number;
  }> {
    const statsKey = this.getStatsKey(userId, feedType);
    const stats = await this.redis.hgetall(statsKey);

    return {
      hits: parseInt(stats.hits || '0', 10),
      misses: parseInt(stats.misses || '0', 10),
      writes: parseInt(stats.writes || '0', 10),
      invalidations: parseInt(stats.invalidations || '0', 10),
    };
  }

  /**
   * Update cache hit/miss statistics
   */
  private async updateCacheStats(
    userId: string,
    feedType: FeedType,
    isHit: boolean,
  ): Promise<void> {
    const statsKey = this.getStatsKey(userId, feedType);
    const field = isHit ? 'hits' : 'misses';

    await this.redis
      .multi()
      .hincrby(statsKey, field, 1)
      .expire(statsKey, this.STATS_TTL)
      .exec();
  }

  /**
   * Update cache write statistics
   */
  private async updateCacheWriteStats(
    userId: string,
    feedType: FeedType,
  ): Promise<void> {
    const statsKey = this.getStatsKey(userId, feedType);

    await this.redis
      .multi()
      .hincrby(statsKey, 'writes', 1)
      .expire(statsKey, this.STATS_TTL)
      .exec();
  }

  /**
   * Update cache invalidation statistics
   */
  private async updateInvalidationStats(
    userId: string,
    feedType?: FeedType,
  ): Promise<void> {
    if (!feedType) {
      // Update stats for all feed types
      const types = Object.values(FeedType);
      await Promise.all(
        types.map(async (type) => {
          const statsKey = this.getStatsKey(userId, type);
          await this.redis
            .multi()
            .hincrby(statsKey, 'invalidations', 1)
            .expire(statsKey, this.STATS_TTL)
            .exec();
        }),
      );
    } else {
      const statsKey = this.getStatsKey(userId, feedType);
      await this.redis
        .multi()
        .hincrby(statsKey, 'invalidations', 1)
        .expire(statsKey, this.STATS_TTL)
        .exec();
    }
  }

  /**
   * Get cache key for feed items
   */
  private getCacheKey(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): string {
    return `${this.FEED_CACHE_PREFIX}${userId}:${feedType}:${pageOptions.pageNumber}:${pageOptions.pageSize}`;
  }

  /**
   * Get stats key for feed cache monitoring
   */
  private getStatsKey(userId: string, feedType: FeedType): string {
    return `${this.FEED_STATS_PREFIX}${userId}:${feedType}`;
  }
}

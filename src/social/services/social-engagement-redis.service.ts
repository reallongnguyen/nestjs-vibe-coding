import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ContentType } from '../entities/events/social.events';
import { RedisOperationError } from '../entities/social.error';

const LIKE_SET_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const VIEW_SET_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const LOCK_TTL = 30; // 30 seconds
const VIEW_RECENT_TTL = 600; // 10 minutes
const HLL_CLEANUP_THRESHOLD = 1000000; // 1M unique viewers
const VIEW_BATCH_SIZE = 100;

@Injectable()
export class SocialEngagementRedisService {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Get Redis key for content likes
   * @param type Content type
   * @param contentId Content ID
   */
  private getLikeSetKey(type: ContentType, contentId: string): string {
    return `likes:${type}:${contentId}`;
  }

  /**
   * Get Redis key for content views
   * @param type Content type
   * @param contentId Content ID
   */
  private getViewSetKey(type: ContentType, contentId: string): string {
    return `views:${type}:${contentId}`;
  }

  /**
   * Get Redis key for view HyperLogLog
   * @param type Content type
   * @param contentId Content ID
   */
  private getViewHLLKey(type: ContentType, contentId: string): string {
    return `views:hll:${type}:${contentId}`;
  }

  /**
   * Get Redis key for recent view
   * @param type Content type
   * @param contentId Content ID
   * @param viewerHash Viewer hash
   */
  private getRecentViewKey(
    type: ContentType,
    contentId: string,
    viewerHash: string,
  ): string {
    return `views:recent:${type}:${contentId}:${viewerHash}`;
  }

  /**
   * Get Redis key for view batch
   * @param type Content type
   */
  private getViewBatchKey(type: ContentType): string {
    return `views:batch:${type}`;
  }

  /**
   * Get Redis key for like lock
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  private getLikeLockKey(
    type: ContentType,
    contentId: string,
    userId: string,
  ): string {
    return `like_lock:${type}:${contentId}:${userId}`;
  }

  /**
   * Check if content is liked by user
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async isContentLiked(
    type: ContentType,
    contentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const key = this.getLikeSetKey(type, contentId);
      const result = await this.redis.sismember(key, userId);
      return result === 1;
    } catch (error) {
      throw new RedisOperationError('isContentLiked', error);
    }
  }

  /**
   * Add like to Redis set
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async addLike(
    type: ContentType,
    contentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const key = this.getLikeSetKey(type, contentId);
      const pipeline = this.redis.pipeline();
      pipeline.sadd(key, userId);
      pipeline.expire(key, LIKE_SET_TTL);
      await pipeline.exec();
    } catch (error) {
      throw new RedisOperationError('addLike', error);
    }
  }

  /**
   * Remove like from Redis set
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async removeLike(
    type: ContentType,
    contentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const key = this.getLikeSetKey(type, contentId);
      await this.redis.srem(key, userId);
    } catch (error) {
      throw new RedisOperationError('removeLike', error);
    }
  }

  /**
   * Track content view in Redis using HyperLogLog
   * @param type Content type
   * @param contentId Content ID
   * @param viewerHash Viewer hash
   * @param viewerId Optional viewer ID
   */
  async trackView(
    type: ContentType,
    contentId: string,
    viewerHash: string,
    viewerId?: string,
  ): Promise<boolean> {
    try {
      const recentKey = this.getRecentViewKey(type, contentId, viewerHash);
      const hllKey = this.getViewHLLKey(type, contentId);
      const batchKey = this.getViewBatchKey(type);

      // Check recent views with TTL
      const isRecentView = await this.redis.get(recentKey);
      if (isRecentView) {
        return false;
      }

      // Set recent view flag with TTL
      await this.redis.setex(recentKey, VIEW_RECENT_TTL, '1');

      // Add to HyperLogLog and get count
      const pipeline = this.redis.pipeline();
      pipeline.pfadd(hllKey, viewerHash);
      pipeline.pfcount(hllKey);
      const results = await pipeline.exec();

      const isNewView = results?.[0]?.[1] === 1;
      const viewCount = results?.[1]?.[1] as number;

      // Check HLL size and cleanup if needed
      if (viewCount > HLL_CLEANUP_THRESHOLD) {
        await this.cleanupOldViews(type, contentId);
      }

      // Add to batch for processing if it's a new view
      if (isNewView) {
        const viewOperation = {
          type,
          contentId,
          viewerHash,
          viewerId,
          timestamp: new Date().toISOString(),
        };

        await this.redis.rpush(batchKey, JSON.stringify(viewOperation));

        // Process batch if full
        const batchSize = await this.redis.llen(batchKey);
        if (batchSize >= VIEW_BATCH_SIZE) {
          await this.processBatch(type);
        }
      }

      return isNewView;
    } catch (error) {
      throw new RedisOperationError('trackView', error);
    }
  }

  /**
   * Get view count from Redis HyperLogLog
   * @param type Content type
   * @param contentId Content ID
   */
  async getViewCount(type: ContentType, contentId: string): Promise<number> {
    try {
      const hllKey = this.getViewHLLKey(type, contentId);
      return await this.redis.pfcount(hllKey);
    } catch (error) {
      throw new RedisOperationError('getViewCount', error);
    }
  }

  /**
   * Process view batch
   * @param type Content type
   * @returns Array of view operations to process
   */
  async processBatch(type: ContentType): Promise<
    Array<{
      type: string;
      contentId: string;
      viewerHash: string;
      viewerId?: string;
      timestamp: string;
    }>
  > {
    try {
      const batchKey = this.getViewBatchKey(type);
      const pipeline = this.redis.pipeline();

      // Get all items in batch
      const items = await this.redis.lrange(batchKey, 0, -1);
      if (items.length === 0) {
        return [];
      }

      // Clear batch
      pipeline.del(batchKey);

      await pipeline.exec();

      // Return items for processing
      return items.map((item) => JSON.parse(item));
    } catch (error) {
      throw new RedisOperationError('processBatch', error);
    }
  }

  /**
   * Cleanup old views by archiving HyperLogLog data
   * @param type Content type
   * @param contentId Content ID
   */
  private async cleanupOldViews(
    type: ContentType,
    contentId: string,
  ): Promise<void> {
    try {
      const hllKey = this.getViewHLLKey(type, contentId);
      const archiveKey = `${hllKey}:archive:${Date.now()}`;

      // Rename current HLL to archive
      await this.redis.rename(hllKey, archiveKey);

      // Set TTL on archive
      await this.redis.expire(archiveKey, VIEW_SET_TTL);
    } catch (error) {
      throw new RedisOperationError('cleanupOldViews', error);
    }
  }

  /**
   * Get like count from Redis
   * @param type Content type
   * @param contentId Content ID
   */
  async getLikeCount(type: ContentType, contentId: string): Promise<number> {
    try {
      const key = this.getLikeSetKey(type, contentId);
      return await this.redis.scard(key);
    } catch (error) {
      throw new RedisOperationError('getLikeCount', error);
    }
  }

  /**
   * Acquire distributed lock for like operation
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async acquireLikeLock(
    type: ContentType,
    contentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const key = this.getLikeLockKey(type, contentId, userId);
      const result = await this.redis.set(key, '1', 'EX', LOCK_TTL, 'NX');
      return result === 'OK';
    } catch (error) {
      throw new RedisOperationError('acquireLikeLock', error);
    }
  }

  /**
   * Release distributed lock for like operation
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async releaseLikeLock(
    type: ContentType,
    contentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const key = this.getLikeLockKey(type, contentId, userId);
      await this.redis.del(key);
    } catch (error) {
      throw new RedisOperationError('releaseLikeLock', error);
    }
  }
}

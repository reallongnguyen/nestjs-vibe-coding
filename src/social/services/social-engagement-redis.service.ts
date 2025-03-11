import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ContentType } from '../entities/events/social.events';
import { RedisOperationError } from '../entities/social.error';

const LIKE_SET_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const VIEW_SET_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const LOCK_TTL = 30; // 30 seconds

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
   * Track content view in Redis
   * @param type Content type
   * @param contentId Content ID
   * @param viewerHash Viewer hash
   */
  async trackView(
    type: ContentType,
    contentId: string,
    viewerHash: string,
  ): Promise<boolean> {
    try {
      const key = this.getViewSetKey(type, contentId);
      const pipeline = this.redis.pipeline();
      pipeline.sadd(key, viewerHash);
      pipeline.expire(key, VIEW_SET_TTL);
      const results = await pipeline.exec();
      return results?.[0]?.[1] === 1;
    } catch (error) {
      throw new RedisOperationError('trackView', error);
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
   * Get view count from Redis
   * @param type Content type
   * @param contentId Content ID
   */
  async getViewCount(type: ContentType, contentId: string): Promise<number> {
    try {
      const key = this.getViewSetKey(type, contentId);
      return await this.redis.scard(key);
    } catch (error) {
      throw new RedisOperationError('getViewCount', error);
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

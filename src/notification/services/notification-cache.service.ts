import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../entities/notification.entity';

/**
 * Redis-based cache service for notifications
 * Provides better scalability and persistence compared to in-memory cache
 */
@Injectable()
export class NotificationCacheService implements OnModuleInit {
  private readonly redis: Redis;
  private readonly CACHE_PREFIX = 'notification:cache:';
  private readonly DEFAULT_TTL: number;
  private readonly NOTIFICATIONS_TTL: number;
  private readonly COUNTS_TTL: number;
  private readonly CLEANUP_INTERVAL: number;
  private cleanupTimer: NodeJS.Timeout;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.redis = this.redisService.getOrThrow();
    this.DEFAULT_TTL = this.configService.get('notification.cache.ttl', 60);
    this.NOTIFICATIONS_TTL = this.configService.get(
      'notification.cache.notificationsTtl',
      300,
    );
    this.COUNTS_TTL = this.configService.get(
      'notification.cache.countsTtl',
      60,
    );
    this.CLEANUP_INTERVAL =
      this.configService.get('notification.cache.cleanupInterval', 3600) * 1000;
  }

  /**
   * Initialize the cache service
   * Set up periodic cleanup of expired cache entries
   */
  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredEntries(),
      this.CLEANUP_INTERVAL,
    );
    this.logger.log(
      `NotificationCacheService initialized with cleanup interval: ${this.CLEANUP_INTERVAL}ms`,
    );
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredEntries() {
    try {
      this.logger.log('Starting cleanup of expired notification cache entries');
      const pattern = this.getCacheKey('*');
      const keys = await this.redis.keys(pattern);

      let expiredCount = 0;

      // Get TTL for all keys
      const ttlPromises = keys.map((key) => this.redis.ttl(key));
      const ttlResults = await Promise.all(ttlPromises);

      // Collect keys to delete
      const keysToDelete = keys.filter((_, index) => ttlResults[index] <= 0);

      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        expiredCount = keysToDelete.length;
      }

      this.logger.log(
        `Cleaned up ${expiredCount} expired notification cache entries`,
      );
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.cleanupExpiredEntries: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get cached notifications
   * @param key Cache key
   * @returns Cached notifications or null if not found
   */
  async getNotifications(key: string): Promise<Notification[] | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.getNotifications: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set cached notifications
   * @param key Cache key
   * @param notifications Notifications to cache
   * @param ttl TTL in seconds (optional)
   */
  async setNotifications(
    key: string,
    notifications: Notification[],
    ttl?: number,
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const ttlValue = ttl ?? this.NOTIFICATIONS_TTL;

      await this.redis.setex(cacheKey, ttlValue, JSON.stringify(notifications));
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.setNotifications: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get cached count
   * @param key Cache key
   * @returns Cached count or null if not found
   */
  async getCount(key: string): Promise<number | null> {
    try {
      const cacheKey = this.getCountKey(key);
      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        return null;
      }

      return parseInt(cached, 10);
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.getCount: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set cached count
   * @param key Cache key
   * @param count Count to cache
   * @param ttl TTL in seconds (optional)
   */
  async setCount(key: string, count: number, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getCountKey(key);
      const ttlValue = ttl ?? this.COUNTS_TTL;

      await this.redis.setex(cacheKey, ttlValue, count.toString());
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.setCount: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Invalidate all cache entries for a user
   * @param userId User ID
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = this.getCacheKey(`user:${userId}*`);
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} cache entries for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.invalidateUserCache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Invalidate all cache entries for a notification type
   * @param type Notification type
   */
  async invalidateTypeCache(type: string): Promise<void> {
    try {
      const pattern = this.getCacheKey(`type:${type}*`);
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} cache entries for notification type ${type}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in NotificationCacheService.invalidateTypeCache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get full cache key for notifications
   * @param key Base key
   * @returns Full cache key
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Get full cache key for counts
   * @param key Base key
   * @returns Full cache key
   */
  private getCountKey(key: string): string {
    return `${this.CACHE_PREFIX}count:${key}`;
  }
}

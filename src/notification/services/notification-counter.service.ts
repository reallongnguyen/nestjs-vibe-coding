import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { Retry } from 'src/common';

/**
 * Service for managing notification-related counters using Redis
 * Supports atomic operations and key expiration
 */
@Injectable()
export class NotificationCounterService {
  private readonly redis: Redis;
  private readonly COUNTER_PREFIX = 'notification:counter:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Increment a counter atomically
   * @param key Counter key
   * @param value Increment value (default: 1)
   * @param ttl TTL in seconds (optional)
   * @returns New counter value
   */
  @Retry({
    maxAttempts: 3,
    backoffMs: 1000,
  })
  async increment(key: string, ttl?: number, value = 1): Promise<number> {
    try {
      const counterKey = this.getCounterKey(key);
      const newValue = await this.redis.incrby(counterKey, value);

      if (ttl) {
        await this.redis.expire(counterKey, ttl);
      } else if ((await this.redis.ttl(counterKey)) === -1) {
        // Set default TTL if not already set
        await this.redis.expire(counterKey, this.DEFAULT_TTL);
      }

      this.logger.debug(
        `notification: counter: incremented ${key} by ${value} to ${newValue}`,
      );

      return newValue;
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to increment ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Decrement a counter atomically
   * @param key Counter key
   * @param value Decrement value (default: 1)
   * @param ttl TTL in seconds (optional)
   * @returns New counter value
   */
  @Retry({
    maxAttempts: 3,
    backoffMs: 1000,
  })
  async decrement(key: string, ttl?: number, value = 1): Promise<number> {
    try {
      const counterKey = this.getCounterKey(key);
      const newValue = await this.redis.decrby(counterKey, value);

      if (ttl) {
        await this.redis.expire(counterKey, ttl);
      } else if ((await this.redis.ttl(counterKey)) === -1) {
        // Set default TTL if not already set
        await this.redis.expire(counterKey, this.DEFAULT_TTL);
      }

      this.logger.debug(
        `notification: counter: decremented ${key} by ${value} to ${newValue}`,
      );

      return newValue;
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to decrement ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get current counter value
   * @param key Counter key
   * @returns Current value or 0 if not found
   */
  @Retry({
    maxAttempts: 2,
    backoffMs: 500,
  })
  async get(key: string): Promise<number> {
    try {
      const counterKey = this.getCounterKey(key);
      const value = await this.redis.get(counterKey);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to get ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Reset a counter to 0
   * @param key Counter key
   */
  @Retry({
    maxAttempts: 2,
    backoffMs: 500,
  })
  async reset(key: string): Promise<void> {
    try {
      const counterKey = this.getCounterKey(key);
      await this.redis.del(counterKey);
      this.logger.debug(`notification: counter: reset ${key}`);
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to reset ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Check if a counter exists
   * @param key Counter key
   * @returns True if counter exists
   */
  @Retry({
    maxAttempts: 2,
    backoffMs: 500,
  })
  async exists(key: string): Promise<boolean> {
    try {
      const counterKey = this.getCounterKey(key);
      return (await this.redis.exists(counterKey)) === 1;
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to check existence of ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get remaining TTL for a counter
   * @param key Counter key
   * @returns TTL in seconds or -2 if key doesn't exist, -1 if no TTL
   */
  @Retry({
    maxAttempts: 2,
    backoffMs: 500,
  })
  async getTTL(key: string): Promise<number> {
    try {
      const counterKey = this.getCounterKey(key);
      return await this.redis.ttl(counterKey);
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to get TTL for ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Set TTL for a counter
   * @param key Counter key
   * @param ttl TTL in seconds
   */
  @Retry({
    maxAttempts: 2,
    backoffMs: 500,
  })
  async setTTL(key: string, ttl: number): Promise<void> {
    try {
      const counterKey = this.getCounterKey(key);
      await this.redis.expire(counterKey, ttl);
      this.logger.debug(`notification: counter: set TTL for ${key} to ${ttl}s`);
    } catch (error) {
      this.logger.error(
        `notification: counter: failed to set TTL for ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get the full Redis key for a counter
   * @param key Counter key
   * @returns Full Redis key
   */
  private getCounterKey(key: string): string {
    return `${this.COUNTER_PREFIX}${key}`;
  }
}

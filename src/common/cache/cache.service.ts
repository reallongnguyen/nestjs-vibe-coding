import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly defaultTtl: number;

  constructor(
    redisService: RedisService,
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.redis = redisService.getOrThrow();
    this.defaultTtl = this.config.get('cache.ttl', 8);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached);
    } catch (error) {
      this.logger.error('Failed to get from cache', { error, key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlValue = ttl ?? this.defaultTtl;
      await this.redis.setex(key, ttlValue, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Failed to set cache', { error, key });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error('Failed to delete from cache', { error, key });
    }
  }
}

import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { PageOptionsDto, AppError } from 'src/common';
import { CacheService } from 'src/common/cache';
import { FeedType } from '../entities/feed.types';
import { FeedItem } from '../entities/feed.entity';

@Injectable()
export class FeedCacheService {
  constructor(
    private readonly cache: CacheService,
    private readonly logger: Logger,
  ) {}

  async getFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): Promise<FeedItem[] | null> {
    try {
      const key = this.getCacheKey(userId, pageOptions, feedType);
      const cached = await this.cache.get<FeedItem[]>(key);
      return cached;
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

  async cacheFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
    items: FeedItem[],
  ): Promise<void> {
    try {
      const key = this.getCacheKey(userId, pageOptions, feedType);
      await this.cache.set(key, items);
    } catch (error) {
      this.logger.error('Failed to cache feed', { error, userId, feedType });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.cache.failed');
    }
  }

  async invalidateUserFeed(userId: string, feedType?: FeedType): Promise<void> {
    try {
      const key = feedType
        ? `feed:${userId}:${feedType}:*`
        : `feed:${userId}:*`;
      await this.cache.del(key);
      this.logger.debug(`Invalidated feed cache for user ${userId}`);
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

  private getCacheKey(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): string {
    return `feed:${userId}:${feedType}:${pageOptions.pageNumber}:${pageOptions.pageSize}`;
  }
}

import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { FeedCacheService } from '../feed-cache.service';
import { FeedDatabaseProvider } from './feed-database.provider';
import { GetFeedInput } from '../dto/get-feed.input';
import { GetFeedOutput } from '../dto/get-feed.output';
import { FeedProvider } from './feed-provider.interface';

@Injectable()
export class FeedCacheProvider implements FeedProvider {
  constructor(
    private readonly cacheService: FeedCacheService,
    private readonly databaseProvider: FeedDatabaseProvider,
    private readonly logger: Logger,
  ) {}

  async getFeed(input: GetFeedInput): Promise<GetFeedOutput> {
    try {
      // Try to get from cache
      const cached = await this.cacheService.getCachedFeed(
        input.userId,
        input.offset,
        input.limit,
      );

      if (cached) {
        this.logger.debug('Feed cache hit');
        return cached;
      }

      // Get from database
      this.logger.debug('Feed cache miss');
      const result = await this.databaseProvider.getFeed(input);

      // Cache the result
      await this.cacheService.cacheFeed(
        input.userId,
        input.offset,
        input.limit,
        result,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to get feed from cache', error);
      // Fallback to database on cache error
      return this.databaseProvider.getFeed(input);
    }
  }
}

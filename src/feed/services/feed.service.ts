import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { Logger } from 'nestjs-pino';
import { PaginationQueryDto, Collection, AppError } from 'src/common';
import { FeedType } from '../entities/feed.types';
import { FeedItem } from '../entities/feed.entity';
import { GetRecommendationsCommand } from '../entities/commands/get-recommendations.command';

// Service interfaces
interface IFeedCacheService {
  getFeed(
    userId: string,
    pagination: PaginationQueryDto,
    feedType: FeedType,
  ): Promise<FeedItem[] | null>;
  cacheFeed(
    userId: string,
    pagination: PaginationQueryDto,
    feedType: FeedType,
    items: FeedItem[],
  ): Promise<void>;
}

interface IFeedEnrichmentService {
  enrichFeedItems(contentIds: string[]): Promise<FeedItem[]>;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    @Inject('IFeedCacheService')
    private readonly feedCache: IFeedCacheService,
    @Inject('IFeedEnrichmentService')
    private readonly feedEnrichment: IFeedEnrichmentService,
    private readonly logger: Logger,
  ) {}

  /**
   * Get feed for a user
   * @param userId User ID
   * @param pagination Pagination parameters
   * @param feedType Type of feed
   * @returns Feed collection with items
   */
  async getFeed(
    userId: string,
    pagination: PaginationQueryDto,
    feedType: FeedType = FeedType.PERSONALIZED,
  ): Promise<Collection<FeedItem>> {
    try {
      // Try to get from cache first
      const cached = await this.feedCache.getFeed(userId, pagination, feedType);
      if (cached) {
        this.logger.debug('Feed cache hit');
        return this.createFeedCollection(cached, pagination);
      }

      // Get content IDs for feed
      const contentIds = await this.getContentIds(userId, pagination, feedType);

      // Get enriched feed items
      const enrichedItems =
        await this.feedEnrichment.enrichFeedItems(contentIds);

      // Cache the results
      await this.feedCache.cacheFeed(
        userId,
        pagination,
        feedType,
        enrichedItems,
      );

      return this.createFeedCollection(enrichedItems, pagination);
    } catch (error) {
      this.logger.error('Failed to generate feed', { error, userId, feedType });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.generation.failed');
    }
  }

  /**
   * Get content IDs for feed using the recommendation command
   * @param userId User ID
   * @param pagination Pagination parameters
   * @param feedType Feed type
   * @returns Array of content IDs
   */
  private async getContentIds(
    userId: string,
    pagination: PaginationQueryDto,
    feedType: FeedType,
  ): Promise<string[]> {
    return this.commandBus.execute(
      new GetRecommendationsCommand(userId, pagination, feedType),
    );
  }

  private createFeedCollection(
    items: FeedItem[],
    pagination: PaginationQueryDto,
  ): Collection<FeedItem> {
    return new Collection<FeedItem>(items, {
      total: items.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}

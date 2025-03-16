import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { Logger } from 'nestjs-pino';
import { PagedResult, PageOptionsDto } from 'src/common';
import { FeedType } from '../entities/feed.types';
import { FeedItem } from '../entities/feed.entity';
import { GetRecommendationsCommand } from '../entities/commands/get-recommendations.command';
import { FeedCacheManagerService } from './feed-cache-manager.service';
import { FeedFallbackService } from './feed-fallback.service';
import { FeedErrorFactory } from '../errors';

interface IFeedEnrichmentService {
  enrichFeedItems(contentIds: string[]): Promise<FeedItem[]>;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    @Inject('IFeedEnrichmentService')
    private readonly feedEnrichment: IFeedEnrichmentService,
    private readonly cacheManager: FeedCacheManagerService,
    private readonly fallbackService: FeedFallbackService,
    private readonly logger: Logger,
  ) {}

  /**
   * Get feed for a user
   * @param userId User ID
   * @param pageOptions Page options parameters
   * @param feedType Type of feed
   * @returns Feed collection with items
   */
  async getFeed(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType = FeedType.PERSONALIZED,
  ): Promise<PagedResult<FeedItem>> {
    try {
      // Try to get from cache first
      try {
        const cached = await this.cacheManager.getFeed(
          userId,
          pageOptions,
          feedType,
        );
        if (cached) {
          this.logger.debug('Feed cache hit');
          return this.createFeedPagedResult(cached, pageOptions);
        }
      } catch (error) {
        this.logger.warn('Cache retrieval failed, using fallback', {
          error,
          userId,
          feedType,
        });
        const fallbackItems = await this.fallbackService.getFallbackFeed(
          userId,
          pageOptions,
          feedType,
        );
        return this.createFeedPagedResult(fallbackItems, pageOptions);
      }

      try {
        // Try to get content IDs from Gorse
        const contentIds = await this.getContentIds(
          userId,
          pageOptions,
          feedType,
        );

        // Get enriched feed items
        const enrichedItems =
          await this.feedEnrichment.enrichFeedItems(contentIds);

        // Try to cache the results
        try {
          await this.cacheManager.cacheFeed(
            userId,
            pageOptions,
            feedType,
            enrichedItems,
          );
          return this.createFeedPagedResult(enrichedItems, pageOptions);
        } catch (error) {
          this.logger.warn('Cache write failed, using fallback', {
            error,
            userId,
            feedType,
          });
          const fallbackItems = await this.fallbackService.getFallbackFeed(
            userId,
            pageOptions,
            feedType,
          );
          return this.createFeedPagedResult(fallbackItems, pageOptions);
        }
      } catch (error) {
        // If Gorse fails, use fallback strategy
        this.logger.warn('Using fallback feed strategy', {
          error,
          userId,
          feedType,
        });
        const fallbackItems = await this.fallbackService.getFallbackFeed(
          userId,
          pageOptions,
          feedType,
        );

        return this.createFeedPagedResult(fallbackItems, pageOptions);
      }
    } catch (error) {
      this.logger.error('Failed to generate feed', { error, userId, feedType });
      if (error instanceof Error) {
        throw FeedErrorFactory.feedGenerationFailed(error);
      }
      throw FeedErrorFactory.feedGenerationFailed();
    }
  }

  /**
   * Get content IDs for feed using the recommendation command
   * @param userId User ID
   * @param pageOptions Page options parameters
   * @param feedType Feed type
   * @returns Array of content IDs
   */
  private async getContentIds(
    userId: string,
    pageOptions: PageOptionsDto,
    feedType: FeedType,
  ): Promise<string[]> {
    return this.commandBus.execute(
      new GetRecommendationsCommand(userId, pageOptions, feedType),
    );
  }

  /**
   * Create a feed collection with pagination
   * @param items Feed items
   * @param pageOptions Page options parameters
   * @returns Feed collection
   */
  private createFeedPagedResult(
    items: FeedItem[],
    pageOptions: PageOptionsDto,
  ): PagedResult<FeedItem> {
    return new PagedResult<FeedItem>(
      items,
      pageOptions.toResponseMeta(items.length),
    );
  }
}

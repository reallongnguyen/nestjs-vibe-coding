import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppError } from 'src/common';
import { ContentService } from 'src/content/services/content.service';
import { FeedItem } from '../entities/feed.entity';

@Injectable()
export class FeedEnrichmentService {
  constructor(
    private readonly contentService: ContentService,
    private readonly logger: Logger,
  ) {}

  /**
   * Enrich feed items with content
   * @param contentIds Array of content IDs to enrich
   * @returns Array of enriched feed items
   */
  async enrichFeedItems(contentIds: string[]): Promise<FeedItem[]> {
    try {
      if (!contentIds.length) {
        return [];
      }

      const contents = await this.contentService.getContentByIds(contentIds);

      return contents.map(
        (content): FeedItem => ({
          id: content.id,
          type: content.type,
          score: content.score ?? 0,
          content,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to enrich feed items', { error, contentIds });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('feed.enrichment.failed');
    }
  }
}

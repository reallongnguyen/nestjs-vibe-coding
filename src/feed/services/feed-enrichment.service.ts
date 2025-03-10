import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from 'nestjs-pino';
import { AppError } from 'src/common';
import { FeedItem } from '../entities/feed.entity';
import { GetContentsCommand } from '../entities/commands/get-contents.command';

@Injectable()
export class FeedEnrichmentService {
  constructor(
    private readonly commandBus: CommandBus,
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

      const contents = await this.commandBus.execute(
        new GetContentsCommand(contentIds),
      );

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

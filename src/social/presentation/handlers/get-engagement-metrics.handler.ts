import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { GetEngagementMetricsCommand } from '../../../feed/entities/commands/get-engagement-metrics.command';
import { SocialEngagementService } from '../../services/social-engagement.service';
import { EngagementMetrics } from '../../../feed/entities/feed.types';
import { SocialErrorFactory } from '../../entities/errors';
import { ContentType } from '../../../common/event-manager/entities/events/schemas/social.events';

@Injectable()
@CommandHandler(GetEngagementMetricsCommand)
export class GetEngagementMetricsHandler
  implements ICommandHandler<GetEngagementMetricsCommand>
{
  private readonly logger = new Logger(GetEngagementMetricsHandler.name);
  private readonly contentType = ContentType.POST; // Use POST type for feed content

  constructor(
    private readonly socialEngagementService: SocialEngagementService,
  ) {}

  async execute(
    command: GetEngagementMetricsCommand,
  ): Promise<EngagementMetrics[]> {
    const { contentIds } = command;

    try {
      this.logger.debug(
        `Getting engagement metrics for ${contentIds.length} content items`,
      );

      // Use Promise.all to fetch metrics for all content IDs in parallel
      const metrics = await Promise.all(
        contentIds.map(async (contentId) => {
          try {
            const stats = await this.socialEngagementService.getEngagementStats(
              contentId,
              this.contentType,
            );

            return {
              contentId,
              likeCount: stats.likeCount,
              commentCount: stats.commentCount,
              viewCount: stats.viewCount,
            };
          } catch (error) {
            // Log error but continue processing other items
            this.logger.warn(
              `Failed to get metrics for content ${contentId}: ${error.message}`,
            );
            // Return default metrics for this content
            return {
              contentId,
              likeCount: 0,
              commentCount: 0,
              viewCount: 0,
            };
          }
        }),
      );

      this.logger.debug(
        `Successfully retrieved metrics for ${metrics.length} content items`,
      );
      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get engagement metrics: ${error.message}`,
        error.stack,
      );
      throw SocialErrorFactory.socialOperationFailed(
        'getEngagementMetrics',
        error,
      );
    }
  }
}

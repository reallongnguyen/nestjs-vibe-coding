import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { GetUserLikesStatusCommand } from '../../../feed/entities/commands/get-user-likes-status.command';
import { SocialEngagementRedisService } from '../../services/social-engagement-redis.service';
import { UserLikeStatus } from '../../../feed/entities/feed.types';
import { SocialErrorFactory } from '../../entities/errors';
import { ContentType } from '../../../common/event-manager/entities/events/schemas/social.events';

@Injectable()
@CommandHandler(GetUserLikesStatusCommand)
export class GetUserLikesStatusHandler
  implements ICommandHandler<GetUserLikesStatusCommand>
{
  private readonly logger = new Logger(GetUserLikesStatusHandler.name);
  private readonly contentType = ContentType.POST; // Use POST type for feed content

  constructor(
    private readonly socialEngagementRedisService: SocialEngagementRedisService,
  ) {}

  async execute(command: GetUserLikesStatusCommand): Promise<UserLikeStatus[]> {
    const { userId, contentIds } = command;

    // If no user ID is provided, return all content as not liked
    if (!userId) {
      return contentIds.map((contentId) => ({
        contentId,
        liked: false,
      }));
    }

    try {
      this.logger.debug(
        `Checking like status for user ${userId} on ${contentIds.length} content items`,
      );

      // Use Promise.all to check like status for all content IDs in parallel
      const likeStatuses = await Promise.all(
        contentIds.map(async (contentId) => {
          try {
            const isLiked =
              await this.socialEngagementRedisService.isContentLiked(
                this.contentType,
                contentId,
                userId,
              );

            return {
              contentId,
              liked: isLiked,
            };
          } catch (error) {
            // Log error but continue processing other items
            this.logger.warn(
              `Failed to get like status for content ${contentId}: ${error.message}`,
            );
            // Return default status for this content
            return {
              contentId,
              liked: false,
            };
          }
        }),
      );

      this.logger.debug(
        `Successfully retrieved like status for ${likeStatuses.length} content items`,
      );
      return likeStatuses;
    } catch (error) {
      this.logger.error(
        `Failed to get user like status: ${error.message}`,
        error.stack,
      );
      throw SocialErrorFactory.socialOperationFailed(
        'getUserLikesStatus',
        error,
      );
    }
  }
}

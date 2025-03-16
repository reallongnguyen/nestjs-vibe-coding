import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common/errors/app.error';
import { GetUserFollowStatusCommand } from '../../../feed/entities/commands/get-user-follow-status.command';
import { UserFollowStatus } from '../../../feed/entities/feed.types';
import { UserFollowService } from '../../services/user-follow.service';
import { USER_FOLLOW_ERRORS } from '../../entities/user-follow.errors';

@Injectable()
@CommandHandler(GetUserFollowStatusCommand)
export class GetUserFollowStatusHandler
  implements ICommandHandler<GetUserFollowStatusCommand>
{
  private readonly logger = new Logger(GetUserFollowStatusHandler.name);

  constructor(private readonly userFollowService: UserFollowService) {}

  async execute(
    command: GetUserFollowStatusCommand,
  ): Promise<UserFollowStatus[]> {
    const { userId, targetUserIds } = command;

    // If no user ID is provided, return all users as not followed
    if (!userId) {
      return targetUserIds.map((targetUserId) => ({
        targetUserId,
        following: false,
      }));
    }

    try {
      this.logger.debug(
        `Checking follow status for user ${userId} on ${targetUserIds.length} target users`,
      );

      // Use Promise.all to check follow status for all target user IDs in parallel
      const followStatuses = await Promise.all(
        targetUserIds.map(async (targetUserId) => {
          try {
            const isFollowing = await this.userFollowService.isFollowing(
              userId,
              targetUserId,
            );

            return {
              targetUserId,
              following: isFollowing,
            };
          } catch (error) {
            // Log error but continue processing other items
            this.logger.warn(
              `Failed to get follow status for target user ${targetUserId}: ${error.message}`,
            );
            // Return default status for this user
            return {
              targetUserId,
              following: false,
            };
          }
        }),
      );

      this.logger.debug(
        `Successfully retrieved follow status for ${followStatuses.length} target users`,
      );
      return followStatuses;
    } catch (error) {
      this.logger.error(
        `Failed to get user follow status: ${error.message}`,
        error.stack,
      );
      throw new AppError(
        'follow-status-failed',
        USER_FOLLOW_ERRORS['follow-failed'],
        {
          params: { userId, targetUserIds: targetUserIds.join(', ') },
          cause: error,
        },
      );
    }
  }
}

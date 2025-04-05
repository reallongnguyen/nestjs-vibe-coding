import { Inject, Injectable } from '@nestjs/common';
import { PagedResult, PageOptionsDto, PrismaService } from 'src/common';
import { IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { AppError } from 'src/common/errors/app.error';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { Logger } from 'nestjs-pino';
import { UserFollow } from '../entities/user-follow.entity';
import { IUserFollowRepository } from './interfaces/user-follow-repository.interface';
import { USER_FOLLOW_REPOSITORY_TOKEN } from './interfaces/tokens';
import { IUserFollowService } from './interfaces/user-follow-service.interface';
import { FollowerDto } from './dtos/follower.dto';
import { FollowCountsDto } from './dtos/follow-counts.dto';
import { USER_FOLLOW_ERRORS } from '../entities/user-follow.errors';
import { UserFollowedEvent } from '../entities/events/user-followed.event';
import { UserUnfollowedEvent } from '../entities/events/user-unfollowed.event';

@Injectable()
export class UserFollowService implements IUserFollowService {
  constructor(
    @Inject(USER_FOLLOW_REPOSITORY_TOKEN)
    private readonly userFollowRepository: IUserFollowRepository,
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly prisma: PrismaService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow> {
    this.logger.debug(
      `User ${followerId} attempting to follow user ${followingId}`,
    );

    // Validate that users are not the same
    if (followerId === followingId) {
      this.logger.warn(`User ${followerId} attempted to follow themselves`);
      throw new AppError('self-follow', USER_FOLLOW_ERRORS['self-follow'], {
        params: { userId: followerId },
      });
    }

    // Check if already following
    const isFollowing = await this.userFollowRepository.exists(
      followerId,
      followingId,
    );

    if (isFollowing) {
      this.logger.debug(
        `User ${followerId} is already following user ${followingId}`,
      );
      // Since findOne doesn't exist in the interface, we'll query directly
      return this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    }

    // Check if users exist
    const followerDetails =
      await this.userFollowRepository.getFollowerDetails(followerId);

    if (!followerDetails) {
      this.logger.error(`Follower user ${followerId} not found`);
      throw new AppError(
        'user-not-found',
        USER_FOLLOW_ERRORS['user-not-found'],
        {
          params: { userId: followerId },
        },
      );
    }

    // Create follow relationship
    const follow = await this.userFollowRepository.create(
      followerId,
      followingId,
    );

    if (!follow) {
      this.logger.error(
        `Failed to create follow relationship between ${followerId} and ${followingId}`,
      );
      throw new AppError('follow-failed', USER_FOLLOW_ERRORS['follow-failed'], {
        params: { followerId, followingId },
      });
    }

    // Check if following user exists
    const followingDetails =
      await this.userFollowRepository.getFollowerDetails(followingId);

    if (!followingDetails) {
      this.logger.error(`Following user ${followingId} not found`);
      throw new AppError(
        'user-not-found',
        USER_FOLLOW_ERRORS['user-not-found'],
        {
          params: { userId: followingId },
        },
      );
    }

    // Prepare event data
    const followerName =
      `${followerDetails.firstName} ${followerDetails.lastName || ''}`.trim();
    const timestamp = new Date();

    // Create and publish the event using the proper event class
    const event = new UserFollowedEvent(
      followerId,
      followingId,
      followerName,
      followerDetails.avatar,
      timestamp,
    );

    await this.eventBus.publish(event);
    this.logger.debug(
      `Successfully created follow relationship: ${followerId} -> ${followingId}`,
    );

    return follow;
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow> {
    this.logger.debug(
      `User ${followerId} attempting to unfollow user ${followingId}`,
    );

    // Check if following exists
    const isFollowing = await this.userFollowRepository.exists(
      followerId,
      followingId,
    );

    if (!isFollowing) {
      this.logger.warn(
        `Follow relationship not found between ${followerId} and ${followingId}`,
      );
      throw new AppError(
        'follow-not-found',
        USER_FOLLOW_ERRORS['follow-not-found'],
        {
          params: { followerId, followingId },
        },
      );
    }

    // Delete follow relationship
    const follow = await this.userFollowRepository.delete(
      followerId,
      followingId,
    );

    // Publish event
    const event = new UserUnfollowedEvent(followerId, followingId, new Date());
    await this.eventBus.publish(event);

    this.logger.debug(
      `Successfully deleted follow relationship: ${followerId} -> ${followingId}`,
    );
    return follow;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.userFollowRepository.exists(followerId, followingId);
  }

  async getFollowers(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>> {
    const [followers, total] = await this.userFollowRepository.getFollowers(
      userId,
      pageOptions,
    );

    const followerDtos = followers.map((follow) => ({
      id: follow.follower.id,
      firstName: follow.follower.firstName,
      lastName: follow.follower.lastName,
      avatar: follow.follower.avatar,
      followedAt: follow.createdAt,
    }));

    return new PagedResult<FollowerDto>(
      followerDtos,
      pageOptions.toResponseMeta(total),
    );
  }

  async getFollowing(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>> {
    const [following, total] = await this.userFollowRepository.getFollowing(
      userId,
      pageOptions,
    );

    const followingDtos = following.map((follow) => ({
      id: follow.following.id,
      firstName: follow.following.firstName,
      lastName: follow.following.lastName,
      avatar: follow.following.avatar,
      followedAt: follow.createdAt,
    }));

    return new PagedResult<FollowerDto>(
      followingDtos,
      pageOptions.toResponseMeta(total),
    );
  }

  async getFollowCounts(userId: string): Promise<FollowCountsDto> {
    const [followersCount, followingCount] = await Promise.all([
      this.userFollowRepository.getFollowersCount(userId),
      this.userFollowRepository.getFollowingCount(userId),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    return this.userFollowRepository.getFollowingIds(userId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  PagedResult,
  IEventBus,
  InjectEventBus,
  PageOptionsDto,
} from 'src/common';
import { AppError } from 'src/common/errors/app.error';
import { UserFollow } from '../entities/user-follow.entity';
import { IUserFollowRepository } from './interfaces/user-follow-repository.interface';
import { IUserFollowService } from './interfaces/user-follow-service.interface';
import { FollowerDto } from './dtos/follower.dto';
import { FollowCountsDto } from './dtos/follow-counts.dto';
import { USER_FOLLOW_ERRORS } from '../entities/user-follow.errors';
import { UserFollowedEvent } from '../entities/events/user-followed.event';
import { UserUnfollowedEvent } from '../entities/events/user-unfollowed.event';

@Injectable()
export class UserFollowService implements IUserFollowService {
  constructor(
    @Inject('IUserFollowRepository')
    private readonly userFollowRepository: IUserFollowRepository,
    @InjectEventBus() private readonly eventBus: IEventBus,
  ) {}

  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow> {
    // Validate that users are not the same
    if (followerId === followingId) {
      throw new AppError('self-follow', USER_FOLLOW_ERRORS['self-follow'], {
        params: { userId: followerId },
      });
    }

    // Check if already following
    const isAlreadyFollowing = await this.userFollowRepository.exists(
      followerId,
      followingId,
    );

    if (isAlreadyFollowing) {
      throw new AppError(
        'already-following',
        USER_FOLLOW_ERRORS['already-following'],
        {
          params: { followerId, followingId },
        },
      );
    }

    // Check if the user being followed exists
    const followingUser =
      await this.userFollowRepository.getFollowerDetails(followingId);

    if (!followingUser) {
      throw new AppError(
        'user-not-found',
        USER_FOLLOW_ERRORS['user-not-found'],
        {
          params: { userId: followingId },
        },
      );
    }

    // Create follow relationship
    const follow = await this.userFollowRepository.create(
      followerId,
      followingId,
    );

    // Get follower details for the event
    const followerDetails =
      await this.userFollowRepository.getFollowerDetails(followerId);

    if (!followerDetails) {
      throw new AppError(
        'user-not-found',
        USER_FOLLOW_ERRORS['user-not-found'],
        {
          params: { userId: followerId },
        },
      );
    }

    // Publish event
    const event = new UserFollowedEvent(
      followerId,
      followingId,
      `${followerDetails.firstName} ${followerDetails.lastName || ''}`.trim(),
      followerDetails.avatar,
      new Date(),
    );

    await this.eventBus.publish(event);

    return follow;
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow> {
    // Check if following exists
    const isFollowing = await this.userFollowRepository.exists(
      followerId,
      followingId,
    );

    if (!isFollowing) {
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

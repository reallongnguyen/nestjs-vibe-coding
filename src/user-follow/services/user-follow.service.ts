import { Inject, Injectable } from '@nestjs/common';
import {
  Collection,
  IEventBus,
  InjectEventBus,
  PaginationQueryDto,
} from 'src/common';
import { UserFollow } from '../entities/user-follow.entity';
import { IUserFollowRepository } from './interfaces/user-follow-repository.interface';
import { IUserFollowService } from './interfaces/user-follow-service.interface';
import { FollowerDto } from './dtos/follower.dto';
import { FollowCountsDto } from './dtos/follow-counts.dto';
import {
  SelfFollowError,
  AlreadyFollowingError,
  UserFollowNotFoundError,
  UserNotFoundError,
} from '../entities/user-follow.error';
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
      throw new SelfFollowError(followerId);
    }

    // Check if already following
    const isAlreadyFollowing = await this.userFollowRepository.exists(
      followerId,
      followingId,
    );

    if (isAlreadyFollowing) {
      throw new AlreadyFollowingError(followerId, followingId);
    }

    // Check if the user being followed exists
    const followingUser =
      await this.userFollowRepository.getFollowerDetails(followingId);

    if (!followingUser) {
      throw new UserNotFoundError(followingId);
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
      throw new UserNotFoundError(followerId);
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
      throw new UserFollowNotFoundError(followerId, followingId);
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
    pagination: PaginationQueryDto,
  ): Promise<Collection<FollowerDto>> {
    const [followers, total] = await this.userFollowRepository.getFollowers(
      userId,
      pagination,
    );

    const followerDtos = followers.map((follow) => ({
      id: follow.follower.id,
      firstName: follow.follower.firstName,
      lastName: follow.follower.lastName,
      avatar: follow.follower.avatar,
      followedAt: follow.createdAt,
    }));

    return new Collection<FollowerDto>(followerDtos, {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async getFollowing(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<Collection<FollowerDto>> {
    const [following, total] = await this.userFollowRepository.getFollowing(
      userId,
      pagination,
    );

    const followingDtos = following.map((follow) => ({
      id: follow.following.id,
      firstName: follow.following.firstName,
      lastName: follow.following.lastName,
      avatar: follow.following.avatar,
      followedAt: follow.createdAt,
    }));

    return new Collection<FollowerDto>(followingDtos, {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
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

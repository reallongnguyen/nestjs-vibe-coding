/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // Implementation will be added in SOC-006-2
    throw new Error('Method not implemented.');
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow> {
    // Implementation will be added in SOC-006-2
    throw new Error('Method not implemented.');
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    // Implementation will be added in SOC-006-2
    throw new Error('Method not implemented.');
  }

  async getFollowers(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<Collection<FollowerDto>> {
    // Implementation will be added in SOC-006-3
    throw new Error('Method not implemented.');
  }

  async getFollowing(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<Collection<FollowerDto>> {
    // Implementation will be added in SOC-006-3
    throw new Error('Method not implemented.');
  }

  async getFollowCounts(userId: string): Promise<FollowCountsDto> {
    // Implementation will be added in SOC-006-3
    throw new Error('Method not implemented.');
  }
}

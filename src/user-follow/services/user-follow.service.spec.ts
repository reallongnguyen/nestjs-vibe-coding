import { Test, TestingModule } from '@nestjs/testing';
import { IEventBus } from 'src/common';
import { UserFollowService } from './user-follow.service';
import { IUserFollowRepository } from './interfaces/user-follow-repository.interface';
import {
  SelfFollowError,
  AlreadyFollowingError,
  UserFollowNotFoundError,
  UserNotFoundError,
} from '../entities/user-follow.error';
import { UserFollowedEvent } from '../entities/events/user-followed.event';
import { UserUnfollowedEvent } from '../entities/events/user-unfollowed.event';

describe('UserFollowService', () => {
  let service: UserFollowService;
  let repository: jest.Mocked<IUserFollowRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(async () => {
    const repositoryMock = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getFollowers: jest.fn(),
      getFollowing: jest.fn(),
      getFollowersCount: jest.fn(),
      getFollowingCount: jest.fn(),
      getFollowerDetails: jest.fn(),
    };

    const eventBusMock = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFollowService,
        {
          provide: 'IUserFollowRepository',
          useValue: repositoryMock,
        },
        {
          provide: 'IEventBus',
          useValue: eventBusMock,
        },
      ],
    }).compile();

    service = module.get<UserFollowService>(UserFollowService);
    repository = module.get('IUserFollowRepository');
    eventBus = module.get('IEventBus');
  });

  describe('followUser', () => {
    it('should throw SelfFollowError when trying to follow self', async () => {
      const userId = 'user-123';

      await expect(service.followUser(userId, userId)).rejects.toThrow(
        SelfFollowError,
      );
    });

    it('should throw AlreadyFollowingError when already following', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(true);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(
        AlreadyFollowingError,
      );
    });

    it('should throw UserNotFoundError when follower not found', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(false);
      repository.create.mockResolvedValue({
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      });
      repository.getFollowerDetails.mockResolvedValue(null);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('should create follow relationship and publish event', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';
      const follow = {
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      };
      const followerDetails = {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar.jpg',
      };

      repository.exists.mockResolvedValue(false);
      repository.create.mockResolvedValue(follow);
      repository.getFollowerDetails.mockResolvedValue(followerDetails);

      const result = await service.followUser(followerId, followingId);

      expect(result).toEqual(follow);
      expect(repository.create).toHaveBeenCalledWith(followerId, followingId);
      expect(eventBus.publish).toHaveBeenCalledWith(
        UserFollowedEvent.eventName,
        expect.any(UserFollowedEvent),
      );
    });
  });

  describe('unfollowUser', () => {
    it('should throw UserFollowNotFoundError when not following', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(false);

      await expect(
        service.unfollowUser(followerId, followingId),
      ).rejects.toThrow(UserFollowNotFoundError);
    });

    it('should delete follow relationship and publish event', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';
      const follow = {
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      };

      repository.exists.mockResolvedValue(true);
      repository.delete.mockResolvedValue(follow);

      const result = await service.unfollowUser(followerId, followingId);

      expect(result).toEqual(follow);
      expect(repository.delete).toHaveBeenCalledWith(followerId, followingId);
      expect(eventBus.publish).toHaveBeenCalledWith(
        UserUnfollowedEvent.eventName,
        expect.any(UserUnfollowedEvent),
      );
    });
  });

  describe('isFollowing', () => {
    it('should return true when following', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(true);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(true);
      expect(repository.exists).toHaveBeenCalledWith(followerId, followingId);
    });

    it('should return false when not following', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(false);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(false);
      expect(repository.exists).toHaveBeenCalledWith(followerId, followingId);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { IEventBus, PagedResult, PageOptionsDto } from 'src/common';
import { UserFollowService } from './user-follow.service';
import { IUserFollowRepository } from './interfaces/user-follow-repository.interface';
import {
  SelfFollowError,
  AlreadyFollowingError,
  UserFollowNotFoundError,
  UserNotFoundError,
} from '../entities/user-follow.error';

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
      getFollowingIds: jest.fn(),
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
          provide: 'EventBusPort',
          useValue: eventBusMock,
        },
      ],
    }).compile();

    service = module.get<UserFollowService>(UserFollowService);
    repository = module.get('IUserFollowRepository');
    eventBus = module.get('EventBusPort');
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

    it('should throw UserNotFoundError when following user not found', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(false);
      repository.getFollowerDetails.mockResolvedValue(null);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('should throw UserNotFoundError when follower not found', async () => {
      const followerId = 'follower-123';
      const followingId = 'following-123';

      repository.exists.mockResolvedValue(false);
      repository.getFollowerDetails
        .mockResolvedValueOnce({
          firstName: 'Following',
          lastName: 'User',
          avatar: 'avatar.jpg',
        })
        .mockResolvedValueOnce(null);

      repository.create.mockResolvedValue({
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      });

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
      repository.getFollowerDetails
        .mockResolvedValueOnce({
          firstName: 'Following',
          lastName: 'User',
          avatar: 'avatar.jpg',
        })
        .mockResolvedValueOnce(followerDetails);

      const result = await service.followUser(followerId, followingId);

      expect(result).toEqual(follow);
      expect(repository.create).toHaveBeenCalledWith(followerId, followingId);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          followerId,
          followingId,
          followerName: 'John Doe',
          followerAvatar: 'avatar.jpg',
          timestamp: expect.any(Date),
        }),
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
        expect.objectContaining({
          followerId,
          followingId,
          timestamp: expect.any(Date),
        }),
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

  describe('getFollowers', () => {
    it('should return followers with pagination', async () => {
      const userId = 'user-123';
      const pageOptions = new PageOptionsDto(0, 10);
      const followers = [
        {
          id: 'follow-1',
          followerId: 'follower-1',
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: 'follower-1',
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'avatar1.jpg',
          },
        },
        {
          id: 'follow-2',
          followerId: 'follower-2',
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: 'follower-2',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: 'avatar2.jpg',
          },
        },
      ];
      const total = 2;

      repository.getFollowers.mockResolvedValue([followers, total]);

      const result = await service.getFollowers(userId, pageOptions);

      expect(result).toBeInstanceOf(PagedResult);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 'follower-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar1.jpg',
        followedAt: expect.any(Date),
      });
      expect(result.meta.totalItems).toBe(total);
      expect(repository.getFollowers).toHaveBeenCalledWith(userId, pageOptions);
    });
  });

  describe('getFollowing', () => {
    it('should return following with pagination', async () => {
      const userId = 'user-123';
      const pageOptions = new PageOptionsDto(0, 10);
      const following = [
        {
          id: 'follow-1',
          followerId: userId,
          followingId: 'following-1',
          createdAt: new Date(),
          following: {
            id: 'following-1',
            firstName: 'Alice',
            lastName: 'Johnson',
            avatar: 'avatar3.jpg',
          },
        },
        {
          id: 'follow-2',
          followerId: userId,
          followingId: 'following-2',
          createdAt: new Date(),
          following: {
            id: 'following-2',
            firstName: 'Bob',
            lastName: 'Brown',
            avatar: 'avatar4.jpg',
          },
        },
      ];
      const total = 2;

      repository.getFollowing.mockResolvedValue([following, total]);

      const result = await service.getFollowing(userId, pageOptions);

      expect(result).toBeInstanceOf(PagedResult);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 'following-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: 'avatar3.jpg',
        followedAt: expect.any(Date),
      });
      expect(result.meta.totalItems).toBe(total);
      expect(repository.getFollowing).toHaveBeenCalledWith(userId, pageOptions);
    });
  });

  describe('getFollowCounts', () => {
    it('should return follower and following counts', async () => {
      const userId = 'user-123';
      const followersCount = 5;
      const followingCount = 10;

      repository.getFollowersCount.mockResolvedValue(followersCount);
      repository.getFollowingCount.mockResolvedValue(followingCount);

      const result = await service.getFollowCounts(userId);

      expect(result).toEqual({
        followersCount,
        followingCount,
      });
      expect(repository.getFollowersCount).toHaveBeenCalledWith(userId);
      expect(repository.getFollowingCount).toHaveBeenCalledWith(userId);
    });
  });
});

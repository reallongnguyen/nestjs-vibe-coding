import { Test } from '@nestjs/testing';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { PrismaService } from 'src/common';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { UserFollowService } from '../services/user-follow.service';
import { UserFollowedEvent } from '../entities/events/user-followed.event';
import { UserUnfollowedEvent } from '../entities/events/user-unfollowed.event';

/**
 * Test suite for verifying user-follow module migration from event-bus to event-manager
 */
describe('UserFollowService with event-manager', () => {
  let service: UserFollowService;
  let eventBus: any;
  let repository: any;

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockImplementation((followerId, followingId) => ({
        id: 'test-follow-id',
        followerId,
        followingId,
        createdAt: new Date(),
      })),
      delete: jest.fn().mockResolvedValue({
        id: 'test-follow-id',
        followerId: 'user-1',
        followingId: 'user-2',
        createdAt: new Date(),
      }),
      getFollowerDetails: jest.fn().mockImplementation((userId) => ({
        id: userId,
        firstName: userId === 'user-1' ? 'John' : 'Jane',
        lastName: userId === 'user-1' ? 'Doe' : 'Smith',
        avatar: null,
      })),
    };

    const module = await Test.createTestingModule({
      imports: [EventManagerModule],
      providers: [
        UserFollowService,
        {
          provide: 'IUserFollowRepository',
          useValue: mockRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            userFollow: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserFollowService>(UserFollowService);
    eventBus = module.get(EVENT_BUS_TOKEN);
    repository = module.get('IUserFollowRepository');

    // Spy on the eventBus publish method
    jest.spyOn(eventBus, 'publish').mockImplementation(async () => {
      return Promise.resolve();
    });
  });

  describe('follow user', () => {
    it('should publish UserFollowedEvent when a user follows another user', async () => {
      // Arrange
      const followerId = 'user-1';
      const followingId = 'user-2';

      // Act
      await service.followUser(followerId, followingId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the event that was published
      const publishedEvent = eventBus.publish.mock.calls[0][0];

      // Verify the event is an instance of UserFollowedEvent
      expect(publishedEvent).toBeInstanceOf(UserFollowedEvent);

      // Verify event contains correct data
      expect(publishedEvent.followerId).toBe(followerId);
      expect(publishedEvent.followingId).toBe(followingId);
      expect(publishedEvent.followerName).toBe('John Doe');
      expect(publishedEvent.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when trying to follow yourself', async () => {
      // Arrange
      const userId = 'user-1';

      // Act & Assert
      await expect(service.followUser(userId, userId)).rejects.toThrow();
    });
  });

  describe('unfollow user', () => {
    it('should publish UserUnfollowedEvent when a user unfollows another user', async () => {
      // Arrange
      const followerId = 'user-1';
      const followingId = 'user-2';

      // Mock that the follow relationship exists
      jest.spyOn(repository, 'exists').mockResolvedValueOnce(true);

      // Act
      await service.unfollowUser(followerId, followingId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the event that was published
      const publishedEvent = eventBus.publish.mock.calls[0][0];

      // Verify the event is an instance of UserUnfollowedEvent
      expect(publishedEvent).toBeInstanceOf(UserUnfollowedEvent);

      // Verify event contains correct data
      expect(publishedEvent.followerId).toBe(followerId);
      expect(publishedEvent.followingId).toBe(followingId);
      expect(publishedEvent.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when relationship does not exist', async () => {
      // Arrange
      const followerId = 'user-1';
      const followingId = 'user-2';

      // Mock that the follow relationship does not exist
      jest.spyOn(repository, 'exists').mockResolvedValueOnce(false);

      // Act & Assert
      await expect(
        service.unfollowUser(followerId, followingId),
      ).rejects.toThrow();
    });
  });
});

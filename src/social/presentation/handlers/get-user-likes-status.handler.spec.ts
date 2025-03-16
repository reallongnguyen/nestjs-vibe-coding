import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetUserLikesStatusHandler } from './get-user-likes-status.handler';
import { SocialEngagementRedisService } from '../../services/social-engagement-redis.service';
import { GetUserLikesStatusCommand } from '../../../feed/entities/commands/get-user-likes-status.command';
import { ContentType } from '../../../common/event-manager/entities/events/schemas/social.events';

describe('GetUserLikesStatusHandler', () => {
  let handler: GetUserLikesStatusHandler;
  let socialEngagementRedisService: SocialEngagementRedisService;

  const mockSocialEngagementRedisService = {
    isContentLiked: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserLikesStatusHandler,
        {
          provide: SocialEngagementRedisService,
          useValue: mockSocialEngagementRedisService,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUserLikesStatusHandler>(GetUserLikesStatusHandler);
    socialEngagementRedisService = module.get<SocialEngagementRedisService>(
      SocialEngagementRedisService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return like status for content IDs when user is logged in', async () => {
      // Arrange
      const userId = 'user1';
      const contentIds = ['content1', 'content2'];
      const command = new GetUserLikesStatusCommand(userId, contentIds);

      // Mock implementation that returns true for content1 and false for content2
      mockSocialEngagementRedisService.isContentLiked
        .mockReturnValueOnce(Promise.resolve(true))
        .mockReturnValueOnce(Promise.resolve(false));

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          contentId: 'content1',
          liked: true,
        },
        {
          contentId: 'content2',
          liked: false,
        },
      ]);

      expect(socialEngagementRedisService.isContentLiked).toHaveBeenCalledTimes(
        2,
      );
      expect(socialEngagementRedisService.isContentLiked).toHaveBeenCalledWith(
        ContentType.POST,
        'content1',
        userId,
      );
      expect(socialEngagementRedisService.isContentLiked).toHaveBeenCalledWith(
        ContentType.POST,
        'content2',
        userId,
      );
    });

    it('should return all false when user is not logged in', async () => {
      // Arrange
      const userId = null;
      const contentIds = ['content1', 'content2'];
      const command = new GetUserLikesStatusCommand(userId, contentIds);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          contentId: 'content1',
          liked: false,
        },
        {
          contentId: 'content2',
          liked: false,
        },
      ]);

      expect(
        socialEngagementRedisService.isContentLiked,
      ).not.toHaveBeenCalled();
    });

    it('should return empty array when no content IDs are provided', async () => {
      // Arrange
      const userId = 'user1';
      const contentIds: string[] = [];
      const command = new GetUserLikesStatusCommand(userId, contentIds);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([]);
      expect(
        socialEngagementRedisService.isContentLiked,
      ).not.toHaveBeenCalled();
    });

    it('should handle errors for individual content items', async () => {
      // Arrange
      const userId = 'user1';
      const contentIds = ['content1', 'content2'];
      const command = new GetUserLikesStatusCommand(userId, contentIds);

      // First call succeeds, second call fails
      mockSocialEngagementRedisService.isContentLiked
        .mockReturnValueOnce(Promise.resolve(true))
        .mockRejectedValueOnce(new Error('Failed to check like status'));

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          contentId: 'content1',
          liked: true,
        },
        {
          contentId: 'content2',
          liked: false, // Should default to false on error
        },
      ]);

      expect(socialEngagementRedisService.isContentLiked).toHaveBeenCalledTimes(
        2,
      );
    });
  });
});

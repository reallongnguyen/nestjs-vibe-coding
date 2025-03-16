import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetUserFollowStatusHandler } from './get-user-follow-status.handler';
import { UserFollowService } from '../../services/user-follow.service';
import { GetUserFollowStatusCommand } from '../../../feed/entities/commands/get-user-follow-status.command';

describe('GetUserFollowStatusHandler', () => {
  let handler: GetUserFollowStatusHandler;
  let userFollowService: UserFollowService;

  const mockUserFollowService = {
    isFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserFollowStatusHandler,
        {
          provide: UserFollowService,
          useValue: mockUserFollowService,
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

    handler = module.get<GetUserFollowStatusHandler>(
      GetUserFollowStatusHandler,
    );
    userFollowService = module.get<UserFollowService>(UserFollowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return follow status for target user IDs when user is logged in', async () => {
      // Arrange
      const userId = 'user1';
      const targetUserIds = ['target1', 'target2'];
      const command = new GetUserFollowStatusCommand(userId, targetUserIds);

      // Mock implementation that returns true for target1 and false for target2
      mockUserFollowService.isFollowing
        .mockReturnValueOnce(Promise.resolve(true))
        .mockReturnValueOnce(Promise.resolve(false));

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          targetUserId: 'target1',
          following: true,
        },
        {
          targetUserId: 'target2',
          following: false,
        },
      ]);

      expect(userFollowService.isFollowing).toHaveBeenCalledTimes(2);
      expect(userFollowService.isFollowing).toHaveBeenCalledWith(
        userId,
        'target1',
      );
      expect(userFollowService.isFollowing).toHaveBeenCalledWith(
        userId,
        'target2',
      );
    });

    it('should return all false when user is not logged in', async () => {
      // Arrange
      const userId = null;
      const targetUserIds = ['target1', 'target2'];
      const command = new GetUserFollowStatusCommand(userId, targetUserIds);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          targetUserId: 'target1',
          following: false,
        },
        {
          targetUserId: 'target2',
          following: false,
        },
      ]);

      expect(userFollowService.isFollowing).not.toHaveBeenCalled();
    });

    it('should return empty array when no target user IDs are provided', async () => {
      // Arrange
      const userId = 'user1';
      const targetUserIds: string[] = [];
      const command = new GetUserFollowStatusCommand(userId, targetUserIds);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([]);
      expect(userFollowService.isFollowing).not.toHaveBeenCalled();
    });

    it('should handle errors for individual follow status checks', async () => {
      // Arrange
      const userId = 'user1';
      const targetUserIds = ['target1', 'target2'];
      const command = new GetUserFollowStatusCommand(userId, targetUserIds);

      // First call succeeds, second call fails
      mockUserFollowService.isFollowing
        .mockReturnValueOnce(Promise.resolve(true))
        .mockRejectedValueOnce(new Error('Failed to check follow status'));

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          targetUserId: 'target1',
          following: true,
        },
        {
          targetUserId: 'target2',
          following: false, // Should default to false on error
        },
      ]);

      expect(userFollowService.isFollowing).toHaveBeenCalledTimes(2);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LOGGER_TOKEN } from '../../../src/common/logger/logger.token';
import { InvitationAcceptedHandler } from '../../../src/user-follow/presentation/handlers/invitation-accepted.handler';
import { UserFollowService } from '../../../src/user-follow/services/user-follow.service';
import { InvitationAcceptedEvent } from '../../../src/invitation/entities/events/invitation-accepted.event';
import { AppError } from '../../../src/common/errors/app.error';
import { USER_FOLLOW_ERRORS } from '../../../src/user-follow/entities/user-follow.errors';
import { InvitationAcceptedPayload } from '../../../src/common/event-manager/entities/events/schemas/invitation.events';

describe('InvitationAcceptedHandler Integration Tests', () => {
  let module: TestingModule;
  let handler: InvitationAcceptedHandler;
  let mockUserFollowService: jest.Mocked<UserFollowService>;
  let mockLogger: jest.Mocked<any>;

  beforeEach(async () => {
    mockUserFollowService = {
      followUser: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        InvitationAcceptedHandler,
        {
          provide: UserFollowService,
          useValue: mockUserFollowService,
        },
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
        EventEmitter2,
      ],
    }).compile();

    handler = module.get<InvitationAcceptedHandler>(InvitationAcceptedHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Handling', () => {
    const testEvent = new InvitationAcceptedEvent(
      'test-invitation-id',
      'inviter-id',
      'accepter-id',
      'test-code',
    );

    it('should properly instantiate and handle events', async () => {
      // Arrange
      mockUserFollowService.followUser.mockResolvedValue(undefined);

      // Act & Assert
      expect(handler).toBeDefined();
      await expect(handler.handle(testEvent)).resolves.not.toThrow();
    });

    it('should successfully create bidirectional follow relationships', async () => {
      // Arrange
      mockUserFollowService.followUser.mockResolvedValue(undefined);

      // Act
      await handler.handle(testEvent);

      // Assert
      expect(mockUserFollowService.followUser).toHaveBeenCalledTimes(2);
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'accepter-id',
        'inviter-id',
      );
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'inviter-id',
        'accepter-id',
      );
    });

    it('should handle existing follow relationships gracefully', async () => {
      // Arrange
      const error = new AppError(
        'already-following',
        USER_FOLLOW_ERRORS['already-following'],
        {
          params: {
            followerId: testEvent.acceptedBy,
            followingId: testEvent.inviterId,
          },
        },
      );
      mockUserFollowService.followUser.mockRejectedValue(error);

      // Act & Assert
      await expect(handler.handle(testEvent)).rejects.toThrow(error);
    });

    it('should handle invalid user IDs', async () => {
      // Arrange
      const error = new AppError(
        'user-not-found',
        USER_FOLLOW_ERRORS['user-not-found'],
        {
          params: {
            userId: testEvent.acceptedBy,
          },
        },
      );
      mockUserFollowService.followUser.mockRejectedValue(error);

      // Act & Assert
      await expect(handler.handle(testEvent)).rejects.toThrow(AppError);
    });

    it('should handle service failures', async () => {
      // Arrange
      mockUserFollowService.followUser.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.handle(testEvent)).rejects.toThrow(AppError);
      expect(mockUserFollowService.followUser).toHaveBeenCalledTimes(1);
    });

    it('should validate event schema', async () => {
      // Arrange
      const invalidEvent = {
        invitationId: 'not-a-uuid',
        inviterId: 'not-a-uuid',
        acceptedBy: 'not-a-uuid',
        code: null,
      };

      // Convert to class instance for validation
      const instance = plainToInstance(InvitationAcceptedPayload, invalidEvent);

      // Act & Assert
      const errors = await validate(instance);
      expect(errors).toHaveLength(4); // Should have 4 validation errors for invalid UUIDs and null code
      expect(mockUserFollowService.followUser).not.toHaveBeenCalled();
    });

    it('should log operations appropriately', async () => {
      // Arrange
      mockUserFollowService.followUser.mockResolvedValue(undefined);

      // Act
      await handler.handle(testEvent);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Processing invitation acceptance'),
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Created follow relationship'),
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          'Successfully created bidirectional follow relationship',
        ),
      );
    });

    it('should log errors appropriately', async () => {
      // Arrange
      const loggerErrorSpy = jest.spyOn(mockLogger, 'error');
      const error = new Error('Test error');
      mockUserFollowService.followUser.mockRejectedValue(error);

      // Act
      try {
        await handler.handle(testEvent);
      } catch {
        // Expected error
      }

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process invitation acceptance'),
        error.stack,
      );
    });

    it('should wrap non-AppError in operation-failed error', async () => {
      // Arrange
      const originalError = new Error('Database connection failed');
      mockUserFollowService.followUser.mockRejectedValue(originalError);

      // Act & Assert
      try {
        await handler.handle(testEvent);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('operation-failed');
        expect(error.message).toBe(
          'Failed to perform user follow operation: Failed to create bidirectional follow relationship',
        );
        expect(error.params).toEqual({
          reason: 'Failed to create bidirectional follow relationship',
        });
        expect(error.cause).toBe(originalError);
      }
    });

    it('should rollback first follow on second follow failure', async () => {
      // Arrange
      const rollbackTestEvent = new InvitationAcceptedEvent(
        'test-invitation-id',
        'inviter-id',
        'accepter-id',
        'test-code',
      );

      mockUserFollowService.followUser
        .mockResolvedValueOnce(undefined) // First call succeeds
        .mockRejectedValueOnce(new Error('Second follow failed')); // Second call fails

      // Act & Assert
      await expect(handler.handle(rollbackTestEvent)).rejects.toThrow();

      // Verify both operations were attempted
      expect(mockUserFollowService.followUser).toHaveBeenCalledTimes(2);
      expect(mockUserFollowService.followUser).toHaveBeenNthCalledWith(
        1,
        'accepter-id',
        'inviter-id',
      );
      expect(mockUserFollowService.followUser).toHaveBeenNthCalledWith(
        2,
        'inviter-id',
        'accepter-id',
      );

      // Verify error is properly wrapped
      try {
        await handler.handle(rollbackTestEvent);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('operation-failed');
        expect(error.params).toEqual({
          reason: 'Failed to create bidirectional follow relationship',
        });
      }
    });

    it('should handle concurrent invitation acceptance events', async () => {
      // Arrange
      const concurrentEvent1 = new InvitationAcceptedEvent(
        'invitation-1',
        'inviter-1',
        'accepter-1',
        'code-1',
      );

      const concurrentEvent2 = new InvitationAcceptedEvent(
        'invitation-2',
        'inviter-2',
        'accepter-2',
        'code-2',
      );

      mockUserFollowService.followUser.mockResolvedValue(undefined);

      // Act
      await Promise.all([
        handler.handle(concurrentEvent1),
        handler.handle(concurrentEvent2),
      ]);

      // Assert
      expect(mockUserFollowService.followUser).toHaveBeenCalledTimes(4);
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'accepter-1',
        'inviter-1',
      );
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'inviter-1',
        'accepter-1',
      );
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'accepter-2',
        'inviter-2',
      );
      expect(mockUserFollowService.followUser).toHaveBeenCalledWith(
        'inviter-2',
        'accepter-2',
      );
    });
  });
});

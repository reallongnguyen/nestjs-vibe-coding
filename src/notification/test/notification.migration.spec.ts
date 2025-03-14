import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SocialEventSchemas } from 'src/common/event-manager';
import { EventBusMessage } from 'src/common/event-manager/entities/events/event.interface';
import { LikeNotificationHandler } from '../presentation/handlers/like-notification.handler';
import { CommentNotificationHandler } from '../presentation/handlers/comment-notification.handler';
import { FollowNotificationHandler } from '../presentation/handlers/follow-notification.handler';
import { NotificationProducerService } from '../services/notification-producer.service';

/**
 * Tests for the notification module migration to ensure it works with the event-manager
 */
describe('Notification Module Migration', () => {
  describe('Event Handlers', () => {
    let likeHandler: LikeNotificationHandler;
    let commentHandler: CommentNotificationHandler;
    let followHandler: FollowNotificationHandler;
    let producerService: NotificationProducerService;

    beforeEach(async () => {
      // Create a mock logger
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        verbose: jest.fn(),
      };

      // Create a mock for the notification producer service
      const mockProducerService = {
        handleLikeCreated: jest.fn().mockResolvedValue(undefined),
        handleCommentCreated: jest.fn().mockResolvedValue(undefined),
        handleUserFollowed: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LikeNotificationHandler,
          CommentNotificationHandler,
          FollowNotificationHandler,
          {
            provide: Logger,
            useValue: mockLogger,
          },
          {
            provide: NotificationProducerService,
            useValue: mockProducerService,
          },
        ],
      }).compile();

      likeHandler = module.get<LikeNotificationHandler>(
        LikeNotificationHandler,
      );
      commentHandler = module.get<CommentNotificationHandler>(
        CommentNotificationHandler,
      );
      followHandler = module.get<FollowNotificationHandler>(
        FollowNotificationHandler,
      );
      producerService = module.get<NotificationProducerService>(
        NotificationProducerService,
      );
    });

    it('should handle like created events correctly', async () => {
      // Create a mock event
      const event: EventBusMessage<any> = {
        eventId: 'test-event-id',
        eventName: SocialEventSchemas.LIKE_CREATED.eventName,
        payload: {
          userId: 'user123',
          targetUserId: 'user456',
          targetId: 'post123',
          targetType: 'post',
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0',
          correlationId: 'test-correlation-id',
        },
      };

      // Call the handler directly
      await likeHandler.handleLikeCreated(event);

      // Verify that the producer service was called with the event
      expect(producerService.handleLikeCreated).toHaveBeenCalledWith(event);
    });

    it('should handle comment created events correctly', async () => {
      // Create a mock event
      const event: EventBusMessage<any> = {
        eventId: 'test-event-id',
        eventName: SocialEventSchemas.COMMENT_CREATED.eventName,
        payload: {
          userId: 'user123',
          targetUserId: 'user456',
          targetId: 'post123',
          targetType: 'post',
          commentId: 'comment123',
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0',
          correlationId: 'test-correlation-id',
        },
      };

      // Call the handler directly
      await commentHandler.handleCommentCreated(event);

      // Verify that the producer service was called with the event
      expect(producerService.handleCommentCreated).toHaveBeenCalledWith(event);
    });

    it('should handle user followed events correctly', async () => {
      // Create a mock event
      const event: EventBusMessage<any> = {
        eventId: 'test-event-id',
        eventName: SocialEventSchemas.USER_FOLLOWED.eventName,
        payload: {
          followerId: 'user123',
          followedId: 'user456',
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0',
          correlationId: 'test-correlation-id',
        },
      };

      // Call the handler directly
      await followHandler.handleUserFollowed(event);

      // Verify that the producer service was called with the event
      expect(producerService.handleUserFollowed).toHaveBeenCalledWith(event);
    });
  });
});

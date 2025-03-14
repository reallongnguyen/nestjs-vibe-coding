import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ContentType } from 'src/common/event-manager';
import {
  CommentCreatedEvent,
  CommentRepliedEvent,
} from 'src/social/entities/events/social.events';
import { CommentNotificationHandler } from '../comment-notification.handler';
import { NotificationProducerService } from '../../../services/notification-producer.service';

describe('CommentNotificationHandler', () => {
  let handler: CommentNotificationHandler;
  let notificationProducer: NotificationProducerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentNotificationHandler,
        {
          provide: NotificationProducerService,
          useValue: {
            handleCommentCreated: jest.fn().mockResolvedValue(undefined),
            handleCommentReplyCreated: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CommentNotificationHandler>(
      CommentNotificationHandler,
    );
    notificationProducer = module.get<NotificationProducerService>(
      NotificationProducerService,
    );
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCommentCreated', () => {
    const mockEvent = new CommentCreatedEvent(
      {
        actorId: '123',
        contentType: ContentType.POST,
        contentId: '456',
        commentId: '789',
        preview: 'Test comment',
        targetUserId: '101',
      },
      { correlationId: 'test-correlation-id' },
    );

    it('should process comment notification successfully', async () => {
      await handler.handleCommentCreated(mockEvent);

      // Check producer service was called
      expect(notificationProducer.handleCommentCreated).toHaveBeenCalledWith(
        mockEvent,
      );

      // Check logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Processing comment notification',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '101',
          commentId: '789',
        }),
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Comment notification forwarded to producer',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '101',
          commentId: '789',
        }),
      );
    });

    it('should handle errors correctly', async () => {
      // Mock error
      const error = new Error('Test error');
      jest
        .spyOn(notificationProducer, 'handleCommentCreated')
        .mockRejectedValueOnce(error);

      // Expect the error to be re-thrown
      await expect(handler.handleCommentCreated(mockEvent)).rejects.toThrow(
        error,
      );

      // Check error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing comment notification: Test error',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          stack: expect.any(String),
          targetUserId: '101',
          commentId: '789',
        }),
      );
    });
  });

  describe('handleCommentReplyCreated', () => {
    const mockEvent = new CommentRepliedEvent(
      {
        actorId: '123',
        contentType: ContentType.POST,
        contentId: '456',
        commentId: '789',
        preview: 'Test reply',
        targetUserId: '101',
      },
      { correlationId: 'test-correlation-id' },
    );

    it('should process comment reply notification successfully', async () => {
      await handler.handleCommentReplyCreated(mockEvent);

      // Check producer service was called
      expect(
        notificationProducer.handleCommentReplyCreated,
      ).toHaveBeenCalledWith(mockEvent);

      // Check logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Processing comment reply notification',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '101',
          commentId: '789',
        }),
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Comment reply notification forwarded to producer',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '101',
          commentId: '789',
        }),
      );
    });

    it('should handle errors correctly', async () => {
      // Mock error
      const error = new Error('Test error');
      jest
        .spyOn(notificationProducer, 'handleCommentReplyCreated')
        .mockRejectedValueOnce(error);

      // Expect the error to be re-thrown
      await expect(
        handler.handleCommentReplyCreated(mockEvent),
      ).rejects.toThrow(error);

      // Check error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing comment reply notification: Test error',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          stack: expect.any(String),
          targetUserId: '101',
          commentId: '789',
        }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import {
  EventBusMessage,
  SocialEventSchemas,
  ContentType,
} from 'src/common/event-manager';
import { NotificationProducerService } from '../services/notification-producer.service';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { CommentNotificationHandler } from '../presentation/handlers/comment-notification.handler';
import { NotificationType } from '../entities/notification-preference.entity';

describe('CommentNotificationHandler', () => {
  let handler: CommentNotificationHandler;
  let producer: NotificationProducerService;
  let preferenceService: NotificationPreferenceService;

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  const mockProducer = {
    handleCommentCreated: jest.fn(),
    handleCommentReplyCreated: jest.fn(),
  };

  const mockPreferenceService = {
    getPreferenceByType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentNotificationHandler,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: NotificationProducerService,
          useValue: mockProducer,
        },
        {
          provide: NotificationPreferenceService,
          useValue: mockPreferenceService,
        },
      ],
    }).compile();

    handler = module.get<CommentNotificationHandler>(
      CommentNotificationHandler,
    );
    producer = module.get<NotificationProducerService>(
      NotificationProducerService,
    );
    preferenceService = module.get<NotificationPreferenceService>(
      NotificationPreferenceService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCommentCreated', () => {
    const mockEvent: EventBusMessage<
      typeof SocialEventSchemas.COMMENT_CREATED.schema
    > = {
      eventId: 'event123',
      eventName: SocialEventSchemas.COMMENT_CREATED.eventName,
      metadata: {
        version: '1.0.0',
        timestamp: Date.now(),
      },
      payload: {
        targetUserId: 'user123',
        actorId: 'actor123',
        contentType: ContentType.POST,
        contentId: 'post123',
        commentId: 'comment123',
        preview: 'Test comment',
      },
    };

    it('should process comment notification when preferences are enabled', async () => {
      mockPreferenceService.getPreferenceByType.mockResolvedValue({
        enabled: true,
      });

      await handler.handleCommentCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        'user123',
        NotificationType.POST_COMMENT,
      );
      expect(producer.handleCommentCreated).toHaveBeenCalledWith(mockEvent);
    });

    it('should skip notification when preferences are disabled', async () => {
      mockPreferenceService.getPreferenceByType.mockResolvedValue({
        enabled: false,
      });

      await handler.handleCommentCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        'user123',
        NotificationType.POST_COMMENT,
      );
      expect(producer.handleCommentCreated).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockPreferenceService.getPreferenceByType.mockRejectedValue(error);

      await expect(handler.handleCommentCreated(mockEvent)).rejects.toThrow(
        error,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleCommentReplyCreated', () => {
    const mockEvent: EventBusMessage<
      typeof SocialEventSchemas.COMMENT_REPLIED.schema
    > = {
      eventId: 'event123',
      eventName: SocialEventSchemas.COMMENT_REPLIED.eventName,
      metadata: {
        version: '1.0.0',
        timestamp: Date.now(),
      },
      payload: {
        targetUserId: 'user123',
        actorId: 'actor123',
        contentType: ContentType.POST,
        contentId: 'post123',
        commentId: 'comment123',
        preview: 'Test reply',
      },
    };

    it('should process reply notification when preferences are enabled', async () => {
      mockPreferenceService.getPreferenceByType.mockResolvedValue({
        enabled: true,
      });

      await handler.handleCommentReplyCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        'user123',
        NotificationType.COMMENT_REPLY,
      );
      expect(producer.handleCommentReplyCreated).toHaveBeenCalledWith(
        mockEvent,
      );
    });

    it('should skip notification when preferences are disabled', async () => {
      mockPreferenceService.getPreferenceByType.mockResolvedValue({
        enabled: false,
      });

      await handler.handleCommentReplyCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        'user123',
        NotificationType.COMMENT_REPLY,
      );
      expect(producer.handleCommentReplyCreated).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockPreferenceService.getPreferenceByType.mockRejectedValue(error);

      await expect(
        handler.handleCommentReplyCreated(mockEvent),
      ).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

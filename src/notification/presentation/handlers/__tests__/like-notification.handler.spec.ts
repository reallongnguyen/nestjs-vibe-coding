import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { NotificationConsumerService } from '../../../services/notification-consumer.service';
import { LikeNotificationHandler } from '../like-notification.handler';
import { LikeNotificationEvent } from '../../../entities/events/like-notification.event';
import { NotificationType } from '../../../entities/notification-preference.entity';

describe('LikeNotificationHandler', () => {
  let handler: LikeNotificationHandler;

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  const mockConsumerService = {
    upsertNotificationSerialByKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeNotificationHandler,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: NotificationConsumerService,
          useValue: mockConsumerService,
        },
      ],
    }).compile();

    handler = module.get<LikeNotificationHandler>(LikeNotificationHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLikeNotification', () => {
    it('should process like notification successfully', async () => {
      // Arrange
      const event = new LikeNotificationEvent(
        'user-123',
        'post-123',
        'POST',
        'liker-123',
        'John Doe',
        'avatar.jpg',
      );

      const expectedInput = {
        key: 'like:POST:post-123',
        type: NotificationType.POST_LIKE,
        userId: 'user-123',
        subjects: [
          {
            id: 'liker-123',
            name: 'John Doe',
            type: 'USER',
            image: 'avatar.jpg',
          },
        ],
        subjectCount: 1,
        diObject: {
          id: 'post-123',
          name: '',
          type: 'POST',
        },
        link: '/post/post-123',
      };

      mockConsumerService.upsertNotificationSerialByKey.mockResolvedValueOnce({
        data: { id: 'notification-123' },
      });

      // Act
      await handler.handleLikeNotification(event);

      // Assert
      expect(
        mockConsumerService.upsertNotificationSerialByKey,
      ).toHaveBeenCalledWith(expectedInput);
      expect(mockLogger.debug).toHaveBeenCalledTimes(2);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const event = new LikeNotificationEvent(
        'user-123',
        'post-123',
        'POST',
        'liker-123',
        'John Doe',
      );

      const error = new Error('Test error');
      mockConsumerService.upsertNotificationSerialByKey.mockRejectedValueOnce(
        error,
      );

      // Act & Assert
      await expect(handler.handleLikeNotification(event)).rejects.toThrow(
        error,
      );
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });
});

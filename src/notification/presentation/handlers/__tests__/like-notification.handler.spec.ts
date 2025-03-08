import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { LikeCreatedEvent } from 'src/common/event-manager/core/domain/events/social.events';
import { ContentType } from 'src/common/event-manager/core/domain/events/schemas/social.events';
import { LikeNotificationHandler } from '../like-notification.handler';
import { NotificationConsumerService } from '../../../services/notification-consumer.service';
import { NotificationTemplateService } from '../../../services/notification-template.service';
import { NotificationPreferenceService } from '../../../services/notification-preference.service';
import {
  NotificationType,
  NotificationChannel,
} from '../../../entities/notification-preference.entity';
import { NotificationCreateInput } from '../../dtos/notification.dto';

describe('LikeNotificationHandler', () => {
  let handler: LikeNotificationHandler;
  let notificationConsumer: NotificationConsumerService;
  let preferenceService: NotificationPreferenceService;
  let logger: Logger;

  const mockPreference = {
    id: 'pref-123',
    userId: '789',
    type: NotificationType.POST_LIKE,
    channels: [NotificationChannel.IN_APP],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeNotificationHandler,
        {
          provide: NotificationConsumerService,
          useValue: {
            upsertNotificationSerialByKey: jest
              .fn()
              .mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationTemplateService,
          useValue: {
            renderTemplate: jest.fn().mockResolvedValue({
              text: 'John liked your post',
              decorators: [],
            }),
          },
        },
        {
          provide: NotificationPreferenceService,
          useValue: {
            getPreferenceByType: jest.fn().mockResolvedValue(mockPreference),
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

    handler = module.get<LikeNotificationHandler>(LikeNotificationHandler);
    notificationConsumer = module.get<NotificationConsumerService>(
      NotificationConsumerService,
    );
    preferenceService = module.get<NotificationPreferenceService>(
      NotificationPreferenceService,
    );
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLikeCreated', () => {
    const mockEvent = new LikeCreatedEvent(
      {
        actorId: '123',
        contentType: ContentType.POST,
        contentId: '456',
        targetUserId: '789',
      },
      { correlationId: 'test-correlation-id' },
    );

    it('should process like notification successfully', async () => {
      await handler.handleLikeCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        '789',
        NotificationType.POST_LIKE,
      );

      expect(
        notificationConsumer.upsertNotificationSerialByKey,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'like:post:456',
          type: NotificationType.POST_LIKE,
          userId: '789',
          subjects: [
            {
              id: '123',
              type: 'USER',
              name: '',
              image: undefined,
            },
          ],
          subjectCount: 1,
          diObject: {
            id: '456',
            type: 'post',
            name: '',
          },
          link: '/post/456',
          metadata: {
            contentId: '456',
            contentType: 'post',
            language: 'EN',
          },
        } as NotificationCreateInput),
      );

      expect(logger.debug).toHaveBeenCalledWith(
        'notification: processing like notification for user 789',
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'notification: like notification processed for user 789',
      );
    });

    it('should skip notification when preference is disabled', async () => {
      jest
        .spyOn(preferenceService, 'getPreferenceByType')
        .mockResolvedValueOnce({
          ...mockPreference,
          enabled: false,
        });

      await handler.handleLikeCreated(mockEvent);

      expect(preferenceService.getPreferenceByType).toHaveBeenCalledWith(
        '789',
        NotificationType.POST_LIKE,
      );

      expect(
        notificationConsumer.upsertNotificationSerialByKey,
      ).not.toHaveBeenCalled();

      expect(logger.debug).toHaveBeenCalledWith(
        'notification: processing like notification for user 789',
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'notification: skipping like notification for user 789 (disabled)',
      );
    });

    it('should handle errors properly', async () => {
      const error = new Error('Test error');
      jest
        .spyOn(notificationConsumer, 'upsertNotificationSerialByKey')
        .mockRejectedValueOnce(error);

      await expect(handler.handleLikeCreated(mockEvent)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'notification: error processing like notification: Test error',
        error.stack,
      );
    });
  });
});

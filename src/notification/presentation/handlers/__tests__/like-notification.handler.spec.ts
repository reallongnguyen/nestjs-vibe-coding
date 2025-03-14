import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ContentType } from 'src/common/event-manager';
import { LikeCreatedEvent } from 'src/social/entities/events/social.events';
import { LikeNotificationHandler } from '../like-notification.handler';
import { NotificationProducerService } from '../../../services/notification-producer.service';

describe('LikeNotificationHandler', () => {
  let handler: LikeNotificationHandler;
  let notificationProducer: NotificationProducerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeNotificationHandler,
        {
          provide: NotificationProducerService,
          useValue: {
            handleLikeCreated: jest.fn().mockResolvedValue(undefined),
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
    notificationProducer = module.get<NotificationProducerService>(
      NotificationProducerService,
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

      // Check producer service was called
      expect(notificationProducer.handleLikeCreated).toHaveBeenCalledWith(
        mockEvent,
      );

      // Check logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Processing like notification',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '789',
        }),
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Like notification forwarded to producer',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          targetUserId: '789',
        }),
      );
    });

    it('should handle errors correctly', async () => {
      // Mock error
      const error = new Error('Test error');
      jest
        .spyOn(notificationProducer, 'handleLikeCreated')
        .mockRejectedValueOnce(error);

      // Expect the error to be re-thrown
      await expect(handler.handleLikeCreated(mockEvent)).rejects.toThrow(error);

      // Check error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing like notification: Test error',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          stack: expect.any(String),
          targetUserId: '789',
        }),
      );
    });
  });
});

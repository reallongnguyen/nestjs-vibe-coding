import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';
import { FollowNotificationHandler } from '../follow-notification.handler';
import { NotificationProducerService } from '../../../services/notification-producer.service';

describe('FollowNotificationHandler', () => {
  let handler: FollowNotificationHandler;
  let notificationProducer: NotificationProducerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowNotificationHandler,
        {
          provide: NotificationProducerService,
          useValue: {
            handleUserFollowed: jest.fn().mockResolvedValue(undefined),
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

    handler = module.get<FollowNotificationHandler>(FollowNotificationHandler);
    notificationProducer = module.get<NotificationProducerService>(
      NotificationProducerService,
    );
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleUserFollowed', () => {
    const mockEvent: EventBusMessage<
      typeof SocialEventSchemas.USER_FOLLOWED.schema
    > = {
      eventId: 'test-event-id',
      eventName: SocialEventSchemas.USER_FOLLOWED.eventName,
      payload: {
        followerId: '123',
        followerName: 'John Doe',
        followingId: '456',
        followerAvatar: 'avatar-url',
      },
      metadata: {
        correlationId: 'test-correlation-id',
        timestamp: Date.now(),
        version: '1.0.0',
      },
    };

    it('should process follow notification successfully', async () => {
      await handler.handleUserFollowed(mockEvent);

      // Check producer service was called
      expect(notificationProducer.handleUserFollowed).toHaveBeenCalledWith(
        mockEvent,
      );

      // Check logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Processing follow notification',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          followingId: '456',
          followerId: '123',
        }),
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Follow notification forwarded to producer',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          followingId: '456',
          followerId: '123',
        }),
      );
    });

    it('should handle errors correctly', async () => {
      // Mock error
      const error = new Error('Test error');
      jest
        .spyOn(notificationProducer, 'handleUserFollowed')
        .mockRejectedValueOnce(error);

      // Expect the error to be re-thrown
      await expect(handler.handleUserFollowed(mockEvent)).rejects.toThrow(
        error,
      );

      // Check error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing follow notification: Test error',
        expect.objectContaining({
          eventId: mockEvent.eventId,
          stack: expect.any(String),
          followingId: '456',
          followerId: '123',
        }),
      );
    });
  });
});

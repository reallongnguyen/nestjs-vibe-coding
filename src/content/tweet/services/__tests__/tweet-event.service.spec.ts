import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { TweetEventService } from '../tweet-event.service';
import { TweetCreatedEvent } from '../../events/tweet-created.event';
import { TweetUpdatedEvent } from '../../events/tweet-updated.event';
import { TweetDeletedEvent } from '../../events/tweet-deleted.event';
import { Tweet } from '../../models/tweet.model';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockImplementation(() => ({
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('TweetEventService', () => {
  let service: TweetEventService;
  let eventBus: jest.Mocked<EventBus>;
  let logger: jest.Mocked<Logger>;

  const mockTweet = new Tweet(
    '1',
    'Test tweet',
    ['image1.jpg'],
    'user1',
    false,
    1,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    jest.useFakeTimers();
    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetEventService,
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<TweetEventService>(TweetEventService);
    eventBus = module.get(EventBus) as jest.Mocked<EventBus>;
    logger = new Logger() as jest.Mocked<Logger>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('publishTweetCreatedEvent', () => {
    it('should publish event successfully on first attempt', async () => {
      eventBus.publish.mockResolvedValueOnce(undefined);

      await service.publishTweetCreatedEvent(mockTweet);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TweetCreatedEvent),
      );
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should retry on temporary failure and succeed', async () => {
      eventBus.publish
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(undefined);

      const promise = service.publishTweetCreatedEvent(mockTweet);

      // Fast-forward past first delay (100ms)
      await jest.advanceTimersByTimeAsync(100);
      await promise;

      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to publish tweet created event (attempt 1/3): Temporary error',
      );
      expect(logger.error).not.toHaveBeenCalled();
    }, 15000);

    it('should fail after max retries', async () => {
      const error = new Error('Persistent error');
      eventBus.publish.mockRejectedValue(error);

      const promise = service.publishTweetCreatedEvent(mockTweet);

      // Fast-forward through all retry delays (100ms, 200ms, 400ms)
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);
      await jest.advanceTimersByTimeAsync(400);

      await expect(promise).rejects.toThrow(
        'Failed to publish tweet created event after 3 attempts',
      );

      expect(eventBus.publish).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to publish tweet created event after 3 attempts',
        error.stack,
      );
    }, 15000);
  });

  describe('publishTweetUpdatedEvent', () => {
    it('should publish event successfully', async () => {
      eventBus.publish.mockResolvedValueOnce(undefined);

      await service.publishTweetUpdatedEvent(mockTweet);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TweetUpdatedEvent),
      );
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should include isArchived in event payload', async () => {
      eventBus.publish.mockResolvedValueOnce(undefined);
      const archivedTweet = mockTweet.archive();

      await service.publishTweetUpdatedEvent(archivedTweet);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            isArchived: true,
          }),
        }),
      );
    });
  });

  describe('publishTweetDeletedEvent', () => {
    it('should publish event successfully', async () => {
      eventBus.publish.mockResolvedValueOnce(undefined);

      await service.publishTweetDeletedEvent(mockTweet);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(TweetDeletedEvent),
      );
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should include minimal payload', async () => {
      eventBus.publish.mockResolvedValueOnce(undefined);

      await service.publishTweetDeletedEvent(mockTweet);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            tweetId: mockTweet.id,
            userId: mockTweet.userId,
            timestamp: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('should use correct delay times', async () => {
      eventBus.publish.mockRejectedValue(new Error('Test error'));

      const promise = service.publishTweetCreatedEvent(mockTweet);

      // Verify first delay (100ms)
      jest.advanceTimersByTime(99);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(2);

      // Verify second delay (200ms)
      jest.advanceTimersByTime(199);
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(3);

      // Verify third attempt (no more retries)
      jest.advanceTimersByTime(400);
      expect(eventBus.publish).toHaveBeenCalledTimes(3);

      await expect(promise).rejects.toThrow();
    });
  });
});

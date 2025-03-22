import { Test, TestingModule } from '@nestjs/testing';
import { EventBus, CommandBus, UnhandledExceptionBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { TweetEventMonitor } from './tweet-event-monitor';
import { TweetCreatedEvent } from '../../events/tweet-created.event';
import { TweetUpdatedEvent } from '../../events/tweet-updated.event';
import { TweetDeletedEvent } from '../../events/tweet-deleted.event';
import { Tweet } from '../../models/tweet.model';

describe('Tweet Event Performance Tests', () => {
  let module: TestingModule;
  let eventBus: EventBus;
  let monitor: TweetEventMonitor;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockModuleRef = {
    get: jest.fn(),
  };

  const mockUnhandledExceptionBus = {
    catch: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        EventBus,
        TweetEventMonitor,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        {
          provide: UnhandledExceptionBus,
          useValue: mockUnhandledExceptionBus,
        },
        {
          provide: 'CQRS_MODULE_OPTIONS',
          useValue: {},
        },
      ],
    }).compile();

    eventBus = module.get<EventBus>(EventBus);
    monitor = module.get<TweetEventMonitor>(TweetEventMonitor);
  });

  afterEach(async () => {
    await module.close();
  });

  const createMockTweet = (id: string): Tweet => {
    return new Tweet(
      id,
      'Test content',
      [],
      'user1',
      false,
      1,
      new Date(),
      new Date(),
    );
  };

  describe('Event Publishing Performance', () => {
    it('should handle high volume of events within acceptable latency', async () => {
      const eventCount = 100;
      const maxAverageLatency = 50; // ms
      const minSuccessRate = 99; // %
      const tweets = Array.from({ length: eventCount }, (_, i) =>
        createMockTweet(`tweet-${i}`),
      );

      monitor.reset();

      // Publish create events
      await Promise.all(
        tweets.map((tweet) =>
          eventBus.publish(
            new TweetCreatedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              content: tweet.content,
              images: tweet.images,
              timestamp: Date.now(),
            }),
          ),
        ),
      );

      // Publish update events
      await Promise.all(
        tweets.map((tweet) =>
          eventBus.publish(
            new TweetUpdatedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              content: `${tweet.content} (updated)`,
              images: tweet.images,
              isArchived: false,
              timestamp: Date.now(),
            }),
          ),
        ),
      );

      // Publish delete events
      await Promise.all(
        tweets.map((tweet) =>
          eventBus.publish(
            new TweetDeletedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              timestamp: Date.now(),
            }),
          ),
        ),
      );

      const metrics = monitor.getMetrics();
      monitor.logMetrics();

      // Assertions
      expect(metrics.totalEvents).toBe(eventCount * 3); // Create, Update, Delete events
      expect(metrics.averageLatency).toBeLessThan(maxAverageLatency);
      expect(metrics.successRate).toBeGreaterThan(minSuccessRate);
      expect(metrics.failedEvents).toBe(0);
    });

    it('should handle concurrent event publishing', async () => {
      const concurrentEvents = 10;
      const iterations = 5;
      const maxRetryRate = 5; // %

      monitor.reset();

      const allBatchTweets = Array.from(
        { length: iterations },
        (unused1, batchIndex) =>
          Array.from({ length: concurrentEvents }, (unused2, tweetIndex) =>
            createMockTweet(`tweet-${batchIndex}-${tweetIndex}`),
          ),
      );

      const publishEvents = async (tweets: Tweet[]) => {
        const createEvents = tweets.map((tweet) =>
          eventBus.publish(
            new TweetCreatedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              content: tweet.content,
              images: tweet.images,
              timestamp: Date.now(),
            }),
          ),
        );

        const updateEvents = tweets.map((tweet) =>
          eventBus.publish(
            new TweetUpdatedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              content: `${tweet.content} (updated)`,
              images: tweet.images,
              isArchived: false,
              timestamp: Date.now(),
            }),
          ),
        );

        const deleteEvents = tweets.map((tweet) =>
          eventBus.publish(
            new TweetDeletedEvent({
              tweetId: tweet.id,
              userId: tweet.userId,
              timestamp: Date.now(),
            }),
          ),
        );

        await Promise.all([...createEvents, ...updateEvents, ...deleteEvents]);
      };

      await Promise.all(allBatchTweets.map(publishEvents));

      const metrics = monitor.getMetrics();
      monitor.logMetrics();

      // Assertions
      expect(metrics.totalEvents).toBe(concurrentEvents * 3 * iterations);
      expect(metrics.retryRate).toBeLessThan(maxRetryRate);
      expect(metrics.successfulEvents).toBe(metrics.totalEvents);
    });
  });
});

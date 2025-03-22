import { Test, TestingModule } from '@nestjs/testing';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TweetEventService } from '../../services/tweet-event.service';
import { TweetCreatedEvent } from '../../events/tweet-created.event';
import { TweetUpdatedEvent } from '../../events/tweet-updated.event';
import { TweetDeletedEvent } from '../../events/tweet-deleted.event';
import { Tweet } from '../../models/tweet.model';

// Mock event handlers to simulate downstream services
@EventsHandler(TweetCreatedEvent)
class TweetCreatedHandler implements IEventHandler<TweetCreatedEvent> {
  private readonly events: TweetCreatedEvent[] = [];

  handle(event: TweetCreatedEvent) {
    this.events.push(event);
    return Promise.resolve();
  }

  getEvents(): TweetCreatedEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}

@EventsHandler(TweetUpdatedEvent)
class TweetUpdatedHandler implements IEventHandler<TweetUpdatedEvent> {
  private readonly events: TweetUpdatedEvent[] = [];

  handle(event: TweetUpdatedEvent) {
    this.events.push(event);
    return Promise.resolve();
  }

  getEvents(): TweetUpdatedEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}

@EventsHandler(TweetDeletedEvent)
class TweetDeletedHandler implements IEventHandler<TweetDeletedEvent> {
  private readonly events: TweetDeletedEvent[] = [];

  handle(event: TweetDeletedEvent) {
    this.events.push(event);
    return Promise.resolve();
  }

  getEvents(): TweetDeletedEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}

describe('TweetEventService Integration', () => {
  let module: TestingModule;
  let service: TweetEventService;
  let createdHandler: TweetCreatedHandler;
  let updatedHandler: TweetUpdatedHandler;
  let deletedHandler: TweetDeletedHandler;

  const mockTweet = new Tweet(
    '1',
    'Integration test tweet',
    ['test-image.jpg'],
    'user1',
    false,
    1,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    // Create handlers
    createdHandler = new TweetCreatedHandler();
    updatedHandler = new TweetUpdatedHandler();
    deletedHandler = new TweetDeletedHandler();

    const mockEventBus = {
      publish: jest.fn().mockImplementation(async (event: any) => {
        if (event instanceof TweetCreatedEvent) {
          await createdHandler.handle(event);
        } else if (event instanceof TweetUpdatedEvent) {
          await updatedHandler.handle(event);
        } else if (event instanceof TweetDeletedEvent) {
          await deletedHandler.handle(event);
        }
      }),
    };

    module = await Test.createTestingModule({
      providers: [
        TweetEventService,
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<TweetEventService>(TweetEventService);
  });

  afterEach(() => {
    createdHandler.clearEvents();
    updatedHandler.clearEvents();
    deletedHandler.clearEvents();
  });

  describe('Event Publishing Flow', () => {
    it('should publish and handle tweet creation event', async () => {
      await service.publishTweetCreatedEvent(mockTweet);

      const events = createdHandler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        payload: {
          tweetId: mockTweet.id,
          userId: mockTweet.userId,
          content: mockTweet.content,
          images: mockTweet.images,
        },
      });
    });

    it('should publish and handle tweet update event', async () => {
      const updatedTweet = mockTweet.update('Updated content', [
        'new-image.jpg',
      ]);
      await service.publishTweetUpdatedEvent(updatedTweet);

      const events = updatedHandler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        payload: {
          tweetId: updatedTweet.id,
          userId: updatedTweet.userId,
          content: 'Updated content',
          images: ['new-image.jpg'],
          isArchived: false,
        },
      });
    });

    it('should publish and handle tweet archive event', async () => {
      const archivedTweet = mockTweet.archive();
      await service.publishTweetUpdatedEvent(archivedTweet);

      const events = updatedHandler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        payload: {
          tweetId: archivedTweet.id,
          userId: archivedTweet.userId,
          isArchived: true,
        },
      });
    });

    it('should publish and handle tweet deletion event', async () => {
      await service.publishTweetDeletedEvent(mockTweet);

      const events = deletedHandler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        payload: {
          tweetId: mockTweet.id,
          userId: mockTweet.userId,
        },
      });
    });

    it('should handle multiple events in order', async () => {
      // Create tweet
      await service.publishTweetCreatedEvent(mockTweet);

      // Update tweet
      const updatedTweet = mockTweet.update('Updated content', [
        'new-image.jpg',
      ]);
      await service.publishTweetUpdatedEvent(updatedTweet);

      // Archive tweet
      const archivedTweet = updatedTweet.archive();
      await service.publishTweetUpdatedEvent(archivedTweet);

      // Delete tweet
      await service.publishTweetDeletedEvent(archivedTweet);

      // Verify event sequence
      expect(createdHandler.getEvents()).toHaveLength(1);
      expect(updatedHandler.getEvents()).toHaveLength(2);
      expect(deletedHandler.getEvents()).toHaveLength(1);

      // Verify event order through timestamps
      const allEvents = [
        ...createdHandler.getEvents(),
        ...updatedHandler.getEvents(),
        ...deletedHandler.getEvents(),
      ].sort((a, b) => a.payload.timestamp - b.payload.timestamp);

      expect(allEvents).toHaveLength(4);
      expect(allEvents[0]).toBeInstanceOf(TweetCreatedEvent);
      expect(allEvents[1]).toBeInstanceOf(TweetUpdatedEvent);
      expect(allEvents[2]).toBeInstanceOf(TweetUpdatedEvent);
      expect(allEvents[3]).toBeInstanceOf(TweetDeletedEvent);
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent event publishing', async () => {
      // Simulate multiple concurrent event publications with delay
      const promises = Array(5)
        .fill(null)
        .map(
          (_, index) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                service.publishTweetCreatedEvent(mockTweet).then(resolve);
              }, index * 10); // Add small delay between events
            }),
        );

      await Promise.all(promises);

      const events = createdHandler.getEvents();
      expect(events).toHaveLength(5);

      // Verify all events have unique timestamps
      const timestamps = events.map((e) => e.payload.timestamp);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(5);
    }, 15000);

    it('should maintain event order under load', async () => {
      const tweets = Array(10)
        .fill(null)
        .map(
          (_, i) =>
            new Tweet(
              `${i}`,
              `Tweet ${i}`,
              [],
              'user1',
              false,
              1,
              new Date(),
              new Date(),
            ),
        );

      // Create all tweets concurrently
      await Promise.all(
        tweets.map((tweet) => service.publishTweetCreatedEvent(tweet)),
      );

      const events = createdHandler.getEvents();
      expect(events).toHaveLength(10);

      // Verify timestamps are monotonically increasing
      const timestamps = events.map((e) => e.payload.timestamp);
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sortedTimestamps);
    });
  });
});

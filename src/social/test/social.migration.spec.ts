import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { FeedContentType } from '../entities/feed.entity';
import { ContentRankingForFeedService } from '../services/content-ranking-for-feed.service';
import { ContentProcessedEvent } from '../entities/events/content.event';

/**
 * Test suite for verifying social module migration from event-bus to event-manager
 */
describe('Social Module Migration', () => {
  let contentRankingService: ContentRankingForFeedService;
  let eventBus: any;

  beforeEach(async () => {
    // Create mock Logger
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    // Create mock PrismaService
    const mockPrismaService = {
      publishedPost: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'post-1',
          title: 'Test Post',
          content: 'Test content',
          publishedAt: new Date(),
          likes: [],
          comments: [],
        }),
      },
      emotion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'emotion-1',
          content: 'Test emotion',
          createdAt: new Date(),
          intensity: 5,
        }),
      },
    };

    // Create the test module
    const module = await Test.createTestingModule({
      imports: [EventManagerModule],
      providers: [
        ContentRankingForFeedService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    contentRankingService = module.get<ContentRankingForFeedService>(
      ContentRankingForFeedService,
    );
    eventBus = module.get(EVENT_BUS_TOKEN);

    // Spy on the eventBus publish method
    jest.spyOn(eventBus, 'publish').mockImplementation(async () => {
      return Promise.resolve();
    });
  });

  describe('Event Publishing', () => {
    it('should publish ContentProcessedEvent when processPost is called', async () => {
      // Arrange
      const postId = 'post-1';

      // Act
      await contentRankingService.processPost(postId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the event that was published
      const publishedEvent = eventBus.publish.mock.calls[0][0];

      // Verify the event is an instance of ContentProcessedEvent
      expect(publishedEvent).toBeInstanceOf(ContentProcessedEvent);

      // Verify event contains correct data
      const eventData = publishedEvent.toJSON();
      expect(eventData.id).toBe(postId);
      expect(eventData.type).toBe(FeedContentType.POST);
      expect(eventData.score).toBeDefined();
      expect(eventData.timestamp).toBeDefined();
    });

    it('should publish ContentProcessedEvent when removeContent is called', async () => {
      // Arrange
      const contentId = 'content-1';
      const contentType = FeedContentType.POST;

      // Act
      await contentRankingService.removeContent(contentType, contentId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the event that was published
      const publishedEvent = eventBus.publish.mock.calls[0][0];

      // Verify the event is an instance of ContentProcessedEvent
      expect(publishedEvent).toBeInstanceOf(ContentProcessedEvent);

      // Verify event contains correct data
      const eventData = publishedEvent.toJSON();
      expect(eventData.id).toBe(contentId);
      expect(eventData.type).toBe(contentType);
      expect(eventData.score).toBe(0); // Score should be 0 for removal
    });
  });
});

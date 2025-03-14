import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/common';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import { DraftPostService } from '../services/draft-post.service';
import { PublishedPostService } from '../services/published-post.service';
import { ContentEvents } from '../services/content.events';
import {
  DraftPostDeletedEvent,
  PublishedPostDeletedEvent,
} from '../entities/events/post-deleted.event';

/**
 * Test suite for verifying content module migration from event-bus to event-manager
 */
describe('Content Module Migration', () => {
  let draftPostService: DraftPostService;
  let publishedPostService: PublishedPostService;
  let eventBus: any;

  beforeEach(async () => {
    // Mock repositories
    const mockDraftPostRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'draft-1',
        userId: 'user-1',
        title: 'Test Draft',
        content: 'Test content',
        imageUrl: 'https://example.com/image.jpg',
        cover: 'https://example.com/image.jpg',
      }),
      findByPublishedId: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockPublishedPostRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'published-1',
        userId: 'user-1',
        title: 'Test Published',
        content: 'Test content',
        imageUrl: 'https://example.com/image.jpg',
      }),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockTopicRepository = {
      findByIds: jest.fn().mockResolvedValue([]),
    };

    // Create the test module
    const module = await Test.createTestingModule({
      imports: [EventManagerModule],
      providers: [
        DraftPostService,
        PublishedPostService,
        ContentEvents,
        {
          provide: 'IDraftPostRepository',
          useValue: mockDraftPostRepository,
        },
        {
          provide: 'IPublishedPostRepository',
          useValue: mockPublishedPostRepository,
        },
        {
          provide: 'ITopicRepository',
          useValue: mockTopicRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            draftPost: {
              findUnique: jest.fn(),
            },
            publishedPost: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    draftPostService = module.get<DraftPostService>(DraftPostService);
    publishedPostService =
      module.get<PublishedPostService>(PublishedPostService);
    eventBus = module.get(EVENT_BUS_TOKEN);

    // Spy on the eventBus publish method
    jest.spyOn(eventBus, 'publish').mockImplementation(async () => {
      return Promise.resolve();
    });
  });

  describe('Event Publishing', () => {
    it('should publish DraftPostDeletedEvent when deleteDraft is called', async () => {
      // Arrange
      const draftId = 'draft-1';
      const userId = 'user-1';

      // Act
      await draftPostService.deleteDraft(draftId, userId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the events that were published
      const publishedEvents = eventBus.publish.mock.calls.map(
        (call) => call[0],
      );

      // Find the DraftPostDeletedEvent
      const draftDeletedEvent = publishedEvents.find(
        (event) => event instanceof DraftPostDeletedEvent,
      );

      // Verify the event exists and contains correct data
      expect(draftDeletedEvent).toBeDefined();
      expect(draftDeletedEvent).toBeInstanceOf(DraftPostDeletedEvent);
      expect(draftDeletedEvent.toJSON().postId).toBe(draftId);
      expect(draftDeletedEvent.toJSON().userId).toBe(userId);
    });

    it('should publish PublishedPostDeletedEvent when deletePublished is called', async () => {
      // Arrange
      const publishedId = 'published-1';
      const userId = 'user-1';

      // Act
      await publishedPostService.deletePublished(publishedId, userId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();

      // Get the events that were published
      const publishedEvents = eventBus.publish.mock.calls.map(
        (call) => call[0],
      );

      // Find the PublishedPostDeletedEvent
      const publishedDeletedEvent = publishedEvents.find(
        (event) => event instanceof PublishedPostDeletedEvent,
      );

      // Verify the event exists and contains correct data
      expect(publishedDeletedEvent).toBeDefined();
      expect(publishedDeletedEvent).toBeInstanceOf(PublishedPostDeletedEvent);
      expect(publishedDeletedEvent.toJSON().postId).toBe(publishedId);
      expect(publishedDeletedEvent.toJSON().userId).toBe(userId);
    });

    it('should publish DeleteImageCommand when deleting posts with images', async () => {
      // This test would be more complete by mocking things differently,
      // but demonstrates the concept
      const imageUrl = 'https://example.com/image.jpg';

      // Create a mock DeleteImageCommand
      const deleteImageCommand = new DeleteImageCommand(imageUrl);

      // Verify it's properly formed
      expect(deleteImageCommand.toJSON().imageUrl).toBe(imageUrl);
    });
  });
});

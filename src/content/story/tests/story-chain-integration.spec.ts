import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { StoryErrorCode } from '../entities/errors';
import { Story } from '../entities/story.entity';
import { STORY_REPOSITORY } from '../repositories/story.repository';
import { StoryService } from '../services/story.service';

describe('Story Chain Integration Tests', () => {
  let storyService: StoryService;
  let module: TestingModule;

  const mockStoryRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByRootId: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const userId = 'test-user-id';
  let rootStory: Story;
  let continuationStory: Story;
  let forkedStory: Story;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        StoryService,
        {
          provide: STORY_REPOSITORY,
          useValue: mockStoryRepository,
        },
        {
          provide: EVENT_BUS_TOKEN,
          useValue: mockEventBus,
        },
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
      ],
    }).compile();

    storyService = module.get<StoryService>(StoryService);
  });

  describe('Complete Story Chain Flow', () => {
    it('should create, continue, fork and retrieve a story chain', async () => {
      // Setup mock root story creation
      rootStory = Story.create({
        id: 'root-story-id',
        content: 'Root story content',
        images: [],
        userId,
        parentId: null,
        rootId: 'root-story-id', // Same as its own ID
        chainPosition: 0,
        isArchived: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStoryRepository.create.mockImplementationOnce(() =>
        Promise.resolve(rootStory),
      );
      mockStoryRepository.findById.mockImplementation((id) => {
        if (id === 'root-story-id') return Promise.resolve(rootStory);
        if (id === 'continuation-story-id')
          return Promise.resolve(continuationStory);
        if (id === 'forked-story-id') return Promise.resolve(forkedStory);
        return Promise.resolve(null);
      });

      // 1. Create the root story
      const createdStory = await storyService.createStory({
        content: 'Root story content',
        images: [],
        userId,
      });

      expect(createdStory.id).toBe('root-story-id');
      expect(createdStory.rootId).toBe('root-story-id');
      expect(createdStory.chainPosition).toBe(0);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);

      // Setup mock continuation story
      continuationStory = Story.create({
        id: 'continuation-story-id',
        content: 'Continuation story content',
        images: [],
        userId,
        parentId: 'root-story-id',
        rootId: 'root-story-id',
        chainPosition: 1,
        isArchived: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStoryRepository.create.mockImplementationOnce(() =>
        Promise.resolve(continuationStory),
      );

      // 2. Continue the story
      const continuedStory = await storyService.continueStory({
        content: 'Continuation story content',
        images: [],
        userId,
        parentId: 'root-story-id',
      });

      expect(continuedStory.id).toBe('continuation-story-id');
      expect(continuedStory.parentId).toBe('root-story-id');
      expect(continuedStory.rootId).toBe('root-story-id');
      expect(continuedStory.chainPosition).toBe(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);

      // Setup mock forked story
      forkedStory = Story.create({
        id: 'forked-story-id',
        content: 'Forked story content',
        images: [],
        userId,
        parentId: 'continuation-story-id',
        rootId: null, // Initially null
        chainPosition: 0,
        isArchived: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedForkedStory = Story.create({
        ...forkedStory,
        rootId: 'forked-story-id', // Updated to its own ID
      });

      mockStoryRepository.create.mockImplementationOnce(() =>
        Promise.resolve(forkedStory),
      );
      mockStoryRepository.update.mockImplementationOnce(() =>
        Promise.resolve(updatedForkedStory),
      );

      // 3. Fork the story from the continuation
      const forkedStoryResult = await storyService.forkStory({
        content: 'Forked story content',
        images: [],
        userId,
        sourceStoryId: 'continuation-story-id',
      });

      expect(forkedStoryResult.id).toBe('forked-story-id');
      expect(forkedStoryResult.parentId).toBe('continuation-story-id');
      expect(forkedStoryResult.rootId).toBe('forked-story-id'); // Should be set to its own ID
      expect(forkedStoryResult.chainPosition).toBe(0);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(3);

      // Setup mock chain retrieval
      mockStoryRepository.findByRootId.mockImplementationOnce(() =>
        Promise.resolve([rootStory, continuationStory]),
      );

      // 4. Get the original chain
      const chain = await storyService.getStoryChain('root-story-id');

      expect(chain.root.id).toBe('root-story-id');
      expect(chain.totalStories).toBe(2);
      expect(chain.maxDepth).toBe(1);
      expect(chain.root.children).toHaveLength(1);
      expect(chain.root.children[0].id).toBe('continuation-story-id');
    });

    it('should throw an error when retrieving a non-existent chain', async () => {
      mockStoryRepository.findById.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await expect(
        storyService.getStoryChain('non-existent-id'),
      ).rejects.toMatchObject({
        code: StoryErrorCode.STORY_NOT_FOUND,
      });
    });

    it('should throw an error when the story is not a chain root', async () => {
      const nonRootStory = Story.create({
        id: 'non-root-story-id',
        content: 'Not a root story',
        images: [],
        userId,
        parentId: 'some-parent-id',
        rootId: 'some-root-id', // Different from its own ID
        chainPosition: 2,
        isArchived: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStoryRepository.findById.mockImplementationOnce(() =>
        Promise.resolve(nonRootStory),
      );

      await expect(
        storyService.getStoryChain('non-root-story-id'),
      ).rejects.toMatchObject({
        code: StoryErrorCode.NOT_CHAIN_ROOT,
      });
    });
  });
});

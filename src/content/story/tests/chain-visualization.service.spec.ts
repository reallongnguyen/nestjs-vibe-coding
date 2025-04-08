import { Test, TestingModule } from '@nestjs/testing';
import { ChainVisualizationService } from '../services/chain-visualization.service';
import { STORY_REPOSITORY } from '../repositories/story.repository';
import { Story } from '../entities/story.entity';
import { StoryErrorCode } from '../entities/errors';

describe('ChainVisualizationService', () => {
  let service: ChainVisualizationService;

  const mockStoryRepository = {
    findById: jest.fn(),
    findByRootId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChainVisualizationService,
        {
          provide: STORY_REPOSITORY,
          useValue: mockStoryRepository,
        },
      ],
    }).compile();

    service = module.get<ChainVisualizationService>(ChainVisualizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('visualizeChain', () => {
    it('should generate visualization data for a simple chain', async () => {
      // Create mock story chain with 3 nodes
      const rootStory = Story.create({
        id: 'root-id',
        content: 'Root content',
        images: [],
        userId: 'user-id',
        parentId: null,
        rootId: 'root-id', // Same as own ID
        chainPosition: 0,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const child1 = Story.create({
        id: 'child1-id',
        content: 'Child 1 content',
        images: [],
        userId: 'user-id',
        parentId: 'root-id',
        rootId: 'root-id',
        chainPosition: 1,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const child2 = Story.create({
        id: 'child2-id',
        content: 'Child 2 content',
        images: [],
        userId: 'user-id',
        parentId: 'root-id',
        rootId: 'root-id',
        chainPosition: 1,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Set up mock repository responses
      mockStoryRepository.findById.mockResolvedValue(rootStory);
      mockStoryRepository.findByRootId.mockResolvedValue([
        rootStory,
        child1,
        child2,
      ]);

      // Call the service
      const result = await service.visualizeChain('root-id');

      // Assertions
      expect(result.rootId).toBe('root-id');
      expect(result.nodes.length).toBe(3);
      expect(result.connections.length).toBe(2);

      // Root node should be at level 0
      const rootNode = result.nodes.find((n) => n.id === 'root-id');
      expect(rootNode).toBeDefined();
      expect(rootNode?.level).toBe(0);
      expect(rootNode?.childrenIds.length).toBe(2);

      // Children should be at level 1
      const childNodes = result.nodes.filter((n) => n.id !== 'root-id');
      childNodes.forEach((node) => {
        expect(node.level).toBe(1);
        expect(node.parentId).toBe('root-id');
      });

      // Check that dimensions are calculated correctly
      expect(result.height).toBe(2); // Levels 0 and 1
      expect(result.width).toBeGreaterThan(0);

      // Check connections
      expect(result.connections).toContainEqual({
        source: 'root-id',
        target: 'child1-id',
      });
      expect(result.connections).toContainEqual({
        source: 'root-id',
        target: 'child2-id',
      });
    });

    it('should throw an error when the story does not exist', async () => {
      mockStoryRepository.findById.mockResolvedValue(null);

      await expect(
        service.visualizeChain('non-existent-id'),
      ).rejects.toMatchObject({
        code: StoryErrorCode.STORY_NOT_FOUND,
      });
    });

    it('should throw an error when the story is not a chain root', async () => {
      const nonRootStory = Story.create({
        id: 'non-root-id',
        content: 'Not a root story',
        images: [],
        userId: 'user-id',
        parentId: 'some-parent-id',
        rootId: 'some-root-id', // Different from own id
        chainPosition: 2,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStoryRepository.findById.mockResolvedValue(nonRootStory);

      await expect(service.visualizeChain('non-root-id')).rejects.toMatchObject(
        {
          code: StoryErrorCode.NOT_CHAIN_ROOT,
        },
      );
    });
  });
});

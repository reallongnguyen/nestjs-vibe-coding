import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from 'nestjs-pino';
import { CacheService } from '../../common/cache/cache.service';
import { FeedEnrichmentService } from '../services/feed-enrichment.service';
import { GetContentsCommand } from '../entities/commands/get-contents.command';
import { GetUsersCommand } from '../entities/commands/get-users.command';
import { GetEngagementMetricsCommand } from '../entities/commands/get-engagement-metrics.command';
import { GetUserLikesStatusCommand } from '../entities/commands/get-user-likes-status.command';
import { GetUserFollowStatusCommand } from '../entities/commands/get-user-follow-status.command';
import {
  EngagementMetrics,
  FeedContent,
  UserFollowStatus,
  UserInfo,
  UserLikeStatus,
} from '../entities/feed.types';

describe('FeedEnrichmentService', () => {
  let service: FeedEnrichmentService;
  let commandBus: CommandBus;
  let logger: Logger;
  let cacheService: CacheService;

  // Mock data
  const mockContents: FeedContent[] = [
    {
      id: 'content-1',
      type: 'article',
      title: 'Test Article',
      content: 'Test content',
      authorId: 'user-1',
      score: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'content-2',
      type: 'post',
      title: 'Test Post',
      content: 'Test content 2',
      authorId: 'user-2',
      score: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUsers: UserInfo[] = [
    {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: 'http://example.com/avatar1.jpg',
    },
    {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: null,
    },
  ];

  const mockEngagementMetrics: EngagementMetrics[] = [
    {
      contentId: 'content-1',
      likeCount: 10,
      commentCount: 5,
      viewCount: 100,
    },
    {
      contentId: 'content-2',
      likeCount: 20,
      commentCount: 15,
      viewCount: 200,
    },
  ];

  const mockLikeStatus: UserLikeStatus[] = [
    {
      contentId: 'content-1',
      liked: true,
    },
    {
      contentId: 'content-2',
      liked: false,
    },
  ];

  const mockFollowStatus: UserFollowStatus[] = [
    {
      targetUserId: 'user-1',
      following: true,
    },
    {
      targetUserId: 'user-2',
      following: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedEnrichmentService,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<FeedEnrichmentService>(FeedEnrichmentService);
    commandBus = module.get<CommandBus>(CommandBus);
    logger = module.get<Logger>(Logger);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enrichFeedItems', () => {
    it('should return empty array when contentIds is empty', async () => {
      const result = await service.enrichFeedItems([]);
      expect(result).toEqual([]);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('should enrich feed items with content data only when other services fail', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        return Promise.reject(new Error('Test error'));
      });

      // Test
      const result = await service.enrichFeedItems(['content-1', 'content-2']);

      // Verify
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('content-1');
      expect(result[0].content).toBe(mockContents[0]);
      expect(result[0].author).toBeUndefined();
      expect(result[0].engagement).toBeUndefined();
      expect(result[0].userSpecific).toBeUndefined();
    });

    it('should fully enrich feed items when all data is available and user is logged in', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.resolve(mockUsers);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          return Promise.resolve(mockEngagementMetrics);
        }
        if (command instanceof GetUserLikesStatusCommand) {
          return Promise.resolve(mockLikeStatus);
        }
        if (command instanceof GetUserFollowStatusCommand) {
          return Promise.resolve(mockFollowStatus);
        }
        return Promise.reject(new Error('Unknown command'));
      });

      jest.spyOn(cacheService, 'get').mockResolvedValue(null); // Simulate cache miss

      // Test
      const result = await service.enrichFeedItems(
        ['content-1', 'content-2'],
        'current-user',
      );

      // Verify
      expect(result).toHaveLength(2);

      // Check first item
      expect(result[0].id).toBe('content-1');
      expect(result[0].content).toBe(mockContents[0]);

      expect(result[0].author).toBeDefined();
      expect(result[0].author!.id).toBe('user-1');
      expect(result[0].author!.firstName).toBe('John');

      expect(result[0].engagement).toBeDefined();
      expect(result[0].engagement!.likeCount).toBe(10);

      expect(result[0].userSpecific).toBeDefined();
      expect(result[0].userSpecific!.liked).toBe(true);
      expect(result[0].userSpecific!.following).toBe(true);

      // Check second item
      expect(result[1].id).toBe('content-2');
      expect(result[1].author!.id).toBe('user-2');
      expect(result[1].engagement!.likeCount).toBe(20);
      expect(result[1].userSpecific!.liked).toBe(false);
      expect(result[1].userSpecific!.following).toBe(false);
    });
  });

  describe('caching functionality', () => {
    it('should use cached data when available', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        // Don't mock other commands to verify they're not called
        return Promise.reject(new Error('Should not be called'));
      });

      // Mock cache hits for all data
      jest.spyOn(cacheService, 'get').mockImplementation((cacheKey: string) => {
        if (cacheKey.startsWith('feed:author:user-1')) {
          return Promise.resolve(mockUsers[0]);
        }
        if (cacheKey.startsWith('feed:author:user-2')) {
          return Promise.resolve(mockUsers[1]);
        }
        if (cacheKey.startsWith('feed:engagement:content-1')) {
          return Promise.resolve(mockEngagementMetrics[0]);
        }
        if (cacheKey.startsWith('feed:engagement:content-2')) {
          return Promise.resolve(mockEngagementMetrics[1]);
        }
        if (cacheKey.startsWith('feed:like:current-user:content-1')) {
          return Promise.resolve(mockLikeStatus[0]);
        }
        if (cacheKey.startsWith('feed:like:current-user:content-2')) {
          return Promise.resolve(mockLikeStatus[1]);
        }
        if (cacheKey.startsWith('feed:follow:current-user:user-1')) {
          return Promise.resolve(mockFollowStatus[0]);
        }
        if (cacheKey.startsWith('feed:follow:current-user:user-2')) {
          return Promise.resolve(mockFollowStatus[1]);
        }
        return Promise.resolve(null);
      });

      // Test
      const result = await service.enrichFeedItems(
        ['content-1', 'content-2'],
        'current-user',
      );

      // Verify
      expect(result).toHaveLength(2);

      // Only GetContentsCommand should be executed
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(GetContentsCommand),
      );

      // Verify all data is there despite not calling the other commands
      expect(result[0].author).toBeDefined();
      expect(result[0].engagement).toBeDefined();
      expect(result[0].userSpecific).toBeDefined();
    });

    it('should handle partial cache hits', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          // Only one user needs to be fetched
          const { userIds } = command;
          expect(userIds).toEqual(['user-2']);
          return Promise.resolve([mockUsers[1]]);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          // Only one content metrics needs to be fetched
          const { contentIds } = command;
          expect(contentIds).toEqual(['content-2']);
          return Promise.resolve([mockEngagementMetrics[1]]);
        }
        return Promise.resolve([]); // Other commands not needed for this test
      });

      // Mock partial cache hits
      jest.spyOn(cacheService, 'get').mockImplementation((cacheKey: string) => {
        // Only cache hits for user-1 and content-1
        if (cacheKey.startsWith('feed:author:user-1')) {
          return Promise.resolve(mockUsers[0]);
        }
        if (cacheKey.startsWith('feed:engagement:content-1')) {
          return Promise.resolve(mockEngagementMetrics[0]);
        }
        return Promise.resolve(null);
      });

      // Test
      const result = await service.enrichFeedItems(['content-1', 'content-2']);

      // Verify
      expect(result).toHaveLength(2);

      // Verify only missing data is fetched
      expect(commandBus.execute).toHaveBeenCalledTimes(3); // Contents + missing user + missing metrics

      // Verify all data is present in the result
      expect(result[0].author!.id).toBe('user-1');
      expect(result[1].author!.id).toBe('user-2');
      expect(result[0].engagement!.likeCount).toBe(10);
      expect(result[1].engagement!.likeCount).toBe(20);
    });
  });

  describe('error handling', () => {
    it('should handle errors when fetching content and throw FeedEnrichmentError', async () => {
      // Setup mock to fail on GetContentsCommand
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.reject(new Error('Content fetch failed'));
        }
        return Promise.resolve([]);
      });

      // Test and expect error
      await expect(
        service.enrichFeedItems(['content-1', 'content-2']),
      ).rejects.toBeDefined();

      // Verify error is logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get contents',
        expect.any(Object),
      );
    });

    it('should gracefully handle errors when fetching author information', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.reject(new Error('Author fetch failed'));
        }
        return Promise.resolve([]);
      });

      // Test
      const result = await service.enrichFeedItems(['content-1', 'content-2']);

      // Verify service continues despite author fetch failure
      expect(result).toHaveLength(2);
      expect(result[0].author).toBeUndefined();
      expect(result[1].author).toBeUndefined();

      // Verify error is logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get author information',
        expect.any(Object),
      );
    });

    it('should gracefully handle errors when fetching engagement metrics', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.resolve(mockUsers);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          return Promise.reject(new Error('Metrics fetch failed'));
        }
        return Promise.resolve([]);
      });

      // Create a new mock setup specifically for this test case
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        // Return null for all cache keys to force command execution
        return Promise.resolve(null);
      });

      // Test
      const result = await service.enrichFeedItems(['content-1', 'content-2']);

      // Verify service continues despite metrics fetch failure
      expect(result).toHaveLength(2);
      expect(result[0].author).toBeDefined(); // Author data should exist
      expect(result[0].engagement).toBeUndefined(); // Engagement data should be missing

      // Verify error is logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get engagement metrics',
        expect.any(Object),
      );
    });

    it('should gracefully handle errors when fetching like status', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.resolve(mockUsers);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          return Promise.resolve(mockEngagementMetrics);
        }
        if (command instanceof GetUserLikesStatusCommand) {
          return Promise.reject(new Error('Like status fetch failed'));
        }
        if (command instanceof GetUserFollowStatusCommand) {
          return Promise.resolve(mockFollowStatus);
        }
        return Promise.reject(new Error('Unknown command'));
      });

      // Create a new mock setup specifically for this test case
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        // Return null for all cache keys to force command execution
        return Promise.resolve(null);
      });

      // Test
      const result = await service.enrichFeedItems(
        ['content-1', 'content-2'],
        'current-user',
      );

      // Verify service continues despite like status fetch failure
      expect(result).toHaveLength(2);
      expect(result[0].author).toBeDefined();
      expect(result[0].engagement).toBeDefined();
      expect(result[0].userSpecific).toBeDefined();
      expect(result[0].userSpecific!.liked).toBe(false); // Default false when like status fetch fails
      expect(result[0].userSpecific!.following).toBe(true); // Follow status should still work

      // Verify error is logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get like status',
        expect.any(Object),
      );
    });

    it('should gracefully handle errors when fetching follow status', async () => {
      // Setup mocks
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.resolve(mockUsers);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          return Promise.resolve(mockEngagementMetrics);
        }
        if (command instanceof GetUserLikesStatusCommand) {
          return Promise.resolve(mockLikeStatus);
        }
        if (command instanceof GetUserFollowStatusCommand) {
          return Promise.reject(new Error('Follow status fetch failed'));
        }
        return Promise.reject(new Error('Unknown command'));
      });

      // Create a new mock setup specifically for this test case
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        // Return null for all cache keys to force command execution
        return Promise.resolve(null);
      });

      // Test
      const result = await service.enrichFeedItems(
        ['content-1', 'content-2'],
        'current-user',
      );

      // Verify service continues despite follow status fetch failure
      expect(result).toHaveLength(2);
      expect(result[0].author).toBeDefined();
      expect(result[0].engagement).toBeDefined();
      expect(result[0].userSpecific).toBeDefined();
      expect(result[0].userSpecific!.liked).toBe(true); // Like status should still work
      expect(result[0].userSpecific!.following).toBe(false); // Default false when follow status fetch fails

      // Verify error is logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get follow status',
        expect.any(Object),
      );
    });
  });

  describe('performance considerations', () => {
    // Setup test for measuring execution time
    it('should complete enrichment within acceptable time limits', async () => {
      // Setup mocks for the happy path
      jest.spyOn(commandBus, 'execute').mockImplementation((command) => {
        if (command instanceof GetContentsCommand) {
          return Promise.resolve(mockContents);
        }
        if (command instanceof GetUsersCommand) {
          return Promise.resolve(mockUsers);
        }
        if (command instanceof GetEngagementMetricsCommand) {
          return Promise.resolve(mockEngagementMetrics);
        }
        if (command instanceof GetUserLikesStatusCommand) {
          return Promise.resolve(mockLikeStatus);
        }
        if (command instanceof GetUserFollowStatusCommand) {
          return Promise.resolve(mockFollowStatus);
        }
        return Promise.reject(new Error('Unknown command'));
      });

      // Mock cache miss for performance testing
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      // Measure execution time
      const startTime = Date.now();
      await service.enrichFeedItems(['content-1', 'content-2'], 'current-user');
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // This is a very simple performance test. In a real environment, we'd have more sophisticated tests
      // with larger datasets, multiple iterations, and precise benchmarking.
      // Here we're just asserting that it completes in a reasonable time
      expect(executionTime).toBeLessThan(300); // 300ms max (this is arbitrary for unit tests)
    });
  });
});

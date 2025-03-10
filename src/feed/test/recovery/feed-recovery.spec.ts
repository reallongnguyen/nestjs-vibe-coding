import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { AppError, PageOptionsDto } from 'src/common';
import { FeedService } from '../../services/feed.service';
import { FeedCacheManagerService } from '../../services/feed-cache-manager.service';
import { FeedFallbackService } from '../../services/feed-fallback.service';
import { FeedItem } from '../../entities/feed.entity';
import { FeedType } from '../../entities/feed.types';

describe('Feed System Recovery', () => {
  let service: FeedService;
  let mockRedis: any;
  let mockCommandBus: any;
  let mockEventBus: any;
  let mockCacheManager: any;
  let mockFallbackService: any;
  let mockFeedCache: any;
  let mockFeedEnrichment: any;

  const mockFeedItems: FeedItem[] = [
    {
      id: '1',
      type: 'post',
      score: 0.9,
      content: {
        id: 'content1',
        type: 'post',
        content: 'Test Content 1',
        authorId: 'author1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      type: 'post',
      score: 0.8,
      content: {
        id: 'content2',
        type: 'post',
        content: 'Test Content 2',
        authorId: 'author2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
      hgetall: jest.fn(),
      multi: jest.fn(),
    };

    mockRedis.multi.mockReturnValue({
      hincrby: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    mockCommandBus = {
      execute: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
    };

    mockCacheManager = {
      getFeed: jest.fn(),
      cacheFeed: jest.fn(),
      invalidateUserFeed: jest.fn(),
    };

    mockFallbackService = {
      getFallbackFeed: jest.fn(),
      addToFallback: jest.fn(),
    };

    mockFeedCache = {
      getFeed: jest.fn(),
      cacheFeed: jest.fn(),
    };

    mockFeedEnrichment = {
      enrichFeedItems: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: RedisService,
          useValue: {
            getOrThrow: () => mockRedis,
          },
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
            verbose: jest.fn(),
            fatal: jest.fn(),
            trace: jest.fn(),
            logger: {
              debug: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
              log: jest.fn(),
              verbose: jest.fn(),
              fatal: jest.fn(),
              trace: jest.fn(),
            },
          },
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: FeedCacheManagerService,
          useValue: mockCacheManager,
        },
        {
          provide: FeedFallbackService,
          useValue: mockFallbackService,
        },
        {
          provide: 'IFeedCacheService',
          useValue: mockFeedCache,
        },
        {
          provide: 'IFeedEnrichmentService',
          useValue: mockFeedEnrichment,
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  describe('Redis Failure Recovery', () => {
    it('should switch to fallback when Redis is down', async () => {
      // Simulate Redis failure
      mockCacheManager.getFeed.mockRejectedValue(
        new AppError('feed.cache.failed'),
      );
      mockCommandBus.execute.mockResolvedValue(['1', '2']);
      mockFeedEnrichment.enrichFeedItems.mockResolvedValue(mockFeedItems);
      mockFallbackService.getFallbackFeed.mockResolvedValue(mockFeedItems);

      const result = await service.getFeed(
        'user1',
        new PageOptionsDto(0, 10),
        FeedType.TRENDING,
      );

      expect(result.data).toHaveLength(2);
      expect(mockFallbackService.getFallbackFeed).toHaveBeenCalled();
    });

    it('should recover cache after Redis is back', async () => {
      // Simulate Redis failure then recovery
      mockCacheManager.getFeed
        .mockRejectedValueOnce(new AppError('feed.cache.failed'))
        .mockResolvedValueOnce(mockFeedItems);
      mockCommandBus.execute.mockResolvedValue(['1', '2']);
      mockFeedEnrichment.enrichFeedItems.mockResolvedValue(mockFeedItems);
      mockFallbackService.getFallbackFeed.mockResolvedValue(mockFeedItems);

      // First call - should use fallback
      const result1 = await service.getFeed(
        'user1',
        new PageOptionsDto(0, 10),
        FeedType.TRENDING,
      );
      expect(result1.data).toHaveLength(2);
      expect(mockFallbackService.getFallbackFeed).toHaveBeenCalled();

      // Second call - should use cache
      const result2 = await service.getFeed(
        'user1',
        new PageOptionsDto(0, 10),
        FeedType.TRENDING,
      );
      expect(result2.data).toHaveLength(2);
      expect(mockCacheManager.getFeed).toHaveBeenCalledTimes(2);
    });

    it('should maintain data consistency during recovery', async () => {
      // Simulate partial Redis failure
      mockCacheManager.getFeed.mockResolvedValue(null); // Cache miss
      mockCommandBus.execute.mockResolvedValue(['1']); // Gorse returns content IDs
      mockFeedEnrichment.enrichFeedItems.mockResolvedValue(mockFeedItems);
      mockFallbackService.getFallbackFeed.mockResolvedValue(mockFeedItems);

      const result = await service.getFeed(
        'user1',
        new PageOptionsDto(0, 10),
        FeedType.TRENDING,
      );

      expect(result.data).toHaveLength(2);
      expect(mockCacheManager.cacheFeed).toHaveBeenCalled();
      expect(mockFeedEnrichment.enrichFeedItems).toHaveBeenCalled();
    });

    it('should handle partial Redis failures gracefully', async () => {
      // Simulate Redis working for read but failing for write
      mockCacheManager.getFeed.mockResolvedValue(null);
      mockCacheManager.cacheFeed.mockRejectedValue(
        new AppError('feed.cache.failed'),
      );
      mockCommandBus.execute.mockResolvedValue(['1']);
      mockFeedEnrichment.enrichFeedItems.mockResolvedValue(mockFeedItems);
      mockFallbackService.getFallbackFeed.mockResolvedValue(mockFeedItems);

      const result = await service.getFeed(
        'user1',
        new PageOptionsDto(0, 10),
        FeedType.TRENDING,
      );

      expect(result.data).toHaveLength(2);
      expect(mockFallbackService.getFallbackFeed).toHaveBeenCalled();
    });
  });
});

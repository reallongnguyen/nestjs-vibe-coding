import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { performance } from 'perf_hooks';
import { FeedCacheManagerService } from '../../services/feed-cache-manager.service';
import { FeedItem } from '../../entities/feed.entity';
import { FeedType } from '../../entities/feed.types';

describe('FeedCacheManagerService Performance', () => {
  let service: FeedCacheManagerService;
  let mockRedis: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedCacheManagerService,
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
      ],
    }).compile();

    service = module.get<FeedCacheManagerService>(FeedCacheManagerService);
  });

  describe('Performance Requirements', () => {
    it('should get feed from cache within 5ms', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockFeedItems));

      const start = performance.now();
      await service.getFeed(
        'user1',
        { offset: 0, limit: 10 },
        FeedType.TRENDING,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(5);
    });

    it('should cache feed within 5ms', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const start = performance.now();
      await service.cacheFeed(
        'user1',
        { offset: 0, limit: 10 },
        FeedType.TRENDING,
        mockFeedItems,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(5);
    });

    it('should handle high volume of concurrent requests', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockFeedItems));

      const concurrentRequests = 100;
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          service.getFeed('user1', { offset: 0, limit: 10 }, FeedType.TRENDING),
        );

      const start = performance.now();
      await Promise.all(requests);
      const end = performance.now();

      const averageTime = (end - start) / concurrentRequests;
      expect(averageTime).toBeLessThan(1); // Average time per request should be less than 1ms
    });

    it('should maintain performance with large feed items', async () => {
      const largeMockFeedItems: FeedItem[] = Array(100)
        .fill(null)
        .map((_, index) => ({
          id: index.toString(),
          type: 'post',
          score: Math.random(),
          content: {
            id: `content${index}`,
            type: 'post',
            content: `Test Content ${index}`,
            authorId: `author${index}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      mockRedis.get.mockResolvedValue(JSON.stringify(largeMockFeedItems));

      const start = performance.now();
      await service.getFeed(
        'user1',
        { offset: 0, limit: 100 },
        FeedType.TRENDING,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // Should handle large feed items within 10ms
    });
  });
});

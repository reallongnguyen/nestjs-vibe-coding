import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';
import { PageOptionsDto } from 'src/common';
import { FeedCacheManagerService } from '../../services/feed-cache-manager.service';
import { FeedItem } from '../../entities/feed.entity';
import { FeedType } from '../../entities/feed.types';

describe('FeedCacheManagerService Performance', () => {
  let service: FeedCacheManagerService;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;
  let redis: jest.Mocked<Redis>;

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
    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
      hgetall: jest.fn(),
      multi: jest.fn().mockReturnValue({
        hincrby: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    } as any;

    redisService = {
      getOrThrow: jest.fn().mockReturnValue(redis),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'feed.cache.disabled') return false;
        if (key === 'feed.cache.ttl') return 300;
        return undefined;
      }),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedCacheManagerService,
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<FeedCacheManagerService>(FeedCacheManagerService);
  });

  describe('Performance Requirements', () => {
    it('should get feed from cache within 5ms', async () => {
      redis.get.mockResolvedValue(JSON.stringify(mockFeedItems));

      const start = performance.now();
      await service.getFeed(
        'user1',
        new PageOptionsDto(),
        FeedType.PERSONALIZED,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(5);
      expect(redis.get).toHaveBeenCalled();
    });

    it('should cache feed within 5ms', async () => {
      redis.setex.mockResolvedValue('OK');

      const start = performance.now();
      await service.cacheFeed(
        'user1',
        new PageOptionsDto(),
        FeedType.PERSONALIZED,
        mockFeedItems,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(5);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should handle high volume of concurrent requests', async () => {
      redis.get.mockResolvedValue(JSON.stringify(mockFeedItems));

      const concurrentRequests = 100;
      const requests = Array.from({ length: concurrentRequests }, () =>
        service.getFeed('user1', new PageOptionsDto(), FeedType.PERSONALIZED),
      );

      const start = performance.now();
      await Promise.all(requests);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Less than 1ms per request
      expect(redis.get).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should handle large feed items efficiently', async () => {
      const largeMockFeedItems = Array.from({ length: 1000 }, (_, i) => ({
        ...mockFeedItems[0],
        id: `item-${i}`,
        content: {
          ...mockFeedItems[0].content,
          id: `content-${i}`,
          content: `Test Content ${i}`,
        },
      }));

      redis.get.mockResolvedValue(JSON.stringify(largeMockFeedItems));

      const start = performance.now();
      await service.getFeed(
        'user1',
        new PageOptionsDto(),
        FeedType.PERSONALIZED,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // Should handle large feed items within 10ms
      expect(redis.get).toHaveBeenCalled();
    });

    it('should invalidate user feed efficiently', async () => {
      redis.keys.mockResolvedValue(['feed:cache:user1:personalized:1:20']);
      redis.del.mockResolvedValue(1);

      const start = performance.now();
      await service.invalidateUserFeed('user1', FeedType.PERSONALIZED);
      const end = performance.now();

      expect(end - start).toBeLessThan(5); // Should invalidate within 5ms
      expect(redis.keys).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should get cache stats efficiently', async () => {
      redis.hgetall.mockResolvedValue({
        hits: '100',
        misses: '20',
        writes: '50',
        invalidations: '10',
      });

      const start = performance.now();
      const stats = await service.getCacheStats('user1', FeedType.PERSONALIZED);
      const end = performance.now();

      expect(end - start).toBeLessThan(5); // Should get stats within 5ms
      expect(stats).toEqual({
        hits: 100,
        misses: 20,
        writes: 50,
        invalidations: 10,
      });
      expect(redis.hgetall).toHaveBeenCalled();
    });
  });
});

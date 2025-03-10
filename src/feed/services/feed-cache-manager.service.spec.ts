import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { Redis } from 'ioredis';
import { AppError, PageOptionsDto } from 'src/common';
import { FeedCacheManagerService } from './feed-cache-manager.service';
import { FeedType } from '../entities/feed.types';

describe('FeedCacheManagerService', () => {
  let service: FeedCacheManagerService;
  let redis: Redis;
  let logger: Logger;

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    hgetall: jest.fn(),
    multi: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedCacheManagerService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FeedCacheManagerService>(FeedCacheManagerService);
    redis = module.get(RedisService).getOrThrow();
    logger = module.get(Logger);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockRedis.multi.mockReturnValue({
      hincrby: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
  });

  describe('getFeed', () => {
    const userId = 'user123';
    const pageOptions = new PageOptionsDto(0, 10);
    const feedType = FeedType.PERSONALIZED;
    const mockFeedItems = [
      {
        id: '1',
        type: 'post',
        score: 1,
        content: {
          id: '1',
          type: 'post',
          content: 'Test content',
          authorId: 'author1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return cached feed items when cache hit', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockFeedItems));

      const result = await service.getFeed(userId, pageOptions, feedType);

      expect(result).toEqual(mockFeedItems);
      expect(redis.get).toHaveBeenCalledWith(
        expect.stringContaining(`feed:cache:${userId}:${feedType}`),
      );
    });

    it('should return null when cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getFeed(userId, pageOptions, feedType);

      expect(result).toBeNull();
    });

    it('should throw AppError on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.getFeed(userId, pageOptions, feedType),
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('cacheFeed', () => {
    const userId = 'user123';
    const pageOptions = new PageOptionsDto(0, 10);
    const feedType = FeedType.PERSONALIZED;
    const mockFeedItems = [
      {
        id: '1',
        type: 'post',
        score: 1,
        content: {
          id: '1',
          type: 'post',
          content: 'Test content',
          authorId: 'author1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should cache feed items with TTL', async () => {
      await service.cacheFeed(userId, pageOptions, feedType, mockFeedItems);

      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining(`feed:cache:${userId}:${feedType}`),
        300,
        JSON.stringify(mockFeedItems),
      );
    });

    it('should throw AppError on Redis error', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.cacheFeed(userId, pageOptions, feedType, mockFeedItems),
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('invalidateUserFeed', () => {
    const userId = 'user123';
    const feedType = FeedType.PERSONALIZED;

    it('should invalidate all feed cache entries for user and type', async () => {
      const mockKeys = ['key1', 'key2'];
      mockRedis.keys.mockResolvedValue(mockKeys);

      await service.invalidateUserFeed(userId, feedType);

      expect(redis.keys).toHaveBeenCalledWith(
        expect.stringContaining(`feed:cache:${userId}:${feedType}`),
      );
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should not call del if no keys found', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await service.invalidateUserFeed(userId, feedType);

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should throw AppError on Redis error', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.invalidateUserFeed(userId, feedType),
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    const userId = 'user123';
    const feedType = FeedType.PERSONALIZED;

    it('should return cache statistics', async () => {
      const mockStats = {
        hits: '10',
        misses: '5',
        writes: '15',
        invalidations: '2',
      };
      mockRedis.hgetall.mockResolvedValue(mockStats);

      const result = await service.getCacheStats(userId, feedType);

      expect(result).toEqual({
        hits: 10,
        misses: 5,
        writes: 15,
        invalidations: 2,
      });
    });

    it('should return zero values for missing stats', async () => {
      mockRedis.hgetall.mockResolvedValue({});

      const result = await service.getCacheStats(userId, feedType);

      expect(result).toEqual({
        hits: 0,
        misses: 0,
        writes: 0,
        invalidations: 0,
      });
    });
  });
});

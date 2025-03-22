import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { Redis } from 'ioredis';
import { PageOptionsDto } from 'src/common';
import { FeedFallbackService } from './feed-fallback.service';
import { FeedType } from '../entities/feed.types';
import { FeedGenerationError } from '../errors';

describe('FeedFallbackService', () => {
  let service: FeedFallbackService;
  let redis: Redis;
  let logger: Logger;

  const mockRedis = {
    multi: jest.fn(),
    zrevrange: jest.fn(),
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
        FeedFallbackService,
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

    service = module.get<FeedFallbackService>(FeedFallbackService);
    redis = module.get(RedisService).getOrThrow();
    logger = module.get(Logger);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockRedis.multi.mockReturnValue({
      zadd: jest.fn().mockReturnThis(),
      zremrangebyrank: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
  });

  describe('getFallbackFeed', () => {
    const userId = 'user123';
    const pagination = new PageOptionsDto(0, 10);
    const mockItem = {
      id: '1',
      type: 'post',
      content: {
        id: '1',
        type: 'post',
        content: 'Test content',
        authorId: 'author1',
        createdAt: '2024-04-15T10:00:00Z',
        updatedAt: '2024-04-15T10:00:00Z',
      },
      createdAt: '2024-04-15T10:00:00Z',
      updatedAt: '2024-04-15T10:00:00Z',
    };

    it('should return trending feed items', async () => {
      mockRedis.zrevrange.mockResolvedValue([
        JSON.stringify(mockItem),
        '1.5', // score
      ]);

      const result = await service.getFallbackFeed(
        userId,
        pagination,
        FeedType.TRENDING,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockItem.id);
      expect(result[0].score).toBe(1.5);
      expect(redis.zrevrange).toHaveBeenCalledWith(
        'feed:trending',
        0,
        9,
        'WITHSCORES',
      );
    });

    it('should return latest feed items', async () => {
      mockRedis.zrevrange.mockResolvedValue([
        JSON.stringify(mockItem),
        '1681556400000', // timestamp
      ]);

      const result = await service.getFallbackFeed(
        userId,
        pagination,
        FeedType.LATEST,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockItem.id);
      expect(redis.zrevrange).toHaveBeenCalledWith(
        'feed:latest',
        0,
        9,
        'WITHSCORES',
      );
    });

    it('should return personalized feed items', async () => {
      mockRedis.zrevrange
        .mockResolvedValueOnce([JSON.stringify(mockItem), '1.5']) // trending
        .mockResolvedValueOnce([JSON.stringify(mockItem), '1681556400000']); // latest

      const result = await service.getFallbackFeed(
        userId,
        pagination,
        FeedType.PERSONALIZED,
      );

      expect(result).toHaveLength(2);
      expect(redis.zrevrange).toHaveBeenCalledTimes(2);
    });

    it('should throw FeedGenerationError on Redis error', async () => {
      mockRedis.zrevrange.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.getFallbackFeed(userId, pagination, FeedType.TRENDING),
      ).rejects.toThrow(FeedGenerationError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('addToFallback', () => {
    const contentId = 'content123';
    const score = 1.5;
    const timestamp = new Date('2024-04-15T10:00:00Z');
    const metadata = {
      type: 'post',
      content: {
        id: contentId,
        type: 'post',
        content: 'Test content',
        authorId: 'author1',
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
      },
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };

    it('should add content to both trending and latest sets', async () => {
      await service.addToFallback(contentId, score, timestamp, metadata);

      expect(redis.multi).toHaveBeenCalledTimes(2);
      const multiChain = mockRedis.multi();
      expect(multiChain.zadd).toHaveBeenCalledWith(
        'feed:trending',
        score,
        expect.any(String),
      );
      expect(multiChain.zadd).toHaveBeenCalledWith(
        'feed:latest',
        timestamp.getTime(),
        expect.any(String),
      );
    });

    it('should throw FeedGenerationError on Redis error', async () => {
      const multiChain = mockRedis.multi();
      multiChain.exec.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.addToFallback(contentId, score, timestamp, metadata),
      ).rejects.toThrow(FeedGenerationError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { performance } from 'perf_hooks';
import { PageOptionsDto } from 'src/common';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { FeedFallbackService } from '../../services/feed-fallback.service';
import { FeedType } from '../../entities/feed.types';

describe('FeedFallbackService Performance', () => {
  let service: FeedFallbackService;

  const mockRedis = {
    multi: jest.fn(),
    zrevrange: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
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
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FeedFallbackService>(FeedFallbackService);

    // Setup default mock implementations
    mockRedis.multi.mockReturnValue({
      zadd: jest.fn().mockReturnThis(),
      zremrangebyrank: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
  });

  describe('Performance Requirements', () => {
    const userId = 'testUser';
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

    it('should get fallback feed within 100ms', async () => {
      mockRedis.zrevrange.mockResolvedValue([JSON.stringify(mockItem), '1.5']);

      const start = performance.now();
      await service.getFallbackFeed(userId, pagination, FeedType.TRENDING);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should add to fallback within 100ms', async () => {
      const start = performance.now();
      await service.addToFallback(
        mockItem.id,
        1.5,
        new Date(mockItem.createdAt),
        mockItem,
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle high volume of concurrent requests', async () => {
      mockRedis.zrevrange.mockResolvedValue([JSON.stringify(mockItem), '1.5']);

      const concurrentRequests = 100;
      const start = performance.now();

      await Promise.all(
        Array(concurrentRequests)
          .fill(null)
          .map(() =>
            service.getFallbackFeed(userId, pagination, FeedType.TRENDING),
          ),
      );

      const duration = performance.now() - start;
      const averageRequestTime = duration / concurrentRequests;

      expect(averageRequestTime).toBeLessThan(100);
    });

    it('should maintain performance with large result sets', async () => {
      // Create a large result set (100 items)
      const largeResultSet = Array(100)
        .fill(null)
        .flatMap((_, index) => [
          JSON.stringify({
            ...mockItem,
            id: `item${index}`,
            content: {
              ...mockItem.content,
              id: `content${index}`,
              content: `Test content ${index}`.repeat(100), // Large content
            },
          }),
          (1.5 + index / 100).toString(),
        ]);

      mockRedis.zrevrange.mockResolvedValue(largeResultSet);

      const start = performance.now();
      await service.getFallbackFeed(userId, pagination, FeedType.TRENDING);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // Allow more time for large data
    });

    it('should handle multiple feed types efficiently', async () => {
      mockRedis.zrevrange.mockResolvedValue([JSON.stringify(mockItem), '1.5']);

      const start = performance.now();
      await Promise.all([
        service.getFallbackFeed(userId, pagination, FeedType.TRENDING),
        service.getFallbackFeed(userId, pagination, FeedType.LATEST),
        service.getFallbackFeed(userId, pagination, FeedType.PERSONALIZED),
      ]);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(300); // Allow time for parallel requests
    });
  });
});

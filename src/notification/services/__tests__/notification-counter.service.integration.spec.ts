import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { Redis } from 'ioredis';
import { NotificationCounterService } from '../notification-counter.service';

describe('NotificationCounterService Integration', () => {
  let service: NotificationCounterService;
  let redis: Redis;

  const TEST_KEY = 'test:counter';
  const FULL_TEST_KEY = `notification:counter:${TEST_KEY}`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          config: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            db: 1, // Use a separate database for testing
          },
        }),
      ],
      providers: [
        NotificationCounterService,
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationCounterService>(
      NotificationCounterService,
    );
    redis = module.get<RedisService>(RedisService).getOrThrow();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.del(FULL_TEST_KEY);
  });

  describe('Basic Operations', () => {
    it('should handle increment operations with TTL', async () => {
      // Increment and verify value
      const value1 = await service.increment(TEST_KEY, 300);
      expect(value1).toBe(1);

      // Verify TTL is set
      const ttl = await redis.ttl(FULL_TEST_KEY);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);

      // Increment again and verify
      const value2 = await service.increment(TEST_KEY, 300, 2);
      expect(value2).toBe(3);
    });

    it('should handle decrement operations with TTL', async () => {
      // Set initial value
      await redis.set(FULL_TEST_KEY, '5');

      // Decrement and verify
      const value1 = await service.decrement(TEST_KEY, 300);
      expect(value1).toBe(4);

      // Verify TTL is set
      const ttl = await redis.ttl(FULL_TEST_KEY);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);

      // Decrement by specific value
      const value2 = await service.decrement(TEST_KEY, 300, 2);
      expect(value2).toBe(2);
    });

    it('should handle get operations', async () => {
      // Test non-existent key
      const value1 = await service.get(TEST_KEY);
      expect(value1).toBe(0);

      // Set value and test
      await redis.set(FULL_TEST_KEY, '42');
      const value2 = await service.get(TEST_KEY);
      expect(value2).toBe(42);
    });

    it('should handle reset operations', async () => {
      // Set value
      await redis.set(FULL_TEST_KEY, '42');

      // Reset and verify
      await service.reset(TEST_KEY);
      const exists = await redis.exists(FULL_TEST_KEY);
      expect(exists).toBe(0);
    });
  });

  describe('TTL Operations', () => {
    it('should handle exists check', async () => {
      // Test non-existent key
      const exists1 = await service.exists(TEST_KEY);
      expect(exists1).toBe(false);

      // Set value and test
      await redis.set(FULL_TEST_KEY, '42');
      const exists2 = await service.exists(TEST_KEY);
      expect(exists2).toBe(true);
    });

    it('should handle TTL operations', async () => {
      // Set value with TTL
      await redis.set(FULL_TEST_KEY, '42');
      await redis.expire(FULL_TEST_KEY, 300);

      // Get TTL and verify
      const ttl1 = await service.getTTL(TEST_KEY);
      expect(ttl1).toBeGreaterThan(0);
      expect(ttl1).toBeLessThanOrEqual(300);

      // Update TTL and verify
      await service.setTTL(TEST_KEY, 600);
      const ttl2 = await service.getTTL(TEST_KEY);
      expect(ttl2).toBeGreaterThan(300);
      expect(ttl2).toBeLessThanOrEqual(600);
    });

    it('should handle TTL expiration', async () => {
      // Set value with short TTL
      await service.increment(TEST_KEY, 1);

      // Wait for expiration
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          clearTimeout(timer);
          resolve();
        }, 1100);
      });

      // Verify key is expired
      const exists = await service.exists(TEST_KEY);
      expect(exists).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent increments', async () => {
      const operations = Array(10)
        .fill(0)
        .map(() => service.increment(TEST_KEY, 300));

      await Promise.all(operations);

      const value = await service.get(TEST_KEY);
      expect(value).toBe(10);
    });

    it('should handle mixed concurrent operations', async () => {
      // Initial value
      await service.increment(TEST_KEY, 300, 10);

      const operations = [
        service.increment(TEST_KEY, 300, 2),
        service.decrement(TEST_KEY, 300),
        service.increment(TEST_KEY, 300, 3),
        service.decrement(TEST_KEY, 300, 2),
      ];

      await Promise.all(operations);

      const value = await service.get(TEST_KEY);
      expect(value).toBe(12); // 10 + 2 - 1 + 3 - 2
    });
  });

  describe('Error Scenarios', () => {
    it('should handle negative values correctly', async () => {
      await service.increment(TEST_KEY, 300, 5);
      await service.decrement(TEST_KEY, 300, 10);

      const value = await service.get(TEST_KEY);
      expect(value).toBe(-5);
    });

    it('should handle invalid TTL values', async () => {
      await service.increment(TEST_KEY, -1);
      const ttl = await service.getTTL(TEST_KEY);
      expect(ttl).toBe(-1); // No expiration
    });
  });
});

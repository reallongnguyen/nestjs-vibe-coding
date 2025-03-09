import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { NotificationCounterService } from '../notification-counter.service';

describe('NotificationCounterService', () => {
  let service: NotificationCounterService;

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  const mockRedis = {
    incrby: jest.fn(),
    decrby: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCounterService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<NotificationCounterService>(
      NotificationCounterService,
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('increment', () => {
    it('should increment counter and set TTL', async () => {
      mockRedis.incrby.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(-1);
      mockRedis.expire.mockResolvedValue(1);

      const result = await service.increment('test-counter', 300);

      expect(result).toBe(1);
      expect(mockRedis.incrby).toHaveBeenCalledWith(
        'notification:counter:test-counter',
        1,
      );
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error');
      mockRedis.incrby.mockRejectedValue(error);

      await expect(service.increment('test-counter')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('decrement', () => {
    it('should decrement counter and set TTL', async () => {
      mockRedis.decrby.mockResolvedValue(0);
      mockRedis.ttl.mockResolvedValue(-1);
      mockRedis.expire.mockResolvedValue(1);

      const result = await service.decrement('test-counter', 300);

      expect(result).toBe(0);
      expect(mockRedis.decrby).toHaveBeenCalledWith(
        'notification:counter:test-counter',
        1,
      );
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error');
      mockRedis.decrby.mockRejectedValue(error);

      await expect(service.decrement('test-counter')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return counter value', async () => {
      mockRedis.get.mockResolvedValue('5');

      const result = await service.get('test-counter');

      expect(result).toBe(5);
      expect(mockRedis.get).toHaveBeenCalledWith(
        'notification:counter:test-counter',
      );
    });

    it('should return 0 for non-existent counter', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('test-counter');

      expect(result).toBe(0);
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error');
      mockRedis.get.mockRejectedValue(error);

      await expect(service.get('test-counter')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset counter', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.reset('test-counter');

      expect(mockRedis.del).toHaveBeenCalledWith(
        'notification:counter:test-counter',
      );
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error');
      mockRedis.del.mockRejectedValue(error);

      await expect(service.reset('test-counter')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true for existing counter', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.exists('test-counter');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        'notification:counter:test-counter',
      );
    });

    it('should return false for non-existent counter', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.exists('test-counter');

      expect(result).toBe(false);
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error');
      mockRedis.exists.mockRejectedValue(error);

      await expect(service.exists('test-counter')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('TTL operations', () => {
    describe('getTTL', () => {
      it('should return TTL value', async () => {
        mockRedis.ttl.mockResolvedValue(300);

        const result = await service.getTTL('test-counter');

        expect(result).toBe(300);
        expect(mockRedis.ttl).toHaveBeenCalledWith(
          'notification:counter:test-counter',
        );
      });

      it('should handle Redis errors', async () => {
        const error = new Error('Redis error');
        mockRedis.ttl.mockRejectedValue(error);

        await expect(service.getTTL('test-counter')).rejects.toThrow(error);
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });

    describe('setTTL', () => {
      it('should set TTL value', async () => {
        mockRedis.expire.mockResolvedValue(1);

        await service.setTTL('test-counter', 300);

        expect(mockRedis.expire).toHaveBeenCalledWith(
          'notification:counter:test-counter',
          300,
        );
        expect(mockLogger.debug).toHaveBeenCalled();
      });

      it('should handle Redis errors', async () => {
        const error = new Error('Redis error');
        mockRedis.expire.mockRejectedValue(error);

        await expect(service.setTTL('test-counter', 300)).rejects.toThrow(
          error,
        );
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });
  });
});

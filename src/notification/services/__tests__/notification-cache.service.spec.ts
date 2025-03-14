import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from 'nestjs-pino';
import { NotificationCacheService } from '../notification-cache.service';
import { Notification } from '../../entities/notification.entity';

describe('NotificationCacheService', () => {
  let service: NotificationCacheService;
  let logger: Logger;
  let redisMock: any;

  beforeEach(async () => {
    // Create Redis mock
    redisMock = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
    };

    // Create RedisService mock
    const redisServiceMock = {
      getOrThrow: jest.fn().mockReturnValue(redisMock),
    };

    // Create ConfigService mock
    const configServiceMock = {
      get: jest.fn((key, defaultValue) => {
        const config = {
          'notification.cache.ttl': 60,
          'notification.cache.notificationsTtl': 300,
          'notification.cache.countsTtl': 60,
          'notification.cache.cleanupInterval': 3600,
        };
        return config[key] || defaultValue;
      }),
    };

    // Create Logger mock
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCacheService,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<NotificationCacheService>(NotificationCacheService);
    logger = module.get<Logger>(Logger);

    // Mock setInterval to prevent actual timer creation
    jest.spyOn(global, 'setInterval').mockReturnValue({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return cached notifications when available', async () => {
      // Arrange
      const key = 'user:123:unread';
      const mockDate = new Date('2025-03-14T14:46:15.532Z');
      const mockNotifications: Notification[] = [
        {
          id: '1',
          key: 'notification-key',
          type: 'like',
          userId: '123',
          subjects: [],
          subjectCount: 0,
          text: 'Test notification',
          decorators: [],
          link: '/test',
          notificationTime: mockDate,
        } as Notification,
      ];

      // When Redis returns JSON, dates are serialized as strings
      const serializedNotifications = JSON.parse(
        JSON.stringify(mockNotifications),
      );
      redisMock.get.mockResolvedValue(JSON.stringify(serializedNotifications));

      // Act
      const result = await service.getNotifications(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:user:123:unread',
      );

      // Convert dates back to Date objects for comparison
      const resultWithDateObjects = result
        ? result.map((notification) => ({
            ...notification,
            notificationTime: notification.notificationTime
              ? new Date(notification.notificationTime)
              : undefined,
          }))
        : null;

      expect(resultWithDateObjects).toEqual(mockNotifications);
    });

    it('should return null when cache is empty', async () => {
      // Arrange
      const key = 'user:123:unread';
      redisMock.get.mockResolvedValue(null);

      // Act
      const result = await service.getNotifications(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:user:123:unread',
      );
      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      // Arrange
      const key = 'user:123:unread';
      const error = new Error('Redis error');
      redisMock.get.mockRejectedValue(error);

      // Act
      const result = await service.getNotifications(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:user:123:unread',
      );
      expect(logger.error).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('setNotifications', () => {
    it('should cache notifications with default TTL', async () => {
      // Arrange
      const key = 'user:123:unread';
      const mockNotifications: Notification[] = [
        {
          id: '1',
          key: 'notification-key',
          type: 'like',
          userId: '123',
          subjects: [],
          subjectCount: 0,
          text: 'Test notification',
          decorators: [],
          link: '/test',
          notificationTime: new Date(),
        } as Notification,
      ];
      redisMock.setex.mockResolvedValue('OK');

      // Act
      await service.setNotifications(key, mockNotifications);

      // Assert
      expect(redisMock.setex).toHaveBeenCalledWith(
        'notification:cache:user:123:unread',
        300, // Default notifications TTL
        JSON.stringify(mockNotifications),
      );
    });

    it('should cache notifications with custom TTL', async () => {
      // Arrange
      const key = 'user:123:unread';
      const mockNotifications: Notification[] = [
        {
          id: '1',
          key: 'notification-key',
          type: 'like',
          userId: '123',
          subjects: [],
          subjectCount: 0,
          text: 'Test notification',
          decorators: [],
          link: '/test',
          notificationTime: new Date(),
        } as Notification,
      ];
      const customTtl = 600;
      redisMock.setex.mockResolvedValue('OK');

      // Act
      await service.setNotifications(key, mockNotifications, customTtl);

      // Assert
      expect(redisMock.setex).toHaveBeenCalledWith(
        'notification:cache:user:123:unread',
        customTtl,
        JSON.stringify(mockNotifications),
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const key = 'user:123:unread';
      const mockNotifications: Notification[] = [
        {
          id: '1',
          key: 'notification-key',
          type: 'like',
          userId: '123',
          subjects: [],
          subjectCount: 0,
          text: 'Test notification',
          decorators: [],
          link: '/test',
          notificationTime: new Date(),
        } as Notification,
      ];
      const error = new Error('Redis error');
      redisMock.setex.mockRejectedValue(error);

      // Act
      await service.setNotifications(key, mockNotifications);

      // Assert
      expect(redisMock.setex).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    it('should return cached count when available', async () => {
      // Arrange
      const key = 'unread:123';
      const mockCount = '5';
      redisMock.get.mockResolvedValue(mockCount);

      // Act
      const result = await service.getCount(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:count:unread:123',
      );
      expect(result).toBe(5);
    });

    it('should return null when cache is empty', async () => {
      // Arrange
      const key = 'unread:123';
      redisMock.get.mockResolvedValue(null);

      // Act
      const result = await service.getCount(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:count:unread:123',
      );
      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      // Arrange
      const key = 'unread:123';
      const error = new Error('Redis error');
      redisMock.get.mockRejectedValue(error);

      // Act
      const result = await service.getCount(key);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(
        'notification:cache:count:unread:123',
      );
      expect(logger.error).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('setCount', () => {
    it('should cache count with default TTL', async () => {
      // Arrange
      const key = 'unread:123';
      const count = 5;
      redisMock.setex.mockResolvedValue('OK');

      // Act
      await service.setCount(key, count);

      // Assert
      expect(redisMock.setex).toHaveBeenCalledWith(
        'notification:cache:count:unread:123',
        60, // Default counts TTL
        '5',
      );
    });

    it('should cache count with custom TTL', async () => {
      // Arrange
      const key = 'unread:123';
      const count = 5;
      const customTtl = 120;
      redisMock.setex.mockResolvedValue('OK');

      // Act
      await service.setCount(key, count, customTtl);

      // Assert
      expect(redisMock.setex).toHaveBeenCalledWith(
        'notification:cache:count:unread:123',
        customTtl,
        '5',
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const key = 'unread:123';
      const count = 5;
      const error = new Error('Redis error');
      redisMock.setex.mockRejectedValue(error);

      // Act
      await service.setCount(key, count);

      // Assert
      expect(redisMock.setex).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('invalidateUserCache', () => {
    it('should delete all cache entries for a user', async () => {
      // Arrange
      const userId = '123';
      const mockKeys = [
        'notification:cache:user:123:unread',
        'notification:cache:user:123:all',
      ];
      redisMock.keys.mockResolvedValue(mockKeys);
      redisMock.del.mockResolvedValue(2);

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      expect(redisMock.keys).toHaveBeenCalledWith(
        'notification:cache:user:123*',
      );
      expect(redisMock.del).toHaveBeenCalledWith(...mockKeys);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should not call del if no keys found', async () => {
      // Arrange
      const userId = '123';
      redisMock.keys.mockResolvedValue([]);

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      expect(redisMock.keys).toHaveBeenCalledWith(
        'notification:cache:user:123*',
      );
      expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      const userId = '123';
      const error = new Error('Redis error');
      redisMock.keys.mockRejectedValue(error);

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      expect(redisMock.keys).toHaveBeenCalledWith(
        'notification:cache:user:123*',
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should clean up expired cache entries', async () => {
      // Arrange
      const mockKeys = [
        'notification:cache:user:123:unread',
        'notification:cache:user:456:unread',
        'notification:cache:user:789:unread',
      ];
      const mockTtls = [-1, 0, 100]; // First two are expired
      redisMock.keys.mockResolvedValue(mockKeys);

      // Mock ttl results
      mockKeys.forEach((key, index) => {
        redisMock.ttl.mockResolvedValueOnce(mockTtls[index]);
      });

      redisMock.del.mockResolvedValue(2);

      // Act
      await (service as any).cleanupExpiredEntries();

      // Assert
      expect(redisMock.keys).toHaveBeenCalledWith('notification:cache:*');
      expect(logger.log).toHaveBeenCalledWith(
        'Starting cleanup of expired notification cache entries',
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Cleaned up 2 expired notification cache entries',
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Redis error');
      redisMock.keys.mockRejectedValue(error);

      // Act
      await (service as any).cleanupExpiredEntries();

      // Assert
      expect(redisMock.keys).toHaveBeenCalledWith('notification:cache:*');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

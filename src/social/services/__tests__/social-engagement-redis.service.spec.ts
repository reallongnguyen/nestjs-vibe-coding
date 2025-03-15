import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis, ChainableCommander } from 'ioredis';
import { ContentType } from 'src/common/event-manager';

import { ContentViewError } from '../../entities/errors';
import { SocialEngagementRedisService } from '../social-engagement-redis.service';

describe('SocialEngagementRedisService', () => {
  let service: SocialEngagementRedisService;
  let redis: Redis;

  beforeEach(async () => {
    const redisMock = {
      set: jest.fn(),
      del: jest.fn(),
      sismember: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      get: jest.fn(),
      setex: jest.fn(),
      multi: jest.fn(),
    };

    const redisServiceMock = {
      getOrThrow: jest.fn().mockReturnValue(redisMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEngagementRedisService,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    service = module.get<SocialEngagementRedisService>(
      SocialEngagementRedisService,
    );
    redis = module.get(RedisService).getOrThrow();
  });

  describe('acquireLikeLock', () => {
    it('should acquire lock successfully', async () => {
      jest.spyOn(redis, 'set').mockResolvedValue('OK');

      const result = await service.acquireLikeLock(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(true);
      expect(redis.set).toHaveBeenCalledWith(
        'lock:like:POST:content-1:user-1',
        '1',
        'PX',
        5000,
        'NX',
      );
    });

    it('should fail to acquire lock if already locked', async () => {
      jest.spyOn(redis, 'set').mockResolvedValue(null);

      const result = await service.acquireLikeLock(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('isContentLiked', () => {
    it('should return true if content is liked', async () => {
      jest.spyOn(redis, 'sismember').mockResolvedValue(1);

      const result = await service.isContentLiked(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(true);
      expect(redis.sismember).toHaveBeenCalledWith(
        'POST:content-1:likes:set',
        'user-1',
      );
    });

    it('should return false if content is not liked', async () => {
      jest.spyOn(redis, 'sismember').mockResolvedValue(0);

      const result = await service.isContentLiked(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('trackView', () => {
    it('should return false for recent view', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue('1');

      const result = await service.trackView(
        ContentType.POST,
        'content-1',
        'viewer-1',
      );

      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith(
        'POST:content-1:views:recent:viewer-1',
      );
    });

    it('should track new view successfully', async () => {
      const multiMock = {
        pfadd: jest.fn().mockReturnThis(),
        pfcount: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 100],
        ]),
      } as unknown as ChainableCommander;

      jest.spyOn(redis, 'get').mockResolvedValue(null);
      jest.spyOn(redis, 'setex').mockResolvedValue('OK');
      jest.spyOn(redis, 'multi').mockReturnValue(multiMock);

      const result = await service.trackView(
        ContentType.POST,
        'content-1',
        'viewer-1',
      );

      expect(result).toBe(true);
      expect(redis.get).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled();
      expect(redis.multi).toHaveBeenCalled();
      expect(multiMock.pfadd).toHaveBeenCalled();
      expect(multiMock.pfcount).toHaveBeenCalled();
      expect(multiMock.exec).toHaveBeenCalled();
    });

    it('should throw ContentViewError if multi exec fails', async () => {
      const multiMock = {
        pfadd: jest.fn().mockReturnThis(),
        pfcount: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as unknown as ChainableCommander;

      jest.spyOn(redis, 'get').mockResolvedValue(null);
      jest.spyOn(redis, 'setex').mockResolvedValue('OK');
      jest.spyOn(redis, 'multi').mockReturnValue(multiMock);

      await expect(
        service.trackView(ContentType.POST, 'content-1', 'viewer-1'),
      ).rejects.toThrow(ContentViewError);
    });

    it('should throw ContentViewError if multi exec returns error', async () => {
      const multiMock = {
        pfadd: jest.fn().mockReturnThis(),
        pfcount: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          ['error', null],
          [null, 100],
        ]),
      } as unknown as ChainableCommander;

      jest.spyOn(redis, 'get').mockResolvedValue(null);
      jest.spyOn(redis, 'setex').mockResolvedValue('OK');
      jest.spyOn(redis, 'multi').mockReturnValue(multiMock);

      await expect(
        service.trackView(ContentType.POST, 'content-1', 'viewer-1'),
      ).rejects.toThrow(ContentViewError);
    });

    it('should cleanup HLL when threshold is reached', async () => {
      const multiMock = {
        pfadd: jest.fn().mockReturnThis(),
        pfcount: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 1000001],
        ]),
      } as unknown as ChainableCommander;

      jest.spyOn(redis, 'get').mockResolvedValue(null);
      jest.spyOn(redis, 'setex').mockResolvedValue('OK');
      jest.spyOn(redis, 'multi').mockReturnValue(multiMock);
      jest.spyOn(redis, 'del').mockResolvedValue(1);

      await service.trackView(ContentType.POST, 'content-1', 'viewer-1');

      expect(redis.del).toHaveBeenCalledWith('POST:content-1:views:hll');
    });
  });
});

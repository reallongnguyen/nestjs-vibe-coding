import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ContentType } from 'src/common/event-manager';

import { SocialEngagementRedisService } from '../social-engagement-redis.service';

describe('SocialEngagementRedisService', () => {
  let service: SocialEngagementRedisService;
  let redis: jest.Mocked<any>;

  beforeEach(async () => {
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      setex: jest.fn(),
      sismember: jest.fn(),
      exists: jest.fn(),
      lrange: jest.fn(),
      llen: jest.fn(),
      rpush: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        pfadd: jest.fn().mockReturnThis(),
        pfcount: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEngagementRedisService,
        {
          provide: RedisService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(redis),
          },
        },
      ],
    }).compile();

    service = module.get<SocialEngagementRedisService>(
      SocialEngagementRedisService,
    );
  });

  describe('acquireLikeLock', () => {
    it('should acquire lock successfully', async () => {
      redis.set.mockResolvedValue('OK');

      const result = await service.acquireLikeLock(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(true);
      expect(redis.set).toHaveBeenCalledWith(
        'like_lock:POST:content-1:user-1',
        '1',
        'EX',
        30,
        'NX',
      );
    });

    it('should fail to acquire lock if already locked', async () => {
      redis.set.mockResolvedValue(null);

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
      redis.sismember.mockResolvedValue(1);

      const result = await service.isContentLiked(
        ContentType.POST,
        'content-1',
        'user-1',
      );

      expect(result).toBe(true);
      expect(redis.sismember).toHaveBeenCalledWith(
        'likes:POST:content-1',
        'user-1',
      );
    });

    it('should return false if content is not liked', async () => {
      redis.sismember.mockResolvedValue(0);

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
      redis.get.mockResolvedValue('1');

      const result = await service.trackView(
        ContentType.POST,
        'content-1',
        'viewer-1',
      );

      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith(
        'views:recent:POST:content-1:viewer-1',
      );
    });

    it('should track new view successfully', async () => {
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');
      redis.pipeline().exec.mockResolvedValue([
        [null, 1],
        [null, 100],
      ]);
      redis.llen.mockResolvedValue(50);

      const result = await service.trackView(
        ContentType.POST,
        'content-1',
        'viewer-1',
      );

      expect(result).toBe(true);
      expect(redis.setex).toHaveBeenCalled();
      expect(redis.pipeline).toHaveBeenCalled();
      expect(redis.rpush).toHaveBeenCalled();
    });

    it('should cleanup HLL when threshold is reached', async () => {
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');
      redis.pipeline().exec.mockResolvedValue([
        [null, 1],
        [null, 1000001],
      ]);
      redis.llen.mockResolvedValue(50);

      const result = await service.trackView(
        ContentType.POST,
        'content-1',
        'viewer-1',
      );

      expect(result).toBe(true);
      expect(redis.setex).toHaveBeenCalled();
      expect(redis.pipeline).toHaveBeenCalled();
      expect(redis.rpush).toHaveBeenCalled();
    });
  });
});

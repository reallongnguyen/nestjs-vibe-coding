import { TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { UpdateViewCountHandler } from '../update-view-count.handler';
import { IViewRepository } from '../../../services/interfaces/view-repository.interface';
import { createTestingModule } from '../../../../../test/jest.setup';
import {
  ContentType,
  SocialEventSchemas,
} from '../../../../common/event-manager';

describe('UpdateViewCountHandler', () => {
  let handler: UpdateViewCountHandler;
  let viewRepository: IViewRepository;

  const mockViewRepository = {
    batchInsertView: jest.fn(),
  };

  const mockRedis = {
    llen: jest.fn().mockResolvedValue(0),
    rpush: jest.fn().mockResolvedValue(1),
    lrange: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    multi: jest.fn().mockReturnValue({
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule(
      [],
      [
        {
          provide: 'IViewRepository',
          useValue: mockViewRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        UpdateViewCountHandler,
      ],
    );

    handler = module.get<UpdateViewCountHandler>(UpdateViewCountHandler);
    viewRepository = module.get<IViewRepository>('IViewRepository');

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Initialize viewProcessor
    await handler.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleContentViewed', () => {
    const timestamp = new Date();
    const mockEvent = {
      eventId: 'test-event-id',
      eventName: SocialEventSchemas.CONTENT_VIEWED.eventName,
      payload: {
        contentId: 'test-content-id',
        contentType: ContentType.POST,
        viewerHash: 'test-hash',
        viewerId: 'test-viewer-id',
        timestamp,
      },
      metadata: {
        timestamp: timestamp.getTime(),
        version: '1.0.0',
      },
    };

    it('should add view operation to batch processor', async () => {
      await handler.handleContentViewed(mockEvent);

      expect(mockRedisService.getOrThrow).toHaveBeenCalled();
      expect(mockRedis.rpush).toHaveBeenCalled();
    });

    it('should handle anonymous views', async () => {
      const anonymousEvent = {
        ...mockEvent,
        payload: {
          ...mockEvent.payload,
          viewerId: undefined,
        },
      };

      await handler.handleContentViewed(anonymousEvent);

      expect(mockRedisService.getOrThrow).toHaveBeenCalled();
      expect(mockRedis.rpush).toHaveBeenCalled();
    });

    it('should process batch when full', async () => {
      mockRedis.llen.mockResolvedValueOnce(100);
      mockRedis.lrange.mockResolvedValueOnce([
        JSON.stringify({
          contentId: 'test-content-id',
          contentType: ContentType.POST,
          viewerHash: 'test-hash',
          viewerId: 'test-viewer-id',
        }),
      ]);

      await handler.handleContentViewed(mockEvent);

      expect(mockRedisService.getOrThrow).toHaveBeenCalled();
      expect(mockRedis.rpush).toHaveBeenCalled();
      expect(mockRedis.lrange).toHaveBeenCalled();
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(viewRepository.batchInsertView).toHaveBeenCalled();
    });
  });
});

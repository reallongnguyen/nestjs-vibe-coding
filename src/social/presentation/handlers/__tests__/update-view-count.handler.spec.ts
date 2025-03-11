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

  const mockRedisService = {
    getOrThrow: jest.fn(),
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

    // Setup Redis mock
    mockRedisService.getOrThrow.mockReturnValue({
      llen: jest.fn().mockResolvedValue(0),
      rpush: jest.fn().mockResolvedValue(1),
      multi: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

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
      expect(mockRedisService.getOrThrow().rpush).toHaveBeenCalled();
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
      expect(mockRedisService.getOrThrow().rpush).toHaveBeenCalled();
    });

    it('should process batch when full', async () => {
      mockRedisService.getOrThrow().llen.mockResolvedValueOnce(100);

      await handler.handleContentViewed(mockEvent);

      expect(mockRedisService.getOrThrow).toHaveBeenCalled();
      expect(mockRedisService.getOrThrow().rpush).toHaveBeenCalled();
      expect(viewRepository.batchInsertView).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { UpdateViewCountHandler } from '../update-view-count.handler';
import { IViewRepository } from '../../../services/interfaces/view-repository.interface';
import { ContentViewedEvent } from '../../../entities/events/content-viewed.event';
import { ContentType } from '../../../../common/event-manager/entities/events/schemas/social.events';

describe('UpdateViewCountHandler', () => {
  let handler: UpdateViewCountHandler;
  let viewRepository: IViewRepository;

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue({
      multi: jest.fn().mockReturnThis(),
      rpush: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
  };

  const mockViewRepository = {
    batchInsertView: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateViewCountHandler,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: 'IViewRepository',
          useValue: mockViewRepository,
        },
      ],
    }).compile();

    handler = module.get<UpdateViewCountHandler>(UpdateViewCountHandler);
    viewRepository = module.get<IViewRepository>('IViewRepository');

    await handler.onModuleInit();
  });

  afterEach(async () => {
    await handler.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('handleContentViewed', () => {
    const mockData = {
      contentId: '123e4567-e89b-12d3-a456-426614174000',
      contentType: ContentType.POST,
      viewerHash: 'abc123',
      viewerId: '123e4567-e89b-12d3-a456-426614174001',
      timestamp: new Date('2024-03-21T12:00:00Z'),
    };

    it('should add view operation to batch processor', async () => {
      const event = new ContentViewedEvent(
        mockData.contentId,
        mockData.contentType,
        mockData.viewerHash,
        mockData.viewerId,
        mockData.timestamp,
      );

      await handler.handleContentViewed(event);

      // Verify Redis operation
      expect(mockRedisService.getOrThrow().rpush).toHaveBeenCalledWith(
        'content:views:batch',
        expect.any(String),
      );

      // Verify operation data
      const operationData = JSON.parse(
        mockRedisService.getOrThrow().rpush.mock.calls[0][1],
      );
      expect(operationData).toEqual({
        contentId: mockData.contentId,
        contentType: mockData.contentType,
        viewerHash: mockData.viewerHash,
        viewerId: mockData.viewerId,
      });
    });

    it('should handle anonymous views', async () => {
      const event = new ContentViewedEvent(
        mockData.contentId,
        mockData.contentType,
        mockData.viewerHash,
      );

      await handler.handleContentViewed(event);

      const operationData = JSON.parse(
        mockRedisService.getOrThrow().rpush.mock.calls[0][1],
      );
      expect(operationData).toEqual({
        contentId: mockData.contentId,
        contentType: mockData.contentType,
        viewerHash: mockData.viewerHash,
        viewerId: undefined,
      });
    });

    it('should process batch when full', async () => {
      const events = Array.from(
        { length: 100 },
        () =>
          new ContentViewedEvent(
            mockData.contentId,
            mockData.contentType,
            mockData.viewerHash,
            mockData.viewerId,
          ),
      );

      await Promise.all(
        events.map((event) => handler.handleContentViewed(event)),
      );

      expect(viewRepository.batchInsertView).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            contentId: mockData.contentId,
            contentType: mockData.contentType,
            viewerHash: mockData.viewerHash,
            viewerId: mockData.viewerId,
          }),
        ]),
      );
    });
  });
});

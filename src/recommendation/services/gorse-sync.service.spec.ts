import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from '../../common/event-manager/entities/tokens';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GorseClient } from './gorse.client';
import { GorseSyncService } from './gorse-sync.service';
import { SyncOperation } from '../../common/event-manager/entities/events/schemas/recommendation.events';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
} from '../entities/events/gorse-sync.events';
import type { IEventBus } from '../../common/event-manager';

describe('GorseSyncService', () => {
  let service: GorseSyncService;
  let eventBus: jest.Mocked<IEventBus>;
  let prisma: jest.Mocked<PrismaService>;
  let gorseClient: jest.Mocked<GorseClient>;

  beforeEach(async () => {
    const eventBusMock = {
      publish: jest.fn(),
    };

    const prismaMock = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      publishedPost: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      like: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const gorseClientMock = {
      getUserCount: jest.fn(),
      getItemCount: jest.fn(),
      getFeedbackCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GorseSyncService,
        {
          provide: EVENT_BUS_TOKEN,
          useValue: eventBusMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: GorseClient,
          useValue: gorseClientMock,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GorseSyncService>(GorseSyncService);
    eventBus = module.get(EVENT_BUS_TOKEN);
    prisma = module.get(PrismaService);
    gorseClient = module.get(GorseClient);
  });

  describe('publishUserSync', () => {
    it('should publish user sync event', async () => {
      await service.publishUserSync('user1', ['tech'], SyncOperation.CREATE, [
        'news',
      ]);

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserSyncEvent));

      const event = eventBus.publish.mock.calls[0][0] as UserSyncEvent;
      expect(event.payload).toEqual({
        userId: 'user1',
        labels: ['tech'],
        subscribe: ['news'],
        timestamp: expect.any(Number),
        operation: SyncOperation.CREATE,
      });
    });
  });

  describe('publishItemSync', () => {
    it('should publish item sync event', async () => {
      await service.publishItemSync(
        'item1',
        ['product'],
        SyncOperation.CREATE,
        ['tech'],
        false,
      );

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ItemSyncEvent));

      const event = eventBus.publish.mock.calls[0][0] as ItemSyncEvent;
      expect(event.payload).toEqual({
        itemId: 'item1',
        labels: ['product'],
        categories: ['tech'],
        isHidden: false,
        timestamp: expect.any(Number),
        operation: SyncOperation.CREATE,
      });
    });
  });

  describe('publishFeedbackSync', () => {
    it('should publish feedback sync event', async () => {
      await service.publishFeedbackSync('like', 'user1', 'item1', 'Great!');

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(FeedbackSyncEvent),
      );

      const event = eventBus.publish.mock.calls[0][0] as FeedbackSyncEvent;
      expect(event.payload).toEqual({
        feedbackType: 'like',
        userId: 'user1',
        itemId: 'item1',
        comment: 'Great!',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('performInitialSync', () => {
    beforeEach(() => {
      // Mock data for sync
      (prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { id: 'user1', roles: ['USER', 'CONTENT_CREATOR'] },
        ])
        .mockResolvedValueOnce([]);

      (prisma.publishedPost.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 'item1',
            topics: [
              {
                topic: {
                  name: 'tech',
                },
              },
            ],
            isArchived: false,
          },
        ])
        .mockResolvedValueOnce([]);

      (prisma.like.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 'like1',
            type: 'POST',
            userId: 'user1',
            contentId: 'item1',
          },
        ])
        .mockResolvedValueOnce([]);
    });

    it('should sync all data types', async () => {
      await service.performInitialSync();

      // Verify user sync
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: 'user1',
            labels: ['USER', 'CONTENT_CREATOR'],
            operation: SyncOperation.CREATE,
          }),
        }),
      );

      // Verify item sync
      expect(prisma.publishedPost.findMany).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            itemId: 'item1',
            labels: ['tech'],
            operation: SyncOperation.CREATE,
          }),
        }),
      );

      // Verify feedback sync
      expect(prisma.like.findMany).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: 'user1',
            itemId: 'item1',
            feedbackType: 'like',
          }),
        }),
      );
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      (prisma.user.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.performInitialSync()).rejects.toThrow(error);
    });
  });

  describe('validateSyncStatus', () => {
    it('should detect no discrepancies', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.publishedPost.count as jest.Mock).mockResolvedValue(20);
      (prisma.like.count as jest.Mock).mockResolvedValue(30);

      gorseClient.getUserCount.mockResolvedValue(10);
      gorseClient.getItemCount.mockResolvedValue(20);
      gorseClient.getFeedbackCount.mockResolvedValue(30);

      await service.validateSyncStatus();

      // No re-sync should be triggered
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should handle discrepancies', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.publishedPost.count as jest.Mock).mockResolvedValue(20);
      (prisma.like.count as jest.Mock).mockResolvedValue(30);

      gorseClient.getUserCount.mockResolvedValue(9);
      gorseClient.getItemCount.mockResolvedValue(20);
      gorseClient.getFeedbackCount.mockResolvedValue(29);

      // Mock sync data
      (prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: 'user1', roles: [] }])
        .mockResolvedValueOnce([]);
      (prisma.publishedPost.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.like.findMany as jest.Mock).mockResolvedValue([]);

      await service.validateSyncStatus();

      // Should trigger re-sync
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      (prisma.user.count as jest.Mock).mockRejectedValue(error);

      await expect(service.validateSyncStatus()).rejects.toThrow(error);
    });
  });
});

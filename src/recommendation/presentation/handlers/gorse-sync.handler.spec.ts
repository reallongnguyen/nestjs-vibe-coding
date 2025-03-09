import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GorseSyncHandler } from './gorse-sync.handler';
import { GorseClient } from '../../services/gorse.client';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
} from '../../entities/events/gorse-sync.events';
import { SyncOperation } from '../../../common/event-manager/entities/events/schemas/recommendation.events';

describe('GorseSyncHandler', () => {
  let handler: GorseSyncHandler;
  let gorseClient: jest.Mocked<GorseClient>;
  const timestamp = Date.now();

  beforeEach(async () => {
    const gorseClientMock = {
      insertUser: jest.fn(),
      deleteUser: jest.fn(),
      insertItem: jest.fn(),
      deleteItem: jest.fn(),
      insertFeedback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GorseSyncHandler,
        {
          provide: GorseClient,
          useValue: gorseClientMock,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GorseSyncHandler>(GorseSyncHandler);
    gorseClient = module.get(GorseClient);
  });

  describe('handleUserSync', () => {
    it('should handle user creation', async () => {
      const event = new UserSyncEvent({
        userId: 'user1',
        labels: ['tech'],
        subscribe: ['news'],
        timestamp,
        operation: SyncOperation.CREATE,
      });

      await handler.handleUserSync(event);

      expect(gorseClient.insertUser).toHaveBeenCalledWith(
        'user1',
        ['tech'],
        ['news'],
      );
    });

    it('should handle user deletion', async () => {
      const event = new UserSyncEvent({
        userId: 'user1',
        labels: [],
        timestamp,
        operation: SyncOperation.DELETE,
      });

      await handler.handleUserSync(event);

      expect(gorseClient.deleteUser).toHaveBeenCalledWith('user1');
    });

    it('should propagate errors', async () => {
      const error = new Error('Gorse error');
      gorseClient.insertUser.mockRejectedValue(error);

      const event = new UserSyncEvent({
        userId: 'user1',
        labels: ['tech'],
        timestamp,
        operation: SyncOperation.CREATE,
      });

      await expect(handler.handleUserSync(event)).rejects.toThrow(error);
    });
  });

  describe('handleItemSync', () => {
    it('should handle item creation', async () => {
      const event = new ItemSyncEvent({
        itemId: 'item1',
        labels: ['product'],
        categories: ['tech'],
        timestamp,
        isHidden: false,
        operation: SyncOperation.CREATE,
      });

      await handler.handleItemSync(event);

      expect(gorseClient.insertItem).toHaveBeenCalledWith(
        'item1',
        new Date(timestamp),
        ['product'],
        ['tech'],
        false,
      );
    });

    it('should handle item deletion', async () => {
      const event = new ItemSyncEvent({
        itemId: 'item1',
        labels: [],
        timestamp,
        operation: SyncOperation.DELETE,
      });

      await handler.handleItemSync(event);

      expect(gorseClient.deleteItem).toHaveBeenCalledWith('item1');
    });

    it('should propagate errors', async () => {
      const error = new Error('Gorse error');
      gorseClient.insertItem.mockRejectedValue(error);

      const event = new ItemSyncEvent({
        itemId: 'item1',
        labels: ['product'],
        timestamp,
        operation: SyncOperation.CREATE,
      });

      await expect(handler.handleItemSync(event)).rejects.toThrow(error);
    });
  });

  describe('handleFeedbackSync', () => {
    it('should handle feedback sync', async () => {
      const event = new FeedbackSyncEvent({
        userId: 'user1',
        itemId: 'item1',
        feedbackType: 'like',
        timestamp,
        comment: 'Great!',
      });

      await handler.handleFeedbackSync(event);

      expect(gorseClient.insertFeedback).toHaveBeenCalledWith({
        FeedbackType: 'like',
        UserId: 'user1',
        ItemId: 'item1',
        Timestamp: new Date(timestamp).toISOString(),
        Comment: 'Great!',
      });
    });

    it('should propagate errors', async () => {
      const error = new Error('Gorse error');
      gorseClient.insertFeedback.mockRejectedValue(error);

      const event = new FeedbackSyncEvent({
        userId: 'user1',
        itemId: 'item1',
        feedbackType: 'like',
        timestamp,
      });

      await expect(handler.handleFeedbackSync(event)).rejects.toThrow(error);
    });
  });
});

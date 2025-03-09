import { validate } from 'class-validator';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
  GORSE_EVENTS,
} from './gorse-sync.events';
import { SyncOperation } from '../../../common/event-manager/entities/events/schemas/recommendation.events';

describe('Gorse Events', () => {
  const timestamp = Date.now();

  describe('UserSyncEvent', () => {
    it('should create a user sync event', () => {
      const payload = {
        userId: 'user1',
        labels: ['label1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const event = new UserSyncEvent(payload);

      expect(event.eventName).toBe(GORSE_EVENTS.USER_SYNC.eventName);
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create a user sync event with metadata', () => {
      const payload = {
        userId: 'user1',
        labels: ['label1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const metadata = {
        correlationId: 'correlation1',
        metadata: {
          source: 'test',
        },
      };

      const event = new UserSyncEvent(payload, metadata);

      expect(event.metadata.correlationId).toBe(metadata.correlationId);
      expect(event.metadata.metadata).toEqual(metadata.metadata);
    });

    it('should validate payload schema', async () => {
      const payload = {
        userId: 'user1',
        labels: ['label1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const event = new UserSyncEvent(payload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ItemSyncEvent', () => {
    it('should create an item sync event', () => {
      const payload = {
        itemId: 'item1',
        labels: ['label1'],
        categories: ['cat1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const event = new ItemSyncEvent(payload);

      expect(event.eventName).toBe(GORSE_EVENTS.ITEM_SYNC.eventName);
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create an item sync event with metadata', () => {
      const payload = {
        itemId: 'item1',
        labels: ['label1'],
        categories: ['cat1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const metadata = {
        correlationId: 'correlation1',
        metadata: {
          source: 'test',
        },
      };

      const event = new ItemSyncEvent(payload, metadata);

      expect(event.metadata.correlationId).toBe(metadata.correlationId);
      expect(event.metadata.metadata).toEqual(metadata.metadata);
    });

    it('should validate payload schema', async () => {
      const payload = {
        itemId: 'item1',
        labels: ['label1'],
        categories: ['cat1'],
        timestamp,
        operation: SyncOperation.CREATE,
      };

      const event = new ItemSyncEvent(payload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe('FeedbackSyncEvent', () => {
    it('should create a feedback sync event', () => {
      const payload = {
        userId: 'user1',
        itemId: 'item1',
        feedbackType: 'like',
        timestamp,
        comment: 'Great!',
      };

      const event = new FeedbackSyncEvent(payload);

      expect(event.eventName).toBe(GORSE_EVENTS.FEEDBACK_SYNC.eventName);
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create a feedback sync event with metadata', () => {
      const payload = {
        userId: 'user1',
        itemId: 'item1',
        feedbackType: 'like',
        timestamp,
        comment: 'Great!',
      };

      const metadata = {
        correlationId: 'correlation1',
        metadata: {
          source: 'test',
        },
      };

      const event = new FeedbackSyncEvent(payload, metadata);

      expect(event.metadata.correlationId).toBe(metadata.correlationId);
      expect(event.metadata.metadata).toEqual(metadata.metadata);
    });

    it('should validate payload schema', async () => {
      const payload = {
        userId: 'user1',
        itemId: 'item1',
        feedbackType: 'like',
        timestamp,
        comment: 'Great!',
      };

      const event = new FeedbackSyncEvent(payload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });
  });
});

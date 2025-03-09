import { validate } from 'class-validator';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
  GORSE_EVENTS,
} from './gorse-sync.events';
import { SyncOperation } from '../../../common/event-manager/entities/events/schemas/recommendation.events';

describe('Gorse Sync Events', () => {
  const timestamp = Date.now();

  describe('UserSyncEvent', () => {
    const validPayload = {
      userId: 'user123',
      labels: ['tech', 'gaming'],
      subscribe: ['news'],
      timestamp,
      operation: SyncOperation.CREATE,
    };

    it('should create a valid event', () => {
      const event = new UserSyncEvent(validPayload);

      expect(event.eventName).toBe(GORSE_EVENTS.USER_SYNC.eventName);
      expect(event.payload).toEqual(validPayload);
      expect(event.metadata.version).toBe('1.0.0');
    });

    it('should validate payload schema', async () => {
      const event = new UserSyncEvent(validPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid payload', async () => {
      const invalidPayload = {
        ...validPayload,
        userId: '', // Empty string is invalid
      };

      const event = new UserSyncEvent(invalidPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });
  });

  describe('ItemSyncEvent', () => {
    const validPayload = {
      itemId: 'item123',
      labels: ['product', 'electronics'],
      categories: ['tech'],
      timestamp,
      isHidden: false,
      operation: SyncOperation.CREATE,
    };

    it('should create a valid event', () => {
      const event = new ItemSyncEvent(validPayload);

      expect(event.eventName).toBe(GORSE_EVENTS.ITEM_SYNC.eventName);
      expect(event.payload).toEqual(validPayload);
      expect(event.metadata.version).toBe('1.0.0');
    });

    it('should validate payload schema', async () => {
      const event = new ItemSyncEvent(validPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid payload', async () => {
      const invalidPayload = {
        ...validPayload,
        itemId: '', // Empty string is invalid
      };

      const event = new ItemSyncEvent(invalidPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('itemId');
    });
  });

  describe('FeedbackSyncEvent', () => {
    const validPayload = {
      feedbackType: 'like',
      userId: 'user123',
      itemId: 'item123',
      timestamp,
      comment: 'Great product!',
    };

    it('should create a valid event', () => {
      const event = new FeedbackSyncEvent(validPayload);

      expect(event.eventName).toBe(GORSE_EVENTS.FEEDBACK_SYNC.eventName);
      expect(event.payload).toEqual(validPayload);
      expect(event.metadata.version).toBe('1.0.0');
    });

    it('should validate payload schema', async () => {
      const event = new FeedbackSyncEvent(validPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid payload', async () => {
      const invalidPayload = {
        ...validPayload,
        feedbackType: '', // Empty string is invalid
      };

      const event = new FeedbackSyncEvent(invalidPayload);
      const errors = await validate(event.payload);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('feedbackType');
    });
  });
});

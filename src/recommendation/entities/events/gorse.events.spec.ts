import { GorseItemType, GorseFeedbackType } from 'src/common/event-manager';

import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
} from './gorse.events';

describe('Gorse Events', () => {
  describe('UserSyncEvent', () => {
    it('should create a user sync event', () => {
      const payload = {
        userId: 'user1',
        labels: ['label1'],
        lastActiveAt: new Date(),
      };

      const event = new UserSyncEvent(payload);

      expect(event.eventName).toBe('gorse.user.sync');
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.getPartitionKey()).toBe('gorse');
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create a user sync event with metadata', () => {
      const payload = {
        userId: 'user1',
        labels: ['label1'],
        lastActiveAt: new Date(),
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
  });

  describe('ItemSyncEvent', () => {
    it('should create an item sync event', () => {
      const payload = {
        itemId: 'item1',
        itemType: GorseItemType.POST,
        timestamp: new Date(),
        labels: ['label1'],
        categories: ['cat1'],
      };

      const event = new ItemSyncEvent(payload);

      expect(event.eventName).toBe('gorse.item.sync');
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.getPartitionKey()).toBe('gorse');
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create an item sync event with metadata', () => {
      const payload = {
        itemId: 'item1',
        itemType: GorseItemType.POST,
        timestamp: new Date(),
        labels: ['label1'],
        categories: ['cat1'],
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
  });

  describe('FeedbackSyncEvent', () => {
    it('should create a feedback sync event', () => {
      const payload = {
        userId: 'user1',
        itemId: 'item1',
        feedbackType: GorseFeedbackType.LIKE,
        timestamp: new Date(),
      };

      const event = new FeedbackSyncEvent(payload);

      expect(event.eventName).toBe('gorse.feedback.sync');
      expect(event.eventId).toBeDefined();
      expect(event.metadata).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.getPartitionKey()).toBe('gorse');
      expect(event.toJSON()).toEqual(payload);
    });

    it('should create a feedback sync event with metadata', () => {
      const payload = {
        userId: 'user1',
        itemId: 'item1',
        feedbackType: GorseFeedbackType.LIKE,
        timestamp: new Date(),
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
  });
});

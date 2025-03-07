import {
  LikeCreatedEvent,
  CommentCreatedEvent,
  FollowCreatedEvent,
} from '../social.events';
import { SocialEventSchemas } from '../schemas/social.events';

describe('Social Events', () => {
  describe('LikeCreatedEvent', () => {
    it('should create a like event with correct schema', () => {
      const payload = {
        actorId: 'user1',
        contentType: 'POST' as const,
        contentId: 'post1',
        targetUserId: 'user2',
      };

      const event = new LikeCreatedEvent(payload);

      expect(event.eventName).toBe(SocialEventSchemas.LIKE_CREATED.eventName);
      expect(event.payload).toEqual(payload);
      expect(event.metadata.version).toBe(
        SocialEventSchemas.LIKE_CREATED.version,
      );
      expect(event.getPartitionKey()).toBe('social');
    });
  });

  describe('CommentCreatedEvent', () => {
    it('should create a comment event with correct schema', () => {
      const payload = {
        actorId: 'user1',
        contentType: 'POST' as const,
        contentId: 'post1',
        commentId: 'comment1',
        targetUserId: 'user2',
        preview: 'Test comment',
      };

      const event = new CommentCreatedEvent(payload);

      expect(event.eventName).toBe(
        SocialEventSchemas.COMMENT_CREATED.eventName,
      );
      expect(event.payload).toEqual(payload);
      expect(event.metadata.version).toBe(
        SocialEventSchemas.COMMENT_CREATED.version,
      );
      expect(event.getPartitionKey()).toBe('social');
    });
  });

  describe('FollowCreatedEvent', () => {
    it('should create a follow event with correct schema', () => {
      const payload = {
        followerId: 'user1',
        followingId: 'user2',
      };

      const event = new FollowCreatedEvent(payload);

      expect(event.eventName).toBe(SocialEventSchemas.FOLLOW_CREATED.eventName);
      expect(event.payload).toEqual(payload);
      expect(event.metadata.version).toBe(
        SocialEventSchemas.FOLLOW_CREATED.version,
      );
      expect(event.getPartitionKey()).toBe('social');
    });
  });

  describe('Event Metadata', () => {
    it('should include custom metadata when provided', () => {
      const payload = {
        actorId: 'user1',
        contentType: 'POST' as const,
        contentId: 'post1',
        targetUserId: 'user2',
      };

      const metadata = {
        correlationId: 'test-correlation-id',
        metadata: {
          source: 'test',
        },
      };

      const event = new LikeCreatedEvent(payload, metadata);

      expect(event.metadata.correlationId).toBe(metadata.correlationId);
      expect(event.metadata.metadata).toEqual(metadata.metadata);
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.metadata.version).toBe(
        SocialEventSchemas.LIKE_CREATED.version,
      );
    });
  });
});

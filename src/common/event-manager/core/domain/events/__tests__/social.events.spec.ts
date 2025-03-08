import {
  LikeCreatedEvent,
  CommentCreatedEvent,
  FollowCreatedEvent,
} from '../social.events';
import { SocialEventSchemas, ContentType } from '../schemas/social.events';

describe('Social Events', () => {
  describe('LikeCreatedEvent', () => {
    it('should create event with correct schema', () => {
      const payload = {
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        contentType: ContentType.POST,
        contentId: '123e4567-e89b-12d3-a456-426614174001',
        targetUserId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const event = new LikeCreatedEvent(payload);

      expect(event.eventName).toBe('social.like.created');
      expect(event.payload).toEqual(payload);
      expect(event.metadata).toEqual({
        correlationId: undefined,
        metadata: undefined,
        timestamp: expect.any(Number),
        version: '1.0.0',
      });
    });

    it('should create event with metadata', () => {
      const payload = {
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        contentType: ContentType.POST,
        contentId: '123e4567-e89b-12d3-a456-426614174001',
        targetUserId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const metadata = {
        correlationId: '123e4567-e89b-12d3-a456-426614174003',
        metadata: {
          key: 'value',
        },
      };

      const event = new LikeCreatedEvent(payload, metadata);

      expect(event.eventName).toBe('social.like.created');
      expect(event.payload).toEqual(payload);
      expect(event.metadata).toEqual({
        correlationId: metadata.correlationId,
        metadata: metadata.metadata,
        timestamp: expect.any(Number),
        version: '1.0.0',
      });
    });
  });

  describe('CommentCreatedEvent', () => {
    it('should create a comment event with correct schema', () => {
      const payload = {
        actorId: 'user1',
        contentType: ContentType.POST as ContentType.POST | ContentType.EMOTION,
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
        contentType: ContentType.POST,
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

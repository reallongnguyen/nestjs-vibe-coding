import {
  BaseEvent,
  EventMetadata,
  SocialEventSchemas,
  ContentType,
} from 'src/common/event-manager';
import { Comment } from '../comment.entity';

/**
 * Event emitted when a user creates a comment
 */
export class CommentCreatedEvent extends BaseEvent<
  typeof SocialEventSchemas.COMMENT_CREATED.schema
> {
  private readonly eventPayload: typeof SocialEventSchemas.COMMENT_CREATED.schema;

  constructor(
    comment: Comment,
    targetUserId: string,
    contentType: ContentType.POST | ContentType.EMOTION,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(SocialEventSchemas.COMMENT_CREATED, metadata);
    this.eventPayload = {
      targetUserId,
      actorId: comment.userId,
      contentType,
      contentId: comment.postId || comment.emotionId,
      commentId: comment.id,
      preview:
        comment.content.length > 100
          ? `${comment.content.substring(0, 97)}...`
          : comment.content,
    };
  }

  toJSON(): typeof SocialEventSchemas.COMMENT_CREATED.schema {
    return this.eventPayload;
  }
}

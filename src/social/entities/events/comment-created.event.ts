import { BaseEvent } from 'src/common/event-bus';
import { Comment } from '../comment.entity';

const EVENT_NAME = 'comment.created';

export class CommentCreatedEvent extends BaseEvent {
  constructor(
    public readonly comment: Comment,
    params?: ConstructorParameters<typeof BaseEvent>[0],
  ) {
    super(params);
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.comment.id,
      content: this.comment.content,
      postId: this.comment.postId,
      userId: this.comment.userId,
      parentId: this.comment.parentId,
      createdAt: this.comment.createdAt,
    };
  }
}

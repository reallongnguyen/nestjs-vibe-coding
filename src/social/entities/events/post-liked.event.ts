import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface PostLikedEventPayload {
  postId: string;
  userId: string;
}

export class PostLikedEvent extends BaseEvent implements PostLikedEventPayload {
  static readonly eventName = 'post.liked';

  constructor(
    readonly postId: string,
    readonly userId: string,
    params: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return PostLikedEvent.eventName;
  }

  toJSON(): PostLikedEventPayload {
    return {
      postId: this.postId,
      userId: this.userId,
    };
  }
}

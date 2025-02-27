import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class PostLikedEvent extends BaseEvent {
  static readonly eventName = 'post.liked';

  constructor(
    readonly payload: {
      postId: string;
      userId: string;
      timestamp: Date;
    },
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

  toJSON(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}

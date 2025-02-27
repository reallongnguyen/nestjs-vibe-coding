import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class PostUnlikedEvent extends BaseEvent {
  static readonly eventName = 'post.unliked';

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
    return PostUnlikedEvent.eventName;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}

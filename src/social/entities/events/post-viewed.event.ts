import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class PostViewedEvent extends BaseEvent {
  static readonly eventName = 'post.viewed';

  constructor(
    readonly payload: {
      postId: string;
      viewerHash: string;
      viewerId?: string;
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
    return PostViewedEvent.eventName;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}

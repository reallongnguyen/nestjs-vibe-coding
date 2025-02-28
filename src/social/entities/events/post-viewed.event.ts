import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface PostViewedEventPayload {
  postId: string;
  viewerHash: string;
  viewerId?: string;
}

export class PostViewedEvent
  extends BaseEvent
  implements PostViewedEventPayload
{
  static readonly eventName = 'post.viewed';

  constructor(
    readonly postId: string,
    readonly viewerHash: string,
    readonly viewerId?: string,
    params?: {
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

  toJSON(): PostViewedEventPayload {
    return {
      postId: this.postId,
      viewerHash: this.viewerHash,
      viewerId: this.viewerId,
    };
  }
}

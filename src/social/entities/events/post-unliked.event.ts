import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface PostUnlikedEventPayload {
  postId: string;
  userId: string;
}

export class PostUnlikedEvent
  extends BaseEvent
  implements PostUnlikedEventPayload
{
  static readonly eventName = 'post.unliked';

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
    return PostUnlikedEvent.eventName;
  }

  toJSON(): PostUnlikedEventPayload {
    return {
      postId: this.postId,
      userId: this.userId,
    };
  }
}

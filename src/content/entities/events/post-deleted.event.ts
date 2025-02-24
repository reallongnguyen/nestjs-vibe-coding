import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class DraftPostDeletedEvent extends BaseEvent {
  constructor(
    public readonly payload: {
      postId: string;
      userId: string;
    },
  ) {
    super();
  }

  eventName(): string {
    return 'draft-post.deleted';
  }

  static getEventName(): string {
    return 'draft-post.deleted';
  }

  toJSON(): Record<string, any> {
    return { ...this };
  }
}

export class PublishedPostDeletedEvent extends BaseEvent {
  constructor(
    public readonly payload: {
      postId: string;
      userId: string;
    },
  ) {
    super();
  }

  eventName(): string {
    return 'published-post.deleted';
  }

  static getEventName(): string {
    return 'published-post.deleted';
  }

  toJSON(): Record<string, any> {
    return { ...this };
  }
}

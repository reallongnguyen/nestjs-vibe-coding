import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export const POST_PUBLISHED_EVENT_NAME = 'post.published';

export class PostPublishedEvent extends BaseEvent {
  constructor(
    public readonly publishedId: string,
    public readonly draftId: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly slug: string,
  ) {
    super();
  }

  eventName(): string {
    return POST_PUBLISHED_EVENT_NAME;
  }

  static getEventName(): string {
    return POST_PUBLISHED_EVENT_NAME;
  }

  toJSON(): Record<string, any> {
    return { ...this };
  }
}

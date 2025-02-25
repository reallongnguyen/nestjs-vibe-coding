import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

const EVENT_NAME = 'post.updated';

export class PostUpdatedEvent extends BaseEvent {
  postId: string;
  draftId: string;
  userId: string;
  title: string;
  slug: string;

  constructor(
    postId: string,
    draftId: string,
    userId: string,
    title: string,
    slug: string,
    params?: ConstructorParameters<typeof BaseEvent>[0],
  ) {
    super(params);

    this.postId = postId;
    this.draftId = draftId;
    this.userId = userId;
    this.title = title;
    this.slug = slug;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getName(): string {
    return EVENT_NAME;
  }

  toJSON(): Record<string, unknown> {
    return {
      postId: this.postId,
      draftId: this.draftId,
      userId: this.userId,
      title: this.title,
      slug: this.slug,
    };
  }
}

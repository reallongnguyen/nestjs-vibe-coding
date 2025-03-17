import { BaseEvent, ContentEventSchemas } from 'src/common/event-manager';

/**
 * Event emitted when a post is updated
 */
export class PostUpdatedEvent extends BaseEvent<
  typeof ContentEventSchemas.POST_UPDATED.schema
> {
  constructor(
    private readonly postId: string,
    private readonly draftId: string,
    private readonly userId: string,
    private readonly title: string,
    private readonly slug: string,
    private readonly topics: string[],
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(ContentEventSchemas.POST_UPDATED, params);
  }

  toJSON() {
    return {
      postId: this.postId,
      draftId: this.draftId,
      userId: this.userId,
      title: this.title,
      slug: this.slug,
      topics: this.topics,
    };
  }
}

export { ContentEventSchemas as POST_EVENTS };

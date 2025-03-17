import { BaseEvent, ContentEventSchemas } from 'src/common/event-manager';

/**
 * Event emitted when a post is published
 */
export class PostPublishedEvent extends BaseEvent<
  typeof ContentEventSchemas.POST_PUBLISHED.schema
> {
  constructor(
    private readonly publishedId: string,
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
    super(ContentEventSchemas.POST_PUBLISHED, params);
  }

  toJSON() {
    return {
      publishedId: this.publishedId,
      draftId: this.draftId,
      userId: this.userId,
      title: this.title,
      slug: this.slug,
      topics: this.topics,
    };
  }
}

export { ContentEventSchemas as POST_EVENTS };

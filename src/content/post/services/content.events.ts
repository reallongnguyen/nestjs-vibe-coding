import { Injectable } from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { PostPublishedEvent } from '../entities/events/post-published.event';
import { PostUpdatedEvent } from '../entities/events/post-updated.event';
import { DraftPost } from '../entities/draft-post.entity';

@Injectable()
export class ContentEvents {
  constructor(@InjectEventBus() private readonly eventBus: IEventBus) {}

  async emitPostPublished(
    publishedId: string,
    draftId: string,
    userId: string,
    title: string,
    slug: string,
    topics: string[],
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ): Promise<void> {
    const event = new PostPublishedEvent(
      publishedId,
      draftId,
      userId,
      title,
      slug,
      topics,
      params,
    );

    await this.eventBus.publish(event);
  }

  async emitPostUpdated(
    postId: string,
    draftId: string,
    userId: string,
    title: string,
    slug: string,
    topics: string[],
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ): Promise<void> {
    const event = new PostUpdatedEvent(
      postId,
      draftId,
      userId,
      title,
      slug,
      topics,
      params,
    );

    await this.eventBus.publish(event);
  }

  // Method for use in draft-post.service.ts
  async publishPostUpdatedEvent(draft: DraftPost): Promise<void> {
    await this.emitPostUpdated(
      draft.publishedId || '',
      draft.id,
      draft.userId,
      draft.title,
      '', // No slug for draft
      draft.topics,
    );
  }
}

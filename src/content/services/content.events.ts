import { Injectable } from '@nestjs/common';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';
import { InjectEventBus } from 'src/common/event-bus';
import { PostPublishedEvent } from '../entities/events/post-published.event';

@Injectable()
export class ContentEvents {
  constructor(@InjectEventBus() private readonly eventBus: EventBusPort) {}

  async emitPostPublished(
    publishedId: string,
    draftId: string,
    userId: string,
    title: string,
    slug: string,
  ): Promise<void> {
    const event = new PostPublishedEvent(
      publishedId,
      draftId,
      userId,
      title,
      slug,
    );

    await this.eventBus.publish(event);
  }
}

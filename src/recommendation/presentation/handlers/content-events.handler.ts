import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EventBusMessage,
  IEventBus,
  InjectEventBus,
  SocialEventSchemas,
} from 'src/common/event-manager';
import { FeedbackSyncEvent } from 'src/recommendation/entities/events/gorse-sync.events';

@Injectable()
export class ContentEventsHandler {
  private readonly logger = new Logger(ContentEventsHandler.name);

  constructor(@InjectEventBus() private readonly eventBus: IEventBus) {}

  @OnEvent(SocialEventSchemas.LIKE_CREATED.eventName)
  async handleLikeCreated(
    event: EventBusMessage<typeof SocialEventSchemas.LIKE_CREATED.schema>,
  ): Promise<void> {
    this.logger.verbose(
      `recommendation: content liked handler: ${event.payload.actorId} liked ${event.payload.contentId}`,
    );

    const feedbackSyncEvent = new FeedbackSyncEvent({
      userId: event.payload.actorId,
      itemId: event.payload.contentId,
      feedbackType: 'like',
      timestamp: event.metadata.timestamp,
    });

    this.eventBus.publish(feedbackSyncEvent);
  }
}

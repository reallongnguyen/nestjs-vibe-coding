import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EventBusMessage,
  IEventBus,
  InjectEventBus,
  SocialEventSchemas,
  ContentEventSchemas,
  SyncOperation,
  GamificationEventSchemas,
} from 'src/common/event-manager';
import {
  FeedbackSyncEvent,
  ItemSyncEvent,
} from 'src/recommendation/entities/events/gorse-sync.events';

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

  @OnEvent(ContentEventSchemas.POST_PUBLISHED.eventName)
  async handlePostPublished(
    event: EventBusMessage<typeof ContentEventSchemas.POST_PUBLISHED.schema>,
  ): Promise<void> {
    this.logger.verbose(
      `recommendation: post published handler: ${event.payload.publishedId}`,
    );

    // TODO: add labels to the item
    const newItem = new ItemSyncEvent({
      itemId: event.payload.publishedId,
      timestamp: event.metadata.timestamp,
      labels: [],
      operation: SyncOperation.CREATE,
    });

    this.eventBus.publish(newItem);
  }

  @OnEvent(ContentEventSchemas.POST_UPDATED.eventName)
  async handlePostUpdated(
    event: EventBusMessage<typeof ContentEventSchemas.POST_UPDATED.schema>,
  ): Promise<void> {
    this.logger.verbose(
      `recommendation: post updated handler: ${event.payload.postId}`,
    );

    // TODO: add labels to the item
    const updatedItem = new ItemSyncEvent({
      itemId: event.payload.postId,
      timestamp: event.metadata.timestamp,
      labels: [],
      operation: SyncOperation.UPDATE,
    });

    this.eventBus.publish(updatedItem);
  }

  @OnEvent(GamificationEventSchemas.EMOTION_CREATED.eventName)
  async handleEmotionCreated(
    event: EventBusMessage<
      typeof GamificationEventSchemas.EMOTION_CREATED.schema
    >,
  ): Promise<void> {
    this.logger.verbose(
      `recommendation: emotion created handler: ${event.payload.emotionId}`,
    );

    const itemSyncEvent = new ItemSyncEvent({
      itemId: event.payload.emotionId,
      timestamp: event.metadata.timestamp,
      labels: [],
      operation: SyncOperation.CREATE,
    });

    this.eventBus.publish(itemSyncEvent);
  }

  @OnEvent(GamificationEventSchemas.EMOTION_DELETED.eventName)
  async handleEmotionDeleted(
    event: EventBusMessage<
      typeof GamificationEventSchemas.EMOTION_DELETED.schema
    >,
  ): Promise<void> {
    this.logger.verbose(
      `recommendation: emotion deleted handler: ${event.payload.emotionId}`,
    );

    const itemSyncEvent = new ItemSyncEvent({
      itemId: event.payload.emotionId,
      timestamp: event.metadata.timestamp,
      labels: [],
      operation: SyncOperation.DELETE,
    });

    this.eventBus.publish(itemSyncEvent);
  }

  @OnEvent(SocialEventSchemas.CONTENT_VIEWED.eventName)
  async handleContentViewed(
    event: EventBusMessage<typeof SocialEventSchemas.CONTENT_VIEWED.schema>,
  ): Promise<void> {
    const { contentId, viewerId } = event.payload;

    // Skip anonymous views
    if (!viewerId) {
      return;
    }

    const feedbackSyncEvent = new FeedbackSyncEvent({
      userId: viewerId,
      itemId: contentId,
      feedbackType: 'read',
      timestamp: event.metadata.timestamp,
    });

    this.eventBus.publish(feedbackSyncEvent);
  }
}

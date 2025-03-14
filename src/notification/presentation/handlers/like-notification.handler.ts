import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';
import { NotificationProducerService } from '../../services/notification-producer.service';

/**
 * Handler for like events that produces notifications
 * Listens to like events and forwards them to the producer service
 */
@Injectable()
export class LikeNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationProducer: NotificationProducerService,
  ) {}

  /**
   * Handle like created events and produce notifications
   * @param event The like created event
   */
  @OnEvent(SocialEventSchemas.LIKE_CREATED.eventName)
  async handleLikeCreated(
    event: EventBusMessage<typeof SocialEventSchemas.LIKE_CREATED.schema>,
  ): Promise<void> {
    try {
      const { targetUserId } = event.payload;

      this.logger.debug('Processing like notification', {
        eventId: event.eventId,
        targetUserId,
      });

      // Forward to producer service
      await this.notificationProducer.handleLikeCreated(event);

      this.logger.debug('Like notification forwarded to producer', {
        eventId: event.eventId,
        targetUserId,
      });
    } catch (err) {
      this.logger.error(`Error processing like notification: ${err.message}`, {
        eventId: event.eventId,
        stack: err.stack,
        targetUserId: event.payload.targetUserId,
      });

      // Re-throw for upstream error handling
      throw err;
    }
  }
}

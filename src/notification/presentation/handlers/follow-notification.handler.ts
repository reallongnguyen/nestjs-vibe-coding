import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';
import { NotificationProducerService } from '../../services/notification-producer.service';

/**
 * Handler for user follow events that produces notifications
 * Listens to follow events and forwards them to the producer service
 */
@Injectable()
export class FollowNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationProducer: NotificationProducerService,
  ) {}

  /**
   * Handle user followed events and produce notifications
   * @param event The user followed event
   */
  @OnEvent(SocialEventSchemas.USER_FOLLOWED.eventName)
  async handleUserFollowed(
    event: EventBusMessage<typeof SocialEventSchemas.USER_FOLLOWED.schema>,
  ): Promise<void> {
    try {
      const { followingId } = event.payload;

      this.logger.debug('Processing follow notification', {
        eventId: event.eventId,
        followingId,
        followerId: event.payload.followerId,
      });

      // Forward to producer service
      await this.notificationProducer.handleUserFollowed(event);

      this.logger.debug('Follow notification forwarded to producer', {
        eventId: event.eventId,
        followingId,
        followerId: event.payload.followerId,
      });
    } catch (err) {
      this.logger.error(
        `Error processing follow notification: ${err.message}`,
        {
          eventId: event.eventId,
          stack: err.stack,
          followingId: event.payload.followingId,
          followerId: event.payload.followerId,
        },
      );

      // Re-throw for upstream error handling
      throw err;
    }
  }
}

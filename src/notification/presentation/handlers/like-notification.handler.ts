import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { NotificationConsumerService } from '../../services/notification-consumer.service';
import { LikeNotificationEvent } from '../../entities/events/like-notification.event';

@Injectable()
export class LikeNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationConsumer: NotificationConsumerService,
  ) {}

  @OnEvent(LikeNotificationEvent.EVENT_NAME)
  async handleLikeNotification(event: LikeNotificationEvent): Promise<void> {
    try {
      this.logger.debug(
        `notification: processing like notification for user ${event.userId}`,
      );

      // Convert event to notification input
      const notificationInput = event.toNotificationInput();

      // Create notification
      await this.notificationConsumer.upsertNotificationSerialByKey(
        notificationInput,
      );

      this.logger.debug(
        `notification: like notification processed for user ${event.userId}`,
      );
    } catch (err) {
      this.logger.error(
        `notification: error processing like notification: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}

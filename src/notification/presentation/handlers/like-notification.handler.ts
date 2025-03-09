import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';
import { NotificationProducerService } from '../../services/notification-producer.service';
import { NotificationPreferenceService } from '../../services/notification-preference.service';
import { NotificationType } from '../../entities/notification-preference.entity';

@Injectable()
export class LikeNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationProducer: NotificationProducerService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @OnEvent(SocialEventSchemas.LIKE_CREATED.eventName)
  async handleLikeCreated(
    event: EventBusMessage<typeof SocialEventSchemas.LIKE_CREATED.schema>,
  ): Promise<void> {
    try {
      const { targetUserId } = event.payload;

      this.logger.debug(
        `notification: processing like notification for user ${targetUserId}`,
      );

      // Get user's notification preference
      const preference = await this.preferenceService.getPreferenceByType(
        targetUserId,
        NotificationType.POST_LIKE,
      );

      // Skip notification if preference is disabled
      if (!preference.enabled) {
        this.logger.debug(
          `notification: skipping like notification for user ${targetUserId} (disabled)`,
        );
        return;
      }

      // Forward to producer service
      await this.notificationProducer.handleLikeCreated(event);
    } catch (err) {
      this.logger.error(
        `notification: error processing like notification: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';
import { ClientProxy, MqttRecordBuilder } from '@nestjs/microservices';
import { NotificationProducerService } from '../../services/notification-producer.service';
import { NotificationOutput } from '../dtos/notification.dto';
import { Notification } from '../../entities/notification.entity';
import { NotificationPreferenceService } from '../../services/notification-preference.service';
import {
  NotificationChannel,
  NotificationType,
} from '../../entities/notification-preference.entity';

@Injectable()
export class EventSubscriber {
  constructor(
    private readonly logger: Logger,
    private readonly notiProducerService: NotificationProducerService,
    private readonly preferenceService: NotificationPreferenceService,
    @Inject('notification_mqtt_client')
    private readonly mqttClient: ClientProxy,
  ) {}

  // demo notification
  @OnEvent('user.profile.updated')
  handleProfileUpdatedEvent(payload: IProfileUpdatedEvent) {
    this.logger.debug(
      `notification: event.subscriber: profile.updated: ${JSON.stringify(payload)}`,
    );

    this.notiProducerService.handleProfileUpdated(payload);
  }

  @OnEvent('notification.created')
  async handleNotificationCreatedEvent(payload: Notification) {
    this.logger.verbose(
      `notification: event.subscriber: notification.created: ${JSON.stringify(payload)}`,
    );

    await this.sendNotificationToChannels(payload);
  }

  @OnEvent('notification.updated')
  async handleNotificationUpdatedEvent(payload: Notification) {
    this.logger.verbose(
      `notification: event.subscriber: notification.updated: ${JSON.stringify(payload)}`,
    );

    await this.sendNotificationToChannels(payload);
  }

  /**
   * Send notification to appropriate channels based on user preferences
   *
   * @param notification The notification to send
   */
  private async sendNotificationToChannels(
    notification: Notification,
  ): Promise<void> {
    try {
      // Get user preferences for this notification type
      const preference = await this.preferenceService.getPreferenceByType(
        notification.userId,
        notification.type as NotificationType,
      );

      // If notifications are disabled, don't send anything
      if (!preference.enabled) {
        this.logger.debug(
          `notification: event.subscriber: sendNotificationToChannels: skipped - user ${notification.userId} has disabled ${notification.type} notifications`,
        );
        return;
      }

      // Send to MQTT if enabled in preferences
      if (preference.channels.includes(NotificationChannel.IN_APP)) {
        const notiOutput = NotificationOutput.from(notification);
        const record = new MqttRecordBuilder(notiOutput).setQoS(1).build();
        const receivedNotificationTopic = this.getReceivedNotificationTopic(
          notification.userId,
        );

        this.mqttClient.send(receivedNotificationTopic, record).subscribe();
        this.logger.debug(
          `notification: event.subscriber: sendNotificationToChannels: sent to MQTT for user ${notification.userId}`,
        );
      }

      // TODO: Add support for other channels (push, email) based on preferences
    } catch (err) {
      this.logger.error(
        `notification: event.subscriber: sendNotificationToChannels: error: ${err.message}`,
      );
    }
  }

  getReceivedNotificationTopic(userId: string) {
    return `users/${userId}/received-notification`;
  }
}

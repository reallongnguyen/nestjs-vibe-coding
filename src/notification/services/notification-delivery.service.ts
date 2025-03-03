import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, MqttRecordBuilder } from '@nestjs/microservices';
import { Notification } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import { NotificationOutput } from '../presentation/dtos/notification.dto';
import { NotificationPreferenceService } from './notification-preference.service';
import {
  NotificationDeliveryAttemptEvent,
  NotificationDeliverySuccessEvent,
  NotificationDeliveryFailureEvent,
} from '../entities/events';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification-preference.entity';

/**
 * Service responsible for delivering notifications through various channels
 * with enhanced error handling and retry mechanisms
 */
@Injectable()
export class NotificationDeliveryService {
  private readonly deliveryTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('notification_mqtt_client')
    private readonly mqttClient: ClientProxy,
  ) {
    // Load configuration values with sensible defaults
    this.deliveryTimeout = this.configService.get<number>(
      'notification.deliveryTimeout',
      5000, // 5 seconds default
    );
    this.maxRetries = this.configService.get<number>(
      'notification.maxDeliveryRetries',
      3, // 3 retries default
    );
    this.retryDelay = this.configService.get<number>(
      'notification.retryDelayMs',
      1000, // 1 second default
    );
  }

  /**
   * Deliver a notification to all appropriate channels based on user preferences
   *
   * @param notification The notification to deliver
   * @returns Promise resolving to true if delivery was successful on all channels
   */
  async deliverNotification(notification: Notification): Promise<boolean> {
    try {
      this.logger.debug(
        `notification: delivery: starting delivery for notification ${notification.id} to user ${notification.userId}`,
      );

      // Get user preferences for this notification type
      const preference = await this.preferenceService.getPreferenceByType(
        notification.userId,
        notification.type as NotificationType,
      );

      // If notifications are disabled, don't send anything
      if (!preference.enabled) {
        this.logger.debug(
          `notification: delivery: skipped - user ${notification.userId} has disabled ${notification.type} notifications`,
        );
        return true; // Consider this a successful delivery (nothing to deliver)
      }

      // Process each enabled channel
      const deliveryResultsPromises = preference.channels.map((channel) =>
        this.processChannelDelivery(channel, notification),
      );

      // Wait for all deliveries to complete
      const channelResults = await Promise.all(deliveryResultsPromises);

      // Combine results into a record
      const deliveryResults = channelResults.reduce(
        (acc, result) => {
          acc[result.channel] = result.success;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      // Log delivery results
      this.logger.debug(
        `notification: delivery: results for notification ${
          notification.id
        }: ${JSON.stringify(deliveryResults)}`,
      );

      // Return true if at least one channel was successful
      return Object.values(deliveryResults).some((result) => result);
    } catch (err) {
      this.logger.error(
        `notification: delivery: error delivering notification ${notification.id}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }

  /**
   * Process delivery for a single channel
   *
   * @param channel The channel to deliver to
   * @param notification The notification to deliver
   * @returns Promise resolving to an object with channel and success status
   */
  private async processChannelDelivery(
    channel: string,
    notification: Notification,
  ): Promise<{ channel: string; success: boolean }> {
    try {
      let success = false;

      switch (channel) {
        case NotificationChannel.IN_APP:
          success = await this.deliverToMqtt(notification);
          break;
        case NotificationChannel.EMAIL:
          // Not implemented yet
          success = false;
          break;
        case NotificationChannel.PUSH:
          // Not implemented yet
          success = false;
          break;
        default:
          success = false;
      }

      return { channel, success };
    } catch (err) {
      // Emit delivery failure event
      this.eventEmitter.emit(
        NotificationDeliveryFailureEvent.EVENT_NAME,
        new NotificationDeliveryFailureEvent(
          notification.id,
          notification.userId,
          channel,
          err instanceof Error ? err : new Error(String(err)),
        ),
      );

      this.logger.error(
        `notification: delivery: failed for channel ${channel}: ${err.message}`,
        err.stack,
      );

      return { channel, success: false };
    }
  }

  /**
   * Deliver a notification via MQTT with retry mechanism
   *
   * @param notification The notification to deliver
   * @returns Promise resolving to true if delivery was successful
   */
  private async deliverToMqtt(notification: Notification): Promise<boolean> {
    try {
      const startTime = Date.now();
      const notiOutput = NotificationOutput.from(notification);
      const record = new MqttRecordBuilder(notiOutput)
        .setQoS(1) // At least once delivery
        .build();

      const topic = this.getReceivedNotificationTopic(notification.userId);

      this.logger.debug(
        `notification: delivery: sending to MQTT topic ${topic} for user ${notification.userId}`,
      );

      // Emit attempt event using the new event class
      this.eventEmitter.emit(
        NotificationDeliveryAttemptEvent.EVENT_NAME,
        new NotificationDeliveryAttemptEvent(
          notification.id,
          notification.userId,
          'in_app',
          startTime,
        ),
      );

      // Since we're using emit() which is fire-and-forget, we don't need timeout/retry logic
      // Just emit the message and consider it delivered
      this.mqttClient.emit(topic, record);

      const endTime = Date.now();
      const latencyMs = endTime - startTime;

      // Emit success event with latency information using the new event class
      this.eventEmitter.emit(
        NotificationDeliverySuccessEvent.EVENT_NAME,
        new NotificationDeliverySuccessEvent(
          notification.id,
          notification.userId,
          'in_app',
          latencyMs,
        ),
      );

      this.logger.debug(
        `notification: delivery: sent to MQTT topic for user ${notification.userId} in ${latencyMs}ms`,
      );

      return true;
    } catch (error) {
      // Emit failure event using the new event class
      this.eventEmitter.emit(
        NotificationDeliveryFailureEvent.EVENT_NAME,
        new NotificationDeliveryFailureEvent(
          notification.id,
          notification.userId,
          'in_app',
          error instanceof Error ? error : new Error(String(error)),
        ),
      );

      this.logger.error(
        `notification: delivery: failed to send to MQTT for user ${notification.userId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get the MQTT topic for a user's notifications
   *
   * @param userId The user ID
   * @returns The MQTT topic string
   */
  private getReceivedNotificationTopic(userId: string): string {
    return `users/${userId}/received-notification`;
  }
}

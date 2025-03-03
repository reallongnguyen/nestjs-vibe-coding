import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { Notification } from '../../entities/notification.entity';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';

@Injectable()
export class NotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly deliveryService: NotificationDeliveryService,
  ) {}

  @OnEvent('notification.created')
  async handleNotificationCreatedEvent(payload: Notification) {
    this.logger.verbose(
      `notification: event.subscriber: notification.created: ${JSON.stringify(payload)}`,
    );

    await this.deliveryService.deliverNotification(payload);
  }

  @OnEvent('notification.updated')
  async handleNotificationUpdatedEvent(payload: Notification) {
    this.logger.verbose(
      `notification: event.subscriber: notification.updated: ${JSON.stringify(payload)}`,
    );

    await this.deliveryService.deliverNotification(payload);
  }
}

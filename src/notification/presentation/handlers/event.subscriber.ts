import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';
import { ClientProxy, MqttRecordBuilder } from '@nestjs/microservices';
import { NotificationProducerService } from '../../services/notification-producer.service';
import { NotificationOutput } from '../dtos/notification.dto';
import { Notification } from '../../entities/notification.entity';

// TODO: move business logic to usecase layer
@Injectable()
export class EventSubscriber {
  constructor(
    private readonly logger: Logger,
    private readonly eventService: NotificationProducerService,
    @Inject('notification_mqtt_client')
    private readonly mqttClient: ClientProxy,
  ) {}

  // demo notification
  @OnEvent('user.profile.updated')
  handleProfileUpdatedEvent(payload: IProfileUpdatedEvent) {
    this.logger.debug(
      `notification: event.subscriber: profile.updated: ${JSON.stringify(payload)}`,
    );

    this.eventService.handleProfileUpdated(payload);
  }

  @OnEvent('notification.created')
  handleNotificationCreatedEvent(payload: Notification) {
    this.logger.debug(
      `notification: event.subscriber: notification.created: ${JSON.stringify(payload)}`,
    );

    // send notice via mqtt
    const notiOutput = NotificationOutput.from(payload);
    const record = new MqttRecordBuilder(notiOutput).setQoS(1).build();
    const receivedNotificationTopic = this.getReceivedNotificationTopic(
      payload.userId,
    );

    this.mqttClient.send(receivedNotificationTopic, record).subscribe();

    // send push
  }

  @OnEvent('notification.updated')
  handleNotificationUpdatedEvent(payload: Notification) {
    this.logger.debug(
      `notification: event.subscriber: notification.updated: ${JSON.stringify(payload)}`,
    );

    // send notice via mqtt
    const notiOutput = NotificationOutput.from(payload);
    const record = new MqttRecordBuilder(notiOutput).setQoS(1).build();
    const receivedNotificationTopic = this.getReceivedNotificationTopic(
      payload.userId,
    );

    this.mqttClient.send(receivedNotificationTopic, record).subscribe();

    // send push
  }

  getReceivedNotificationTopic(userId: string) {
    return `users/${userId}/received-notification`;
  }
}

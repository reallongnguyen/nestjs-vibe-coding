import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { ProfileUpdatedEvent } from 'src/common/models';
import { ClientProxy, MqttRecordBuilder } from '@nestjs/microservices';
import { NotificationProducerService } from '../usecases/notification-producer.service';
import { NotificationOutput } from './dto/notification.dto';
import { Notification } from '../entities/notification.model';

// TODO: move business logic to usecase layer
@Injectable()
export class EventSubscriber {
  constructor(
    private logger: Logger,
    private eventService: NotificationProducerService,
    @Inject('notification_mqtt_client') private mqttClient: ClientProxy,
  ) {}

  // demo notification
  @OnEvent('profile.updated')
  handleProfileUpdatedEvent(payload: ProfileUpdatedEvent) {
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

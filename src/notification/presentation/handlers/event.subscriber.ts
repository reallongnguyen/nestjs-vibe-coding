import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';
import { ClientProxy } from '@nestjs/microservices';
import {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from 'src/common/event-bus/core/domain/events/social-interaction.events';
import { NotificationProducerService } from '../../services/notification-producer.service';
import { Notification } from '../../entities/notification.entity';
import { NotificationPreferenceService } from '../../services/notification-preference.service';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';

@Injectable()
export class EventSubscriber {
  constructor(
    private readonly logger: Logger,
    private readonly notiProducerService: NotificationProducerService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly deliveryService: NotificationDeliveryService,
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

    await this.deliveryService.deliverNotification(payload);
  }

  @OnEvent('notification.updated')
  async handleNotificationUpdatedEvent(payload: Notification) {
    this.logger.verbose(
      `notification: event.subscriber: notification.updated: ${JSON.stringify(payload)}`,
    );

    await this.deliveryService.deliverNotification(payload);
  }

  @OnEvent(PostLikedEvent.EVENT_NAME)
  async handlePostLikedEvent(payload: PostLikedEvent) {
    this.logger.debug(
      `notification: event.subscriber: post.liked: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handlePostLiked(payload);
  }

  @OnEvent(CommentAddedEvent.EVENT_NAME)
  async handleCommentAddedEvent(payload: CommentAddedEvent) {
    this.logger.debug(
      `notification: event.subscriber: comment.added: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleCommentAdded(payload);
  }

  @OnEvent(UserMentionedEvent.EVENT_NAME)
  async handleUserMentionedEvent(payload: UserMentionedEvent) {
    this.logger.debug(
      `notification: event.subscriber: user.mentioned: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleUserMentioned(payload);
  }

  @OnEvent(UserFollowedEvent.EVENT_NAME)
  async handleUserFollowedEvent(payload: UserFollowedEvent) {
    this.logger.debug(
      `notification: event.subscriber: user.followed: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleUserFollowed(payload);
  }
}

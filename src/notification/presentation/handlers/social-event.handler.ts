import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from '../../entities/events/social-interaction.events';
import { NotificationProducerService } from '../../services/notification-producer.service';

@Injectable()
export class SocialEventHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notiProducerService: NotificationProducerService,
  ) {}

  @OnEvent(PostLikedEvent.EVENT_NAME)
  async handlePostLikedEvent(payload: PostLikedEvent) {
    this.logger.debug(
      `notification: handle event post.liked: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handlePostLiked(payload);
  }

  @OnEvent(CommentAddedEvent.EVENT_NAME)
  async handleCommentAddedEvent(payload: CommentAddedEvent) {
    this.logger.debug(
      `notification: handle event comment.added: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleCommentAdded(payload);
  }

  @OnEvent(UserMentionedEvent.EVENT_NAME)
  async handleUserMentionedEvent(payload: UserMentionedEvent) {
    this.logger.debug(
      `notification: handle event user.mentioned: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleUserMentioned(payload);
  }

  @OnEvent(UserFollowedEvent.EVENT_NAME)
  async handleUserFollowedEvent(payload: UserFollowedEvent) {
    this.logger.debug(
      `notification: handle event user.followed: ${JSON.stringify(payload)}`,
    );

    await this.notiProducerService.handleUserFollowed(payload);
  }
}

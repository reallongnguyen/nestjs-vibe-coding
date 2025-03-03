import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppResult } from 'src/common/models';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from '../entities/events/social-interaction.events';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';

@Injectable()
export class NotificationProducerService {
  constructor(
    private readonly logger: Logger,
    @InjectQueue('notification') private readonly notiQueue: Queue,
  ) {}

  async handleProfileUpdated(
    payload: IProfileUpdatedEvent,
  ): Promise<AppResult<string, string>> {
    const notification = new NotificationCreateInput();
    notification.key = `updateProfile:${payload.id}:${payload.id}`;
    notification.type = 'updateProfile';
    notification.userId = payload.id;
    notification.subjects = [
      {
        id: payload.id,
        type: 'user',
        name: payload.name,
        image: payload.avatar,
      },
    ];
    notification.subjectCount = 1;
    notification.link = `/users/${payload.id}/profile`;

    try {
      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      return { data: '' };
    } catch (err) {
      this.logger.error(
        `notification: notification-producer.service: handleProfileUpdated: ${err.message}`,
      );

      return { err: 'serverError' };
    }
  }

  async handlePostLiked(
    payload: PostLikedEvent,
  ): Promise<AppResult<string, string>> {
    // Skip self-likes
    // if (payload.likerId === payload.postOwnerId) {
    //   return { data: '' };
    // }

    const notification = new NotificationCreateInput();
    notification.key = `likePost:${payload.postId}`;
    notification.type = 'likePost';
    notification.userId = payload.postOwnerId;
    notification.subjects = [
      {
        id: payload.likerId,
        type: 'user',
        name: payload.likerName,
        image: payload.likerAvatar,
      },
    ];
    notification.subjectCount = 1;
    notification.diObject = {
      id: payload.postId,
      type: 'post',
      name: payload.postTitle || 'a post',
    };
    notification.link = `/posts/${payload.postId}`;

    try {
      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      return { data: '' };
    } catch (err) {
      this.logger.error(
        `notification: notification-producer.service: handlePostLiked: ${err.message}`,
      );

      return { err: 'serverError' };
    }
  }

  async handleCommentAdded(
    payload: CommentAddedEvent,
  ): Promise<AppResult<string, string>> {
    // Skip self-comments
    if (payload.commenterId === payload.postOwnerId) {
      return { data: '' };
    }

    const notification = new NotificationCreateInput();
    notification.key = `commentPost:${payload.postId}`;
    notification.type = 'commentPost';
    notification.userId = payload.postOwnerId;
    notification.subjects = [
      {
        id: payload.commenterId,
        type: 'user',
        name: payload.commenterName,
        image: payload.commenterAvatar,
      },
    ];
    notification.subjectCount = 1;
    notification.diObject = {
      id: payload.postId,
      type: 'post',
      name: payload.postTitle || 'your post',
    };
    notification.prObject = {
      id: payload.commentId,
      type: 'comment',
      name: payload.commentText,
    };
    notification.link = `/posts/${payload.postId}?comment=${payload.commentId}`;

    try {
      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      return { data: '' };
    } catch (err) {
      this.logger.error(
        `notification: notification-producer.service: handleCommentAdded: ${err.message}`,
      );

      return { err: 'serverError' };
    }
  }

  async handleUserMentioned(
    payload: UserMentionedEvent,
  ): Promise<AppResult<string, string>> {
    // Skip self-mentions
    if (payload.mentioningUserId === payload.mentionedUserId) {
      return { data: '' };
    }

    const notification = new NotificationCreateInput();
    notification.key = `mention:${payload.contentType}:${payload.contentId}:${payload.mentionedUserId}`;
    notification.type = 'mention';
    notification.userId = payload.mentionedUserId;
    notification.subjects = [
      {
        id: payload.mentioningUserId,
        type: 'user',
        name: payload.mentioningUserName,
        image: payload.mentioningUserAvatar,
      },
    ];
    notification.subjectCount = 1;
    notification.inObject = {
      id: payload.contentId,
      type: payload.contentType,
      name: payload.contentText || `a ${payload.contentType}`,
    };

    // Set link based on content type
    if (payload.contentType === 'post') {
      notification.link = `/posts/${payload.contentId}`;
    } else if (payload.contentType === 'comment') {
      // For comments, we need to link to the parent post with the comment highlighted
      // This assumes we have the post ID in the content title or can extract it
      const postId = payload.contentTitle || payload.contentId.split('-')[0];
      notification.link = `/posts/${postId}?comment=${payload.contentId}`;
    }

    try {
      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      return { data: '' };
    } catch (err) {
      this.logger.error(
        `notification: notification-producer.service: handleUserMentioned: ${err.message}`,
      );

      return { err: 'serverError' };
    }
  }

  async handleUserFollowed(
    payload: UserFollowedEvent,
  ): Promise<AppResult<string, string>> {
    const notification = new NotificationCreateInput();
    notification.key = `follow:${payload.followerId}:${payload.followingId}`;
    notification.type = 'follow';
    notification.userId = payload.followingId;
    notification.subjects = [
      {
        id: payload.followerId,
        type: 'user',
        name: payload.followerName,
        image: payload.followerAvatar,
      },
    ];
    notification.subjectCount = 1;
    notification.link = `/users/${payload.followerId}/profile`;

    try {
      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      return { data: '' };
    } catch (err) {
      this.logger.error(
        `notification: notification-producer.service: handleUserFollowed: ${err.message}`,
      );

      return { err: 'serverError' };
    }
  }
}

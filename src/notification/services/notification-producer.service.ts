import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  ContentType,
  SocialEventSchemas,
  EventBusMessage,
} from 'src/common/event-manager';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Retry } from 'src/common';

import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import { NotificationType } from '../entities/notification-preference.entity';
import { NotificationPreferenceService } from './notification-preference.service';

@Injectable()
export class NotificationProducerService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    @InjectQueue('notification') private readonly notiQueue: Queue,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  /**
   * Handle like created event
   * @param event Like created event
   * @returns Result with empty string on success, error message on failure
   */
  @Retry()
  async handleLikeCreated(
    event: EventBusMessage<typeof SocialEventSchemas.LIKE_CREATED.schema>,
  ): Promise<void> {
    const { targetUserId, actorId, contentId, contentType } = event.payload;

    if (actorId === targetUserId) {
      this.logger.debug(
        `notification: notification-producer.service: handleLikeCreated: skipping because actorId is the same as targetUserId`,
      );

      return;
    }

    // Get actor details
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!actor) {
      this.logger.debug(
        `notification: notification-producer.service: handleLikeCreated: skipping because actor is not found`,
      );

      return;
    }

    const notification = new NotificationCreateInput();
    notification.key = `like:${contentType}:${contentId}`;
    notification.userId = targetUserId;
    notification.subjects = [
      {
        id: actorId,
        type: 'USER',
        firstName: actor.firstName,
        lastName: actor.lastName,
        avatar: actor.avatar,
      },
    ];
    notification.subjectCount = 1;

    if (contentType === 'POST') {
      const post = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
        select: { title: true },
      });

      if (!post) {
        this.logger.debug(
          `notification: notification-producer.service: handleLikeCreated: skipping because post is not found`,
        );

        return;
      }

      notification.type = NotificationType.POST_LIKE;

      notification.diObject = {
        id: contentId,
        type: contentType,
        name: post?.title || 'a post',
      };

      notification.link = `/${contentType.toLowerCase()}s/${contentId}`;
    } else if (contentType === 'EMOTION') {
      const emotion = await this.prisma.userEmotion.findUnique({
        where: { id: contentId },
        select: { emotion: true },
      });

      if (!emotion) {
        this.logger.debug(
          `notification: notification-producer.service: handleLikeCreated: skipping because emotion is not found`,
        );

        return;
      }

      notification.type = NotificationType.EMOTION_LIKE;

      notification.diObject = {
        id: contentId,
        type: contentType,
        name: emotion?.emotion || 'an emotion',
      };

      notification.link = `/${contentType.toLowerCase()}s/${contentId}`;
    } else if (contentType === 'COMMENT') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: contentId },
        select: {
          content: true,
          postId: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!comment) {
        this.logger.debug(
          `notification: notification-producer.service: handleLikeCreated: skipping because comment is not found`,
        );

        return;
      }

      notification.type = NotificationType.COMMENT_LIKE;

      notification.diObject = {
        id: contentId,
        type: contentType,
        name: comment?.content || 'a comment',
      };

      notification.prObject = {
        id: comment?.postId,
        type: 'POST',
        name: comment?.post?.title || 'a post',
      };

      notification.link = `/posts/${comment?.postId}?comment=${contentId}`;
    }

    await this.notiQueue.add(notification, {
      attempts: 3,
      timeout: 60000,
      backoff: {
        type: 'exponential',
        delay: 32000,
      },
    });
  }

  /**
   * Handle comment created event
   * @param event Comment created event
   * @returns Result with empty string on success, error message on failure
   */
  @Retry()
  async handleCommentCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_CREATED.schema>,
  ): Promise<void> {
    const {
      targetUserId,
      actorId,
      contentId,
      commentId,
      preview,
      contentType,
    } = event.payload;

    if (actorId === targetUserId) {
      this.logger.debug(
        `notification: notification-producer.service: handleCommentCreated: skipping because actorId is the same as targetUserId`,
      );
      return;
    }

    // Get actor details
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!actor) {
      this.logger.debug(
        `notification: notification-producer.service: handleCommentCreated: skipping because actor is not found`,
      );

      return;
    }

    const notification = new NotificationCreateInput();
    notification.key = `comment:${contentId}`;
    notification.type =
      contentType === ContentType.POST
        ? NotificationType.POST_COMMENT
        : NotificationType.EMOTION_COMMENT;
    notification.userId = targetUserId;
    notification.subjects = [
      {
        id: actorId,
        type: 'USER',
        firstName: actor.firstName,
        lastName: actor.lastName,
        avatar: actor.avatar,
      },
    ];
    notification.subjectCount = 1;

    if (contentType === ContentType.POST) {
      // Get post details
      const post = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
        },
      });

      if (!post) {
        this.logger.debug(
          `notification: notification-producer.service: handleCommentCreated: skipping because post is not found`,
        );

        return;
      }

      notification.diObject = {
        id: post.id,
        type: 'POST',
        name: post.title || 'a post',
      };
      notification.link = `/posts/${contentId}?comment=${commentId}`;
      notification.metadata = {
        postId: contentId,
        commentId,
        preview,
      };
    }

    if (contentType === ContentType.EMOTION) {
      const emotion = await this.prisma.userEmotion.findUnique({
        where: { id: contentId },
        select: { emotion: true },
      });

      if (!emotion) {
        this.logger.debug(
          `notification: notification-producer.service: handleCommentCreated: skipping because emotion is not found`,
        );

        return;
      }

      notification.diObject = {
        id: contentId,
        type: 'EMOTION',
        name: emotion.emotion || 'an emotion',
      };

      notification.link = `/emotions/${contentId}?comment=${commentId}`;
      notification.metadata = {
        emotionId: contentId,
        commentId,
        preview,
      };
    }

    await this.notiQueue.add(notification, {
      attempts: 3,
      timeout: 60000,
      backoff: {
        type: 'exponential',
        delay: 32000,
      },
    });
  }

  /**
   * Handle comment reply created event
   * @param event Comment reply created event
   * @returns Result with empty string on success, error message on failure
   */
  @Retry()
  async handleCommentReplyCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_REPLIED.schema>,
  ): Promise<void> {
    const {
      targetUserId,
      actorId,
      contentId,
      commentId,
      preview,
      contentType,
    } = event.payload;

    if (actorId === targetUserId) {
      this.logger.debug(
        `notification: notification-producer.service: handleCommentReplyCreated: skipping because actorId is the same as targetUserId`,
      );
      return;
    }

    // Get actor details
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!actor) {
      return;
    }

    // Get post and parent comment details
    const [parentComment] = await Promise.all([
      this.prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          content: true,
        },
      }),
    ]);

    if (!parentComment) {
      return;
    }

    const notification = new NotificationCreateInput();
    notification.key = `reply:${commentId}:${commentId}`;
    notification.type = NotificationType.COMMENT_REPLY;
    notification.userId = targetUserId;
    notification.subjects = [
      {
        id: actorId,
        type: 'USER',
        firstName: actor.firstName,
        lastName: actor.lastName,
        avatar: actor.avatar,
      },
    ];
    notification.subjectCount = 1;
    notification.diObject = {
      id: commentId,
      type: 'COMMENT',
      name: preview || 'a reply',
    };
    notification.inObject = {
      id: commentId,
      type: 'COMMENT',
      name: parentComment.content,
    };

    if (contentType === ContentType.POST) {
      const post = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
        select: { title: true },
      });

      if (!post) {
        return;
      }

      notification.prObject = {
        id: contentId,
        type: 'POST',
        name: post.title || 'a post',
      };

      notification.link = `/posts/${contentId}?comment=${commentId}`;
      notification.metadata = {
        postId: contentId,
        commentId,
        preview,
      };
    }

    if (contentType === ContentType.EMOTION) {
      const emotion = await this.prisma.userEmotion.findUnique({
        where: { id: contentId },
        select: { emotion: true },
      });

      if (!emotion) {
        return;
      }

      notification.diObject = {
        id: contentId,
        type: 'EMOTION',
        name: emotion.emotion || 'an emotion',
      };

      notification.link = `/emotions/${contentId}?comment=${commentId}`;
      notification.metadata = {
        emotionId: contentId,
        commentId,
        preview,
      };
    }

    await this.notiQueue.add(notification, {
      attempts: 3,
      timeout: 60000,
      backoff: {
        type: 'exponential',
        delay: 32000,
      },
    });
  }
}

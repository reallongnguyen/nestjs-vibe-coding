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
import { NotificationMetricsService } from './notification-metrics.service';
import { NotificationProducerError } from '../entities/notification.error';

@Injectable()
export class NotificationProducerService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    @InjectQueue('notification') private readonly notiQueue: Queue,
    private readonly metricsService: NotificationMetricsService,
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
    const timer = this.metricsService.startTimer('like', 'producer');

    try {
      const { targetUserId, actorId, contentId, contentType } = event.payload;

      if (actorId === targetUserId) {
        this.logger.debug(
          `notification: notification-producer.service: handleLikeCreated: skipping because actorId is the same as targetUserId`,
        );
        this.metricsService.incrementCounter('like', 'skipped');
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
        this.metricsService.incrementCounter('like', 'skipped');
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
          this.metricsService.incrementCounter('like', 'skipped');
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
          this.metricsService.incrementCounter('like', 'skipped');
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
          this.metricsService.incrementCounter('like', 'skipped');
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

      this.metricsService.incrementCounter('like', 'success');
      this.logger.debug('Like notification successfully queued', {
        eventId: event.eventId,
        targetUserId,
        contentType,
        contentId,
      });
    } catch (err) {
      this.metricsService.incrementCounter('like', 'error');

      const errorCode = 'PRODUCER_ERROR';
      const errorMessage = `Failed to produce like notification: ${err.message}`;

      this.logger.error(errorMessage, {
        eventId: event.eventId,
        targetUserId: event.payload.targetUserId,
        contentId: event.payload.contentId,
        contentType: event.payload.contentType,
        stack: err.stack,
      });

      throw new NotificationProducerError(errorMessage, errorCode, err);
    } finally {
      timer.end();
    }
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
    const timer = this.metricsService.startTimer('comment', 'producer');

    try {
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
        this.metricsService.incrementCounter('comment', 'skipped');
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
        this.metricsService.incrementCounter('comment', 'skipped');
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
          this.metricsService.incrementCounter('comment', 'skipped');
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
          this.metricsService.incrementCounter('comment', 'skipped');
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

      this.metricsService.incrementCounter('comment', 'success');
      this.logger.debug('Comment notification successfully queued', {
        eventId: event.eventId,
        targetUserId,
        contentType,
        contentId,
        commentId,
      });
    } catch (err) {
      this.metricsService.incrementCounter('comment', 'error');

      const errorCode = 'PRODUCER_ERROR';
      const errorMessage = `Failed to produce comment notification: ${err.message}`;

      this.logger.error(errorMessage, {
        eventId: event.eventId,
        targetUserId: event.payload.targetUserId,
        contentId: event.payload.contentId,
        commentId: event.payload.commentId,
        contentType: event.payload.contentType,
        stack: err.stack,
      });

      throw new NotificationProducerError(errorMessage, errorCode, err);
    } finally {
      timer.end();
    }
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
    const timer = this.metricsService.startTimer('comment_reply', 'producer');

    try {
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
        this.metricsService.incrementCounter('comment_reply', 'skipped');
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
          `notification: notification-producer.service: handleCommentReplyCreated: skipping because actor is not found`,
        );
        this.metricsService.incrementCounter('comment_reply', 'skipped');
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
        this.logger.debug(
          `notification: notification-producer.service: handleCommentReplyCreated: skipping because parent comment is not found`,
        );
        this.metricsService.incrementCounter('comment_reply', 'skipped');
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
          this.logger.debug(
            `notification: notification-producer.service: handleCommentReplyCreated: skipping because post is not found`,
          );
          this.metricsService.incrementCounter('comment_reply', 'skipped');
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
          this.logger.debug(
            `notification: notification-producer.service: handleCommentReplyCreated: skipping because emotion is not found`,
          );
          this.metricsService.incrementCounter('comment_reply', 'skipped');
          return;
        }

        notification.prObject = {
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

      this.metricsService.incrementCounter('comment_reply', 'success');
      this.logger.debug('Comment reply notification successfully queued', {
        eventId: event.eventId,
        targetUserId,
        contentType,
        contentId,
        commentId,
      });
    } catch (err) {
      this.metricsService.incrementCounter('comment_reply', 'error');

      const errorCode = 'PRODUCER_ERROR';
      const errorMessage = `Failed to produce comment reply notification: ${err.message}`;

      this.logger.error(errorMessage, {
        eventId: event.eventId,
        targetUserId: event.payload.targetUserId,
        contentId: event.payload.contentId,
        commentId: event.payload.commentId,
        contentType: event.payload.contentType,
        stack: err.stack,
      });

      throw new NotificationProducerError(errorMessage, errorCode, err);
    } finally {
      timer.end();
    }
  }

  /**
   * Handle user followed event
   * @param event User followed event
   * @returns Result with empty string on success, error message on failure
   */
  @Retry()
  async handleUserFollowed(
    event: EventBusMessage<typeof SocialEventSchemas.USER_FOLLOWED.schema>,
  ): Promise<void> {
    const timer = this.metricsService.startTimer('follow', 'producer');

    try {
      const { followerId, followerName, followingId, followerAvatar } =
        event.payload;

      if (followerId === followingId) {
        this.logger.debug(
          `notification: notification-producer.service: handleUserFollowed: skipping because followerId is the same as followingId`,
        );
        this.metricsService.incrementCounter('follow', 'skipped');
        return;
      }

      // Get follower details if not provided in the event
      let follower = {
        firstName: followerName.split(' ')[0] || followerName,
        lastName: followerName.split(' ').slice(1).join(' ') || '',
        avatar: followerAvatar || null,
      };

      // If we don't have complete follower details, fetch from database
      if (!follower.firstName || !follower.lastName) {
        const userDetails = await this.prisma.user.findUnique({
          where: { id: followerId },
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        });

        if (!userDetails) {
          this.logger.debug(
            `notification: notification-producer.service: handleUserFollowed: skipping because follower is not found`,
          );
          this.metricsService.incrementCounter('follow', 'skipped');
          return;
        }

        follower = userDetails;
      }

      const notification = new NotificationCreateInput();
      notification.key = `follow:${followerId}:${followingId}`;
      notification.type = NotificationType.USER_FOLLOW;
      notification.userId = followingId;
      notification.subjects = [
        {
          id: followerId,
          type: 'USER',
          firstName: follower.firstName,
          lastName: follower.lastName,
          avatar: follower.avatar,
        },
      ];
      notification.subjectCount = 1;
      notification.link = `/users/${followerId}/profile`;

      await this.notiQueue.add(notification, {
        attempts: 3,
        timeout: 60000,
        backoff: {
          type: 'exponential',
          delay: 32000,
        },
      });

      this.metricsService.incrementCounter('follow', 'success');
      this.logger.debug('Follow notification successfully queued', {
        eventId: event.eventId,
        followerId,
        followingId,
      });
    } catch (err) {
      this.metricsService.incrementCounter('follow', 'error');

      const errorCode = 'PRODUCER_ERROR';
      const errorMessage = `Failed to produce follow notification: ${err.message}`;

      this.logger.error(errorMessage, {
        eventId: event.eventId,
        followerId: event.payload.followerId,
        followingId: event.payload.followingId,
        stack: err.stack,
      });

      throw new NotificationProducerError(errorMessage, errorCode, err);
    } finally {
      timer.end();
    }
  }
}

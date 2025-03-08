import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SocialEventSchemas } from 'src/common/event-manager/core/domain/events/schemas/social.events';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EventBusMessage } from 'src/common/event-manager/core/domain/events/event.interface';
import { Retry } from 'src/common';

import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import { NotificationType } from '../entities/notification-preference.entity';

@Injectable()
export class NotificationProducerService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    @InjectQueue('notification') private readonly notiQueue: Queue,
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
      return;
    }

    // Get content details
    let contentName = '';
    let parentPost = null;
    if (contentType === 'POST') {
      const post = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
        select: { title: true },
      });
      contentName = post?.title || 'a post';
    } else if (contentType === 'EMOTION') {
      const emotion = await this.prisma.userEmotion.findUnique({
        where: { id: contentId },
        select: { emotion: true },
      });
      contentName = emotion?.emotion || 'an emotion';
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
      contentName = comment?.content || 'a comment';
      parentPost = comment?.post;
    }

    const notification = new NotificationCreateInput();
    notification.key = `like:${contentType}:${contentId}`;
    notification.type = NotificationType.POST_LIKE;
    notification.userId = targetUserId;
    notification.subjects = [
      {
        id: actorId,
        type: 'USER',
        name: `${actor.firstName}${actor.lastName ? ` ${actor.lastName}` : ''}`,
        image: actor.avatar,
      },
    ];
    notification.subjectCount = 1;
    notification.diObject = {
      id: contentId,
      type: contentType,
      name: contentName,
    };

    // For comments, add the parent post as prObject
    if (contentType === 'COMMENT' && parentPost) {
      notification.prObject = {
        id: parentPost.id,
        type: 'POST',
        name: parentPost.title || 'a post',
      };
      notification.link = `/posts/${parentPost.id}?comment=${contentId}`;
    } else {
      notification.link = `/${contentType.toLowerCase()}s/${contentId}`;
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

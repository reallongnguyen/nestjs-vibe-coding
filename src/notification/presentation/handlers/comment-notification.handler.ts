import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';

import { NotificationProducerService } from '../../services/notification-producer.service';

/**
 * Handler for comment events that produces notifications
 * Listens to comment events and forwards them to the producer service
 */
@Injectable()
export class CommentNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationProducer: NotificationProducerService,
  ) {}

  /**
   * Handle comment created events and produce notifications
   * @param event The comment created event
   */
  @OnEvent(SocialEventSchemas.COMMENT_CREATED.eventName)
  async handleCommentCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_CREATED.schema>,
  ): Promise<void> {
    try {
      const { targetUserId } = event.payload;

      this.logger.debug('Processing comment notification', {
        eventId: event.eventId,
        targetUserId,
        commentId: event.payload.commentId,
      });

      // Forward to producer service
      await this.notificationProducer.handleCommentCreated(event);

      this.logger.debug('Comment notification forwarded to producer', {
        eventId: event.eventId,
        targetUserId,
        commentId: event.payload.commentId,
      });
    } catch (err) {
      this.logger.error(
        `Error processing comment notification: ${err.message}`,
        {
          eventId: event.eventId,
          stack: err.stack,
          targetUserId: event.payload.targetUserId,
          commentId: event.payload.commentId,
        },
      );

      // Re-throw for upstream error handling
      throw err;
    }
  }

  /**
   * Handle comment reply created events and produce notifications
   * @param event The comment reply created event
   */
  @OnEvent(SocialEventSchemas.COMMENT_REPLIED.eventName)
  async handleCommentReplyCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_REPLIED.schema>,
  ): Promise<void> {
    try {
      const { targetUserId } = event.payload;

      this.logger.debug('Processing comment reply notification', {
        eventId: event.eventId,
        targetUserId,
        commentId: event.payload.commentId,
      });

      // Forward to producer service
      await this.notificationProducer.handleCommentReplyCreated(event);

      this.logger.debug('Comment reply notification forwarded to producer', {
        eventId: event.eventId,
        targetUserId,
        commentId: event.payload.commentId,
      });
    } catch (err) {
      this.logger.error(
        `Error processing comment reply notification: ${err.message}`,
        {
          eventId: event.eventId,
          stack: err.stack,
          targetUserId: event.payload.targetUserId,
          commentId: event.payload.commentId,
        },
      );

      // Re-throw for upstream error handling
      throw err;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusMessage, SocialEventSchemas } from 'src/common/event-manager';

import { NotificationProducerService } from '../../services/notification-producer.service';

@Injectable()
export class CommentNotificationHandler {
  constructor(
    private readonly logger: Logger,
    private readonly notificationProducer: NotificationProducerService,
  ) {}

  @OnEvent(SocialEventSchemas.COMMENT_CREATED.eventName)
  async handleCommentCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_CREATED.schema>,
  ): Promise<void> {
    const { targetUserId } = event.payload;

    this.logger.debug(
      `notification: processing comment notification for user ${targetUserId}`,
    );

    // Forward to producer service
    await this.notificationProducer.handleCommentCreated(event);
  }

  @OnEvent(SocialEventSchemas.COMMENT_REPLIED.eventName)
  async handleCommentReplyCreated(
    event: EventBusMessage<typeof SocialEventSchemas.COMMENT_REPLIED.schema>,
  ): Promise<void> {
    const { targetUserId } = event.payload;

    this.logger.debug(
      `notification: processing comment reply notification for user ${targetUserId}`,
    );

    // Forward to producer service
    await this.notificationProducer.handleCommentReplyCreated(event);
  }
}

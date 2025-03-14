import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from 'nestjs-pino';
import { NotificationCreateInput } from './dtos/notification.dto';
import { NotificationConsumerService } from '../services/notification-consumer.service';

/**
 * @deprecated This processor is being replaced by NotificationBatchProcessor
 * for improved performance and scalability. New notifications should be sent
 * through the NotificationBatchService instead of directly to this queue.
 *
 * This processor is kept for backward compatibility and will be removed in a future release.
 */
@Processor('notification')
export class NotificationProcessor {
  constructor(
    private readonly logger: Logger,
    private readonly notificationService: NotificationConsumerService,
  ) {}

  @Process({ concurrency: 3 })
  async handleNotification(job: Job<NotificationCreateInput>) {
    this.logger.verbose(
      `notification: notification.processor: handleNotification: process a job has key ${job.data.key} (DEPRECATED - use batch processor instead)`,
    );

    await this.notificationService.upsertNotificationSerialByKey(job.data);
  }
}

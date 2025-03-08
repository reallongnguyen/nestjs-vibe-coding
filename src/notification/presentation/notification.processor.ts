import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from 'nestjs-pino';
import { NotificationCreateInput } from './dtos/notification.dto';
import { NotificationConsumerService } from '../services/notification-consumer.service';

@Processor('notification')
export class NotificationProcessor {
  constructor(
    private readonly logger: Logger,
    private readonly notificationService: NotificationConsumerService,
  ) {}

  @Process({ concurrency: 3 })
  async handleNotification(job: Job<NotificationCreateInput>) {
    this.logger.verbose(
      `notification: notification.processor: handleNotification: process a job has key ${job.data.key}`,
    );

    await this.notificationService.upsertNotificationSerialByKey(job.data);
  }
}

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from 'nestjs-pino';
import { NotificationCreateInput } from './dto/notification.dto';
import { NotificationConsumerService } from '../usecases/notification-consumer.service';

@Processor('notification')
export class NotificationProcessor {
  constructor(
    private logger: Logger,
    private notificationService: NotificationConsumerService,
  ) {}

  @Process({ concurrency: 3 })
  async handleNotification(job: Job<NotificationCreateInput>) {
    this.logger.verbose(
      `notification: notification.processor: handleNotification: process a job has key ${job.data.key}`,
    );

    const { err } =
      await this.notificationService.upsertNotificationSerialByKey(job.data);

    if (err === 'common.serverError') {
      this.logger.log(
        `notification: notification.processor: handleNotification: job has key ${job.data.key} will be retried because ${err}`,
      );

      throw err;
    }
  }
}

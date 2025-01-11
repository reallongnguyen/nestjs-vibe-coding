import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppResult } from 'src/common/models';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationCreateInput } from '../controllers/dto/notification.dto';

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
}

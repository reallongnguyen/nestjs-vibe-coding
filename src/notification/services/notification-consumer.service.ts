import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import HandleBars from 'handlebars';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppResult } from 'src/common/models';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { cloneDeep } from 'lodash';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { notificationTemplate } from '../entities/notification.template';
import { TemplateHelper } from './helpers/template.helper';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import { RedlockMutex } from '../repositories/redlock.mutex';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationConsumerService {
  private readonly mergeNotificationThreshold: number;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
    private readonly mutex: RedlockMutex,
    @InjectQueue('notification') private readonly notiQueue: Queue,
  ) {
    this.mergeNotificationThreshold = this.configService.get<number>(
      'notification.mergeNotificationThreshold',
    );
  }

  async upsertNotificationSerialByKey(
    input: NotificationCreateInput,
  ): Promise<AppResult<Notification, string>> {
    const inputClone = cloneDeep(input);
    const notiMsgTemp = notificationTemplate.vi[inputClone.type];

    if (!notiMsgTemp) {
      this.logger.error(
        `notification: notification-consumer.service: upsertNotification: template notificationTemplate.vi.${inputClone.type} not found`,
      );

      return { err: 'notification.templateNotFound' };
    }

    return this.mutex
      .lock<AppResult<Notification, string>>(
        [inputClone.key],
        async (signal): Promise<AppResult<Notification, string>> => {
          this.logger.verbose(
            `notification: notification-consumer.service: upsertNotification: perform key ${inputClone.key}`,
          );

          try {
            const existNoti = await this.prismaService.notification.findFirst({
              where: {
                key: inputClone.key,
                viewedAt: null,
                notificationTime: {
                  gte: dayjs()
                    .add(-this.mergeNotificationThreshold, 'seconds')
                    .toDate(),
                },
              },
              orderBy: { notificationTime: 'desc' },
            });

            if (existNoti) {
              const newSubjectSeenMap: Record<string, boolean> = {};
              inputClone.subjects?.forEach((s) => {
                newSubjectSeenMap[s.id] = true;
              });

              const existSubjects = existNoti.subjects;
              const otherSubjects = existSubjects.filter(
                (existSubject) => !newSubjectSeenMap[existSubject.id],
              );

              if (otherSubjects.length > 0) {
                if (!inputClone.subjects) {
                  inputClone.subjects = [];
                }

                inputClone.subjects.push(...otherSubjects);
                inputClone.subjectCount = inputClone.subjects
                  ? inputClone.subjects.length
                  : 0;
              }
            }

            if (signal.aborted) {
              return { err: 'common.serverError' };
            }

            const notiCreatedInput: Prisma.NotificationCreateInput = {
              ...inputClone,
              text: '',
              decorators: [],
            };

            const textWithDecorator =
              HandleBars.compile(notiMsgTemp)(notiCreatedInput);

            notiCreatedInput.text =
              TemplateHelper.getRawText(textWithDecorator);
            notiCreatedInput.decorators =
              TemplateHelper.makeDecorator(textWithDecorator);

            let notification: Notification;

            if (existNoti) {
              notification = await this.prismaService.notification.update({
                where: { id: existNoti.id },
                data: {
                  subjects: notiCreatedInput.subjects,
                  subjectCount: notiCreatedInput.subjectCount,
                  text: notiCreatedInput.text,
                  decorators: notiCreatedInput.decorators,
                  link: notiCreatedInput.link,
                  notificationTime: new Date(),
                  viewedAt: null,
                },
              });

              this.eventEmitter.emit('notification.updated', notification);
            } else {
              notification = await this.prismaService.notification.create({
                data: notiCreatedInput,
              });

              this.eventEmitter.emit('notification.created', notification);
            }

            return { data: notification };
          } catch (err) {
            this.logger.error(
              `notification: notification-consumer.service: upsertNotification: ${err.message}`,
            );

            return { err: 'common.serverError' };
          }
        },
      )
      .catch(async (err) => {
        this.logger.verbose(
          `notification: notification-consumer.service: upsertNotification: mutex: ${err.message}`,
        );

        await this.notiQueue.add(inputClone, {
          delay: 100,
          attempts: 3,
          timeout: 60000,
          backoff: {
            type: 'exponential',
            delay: 32000,
          },
        });

        return { data: null };
      });
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';
import { cloneDeep } from 'lodash';
import dayjs from 'dayjs';

import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError } from '../../common/models';
import { TemplateHelper } from './helpers/template.helper';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import { RedlockMutex } from '../repositories/redlock.mutex';
import { Notification } from '../entities/notification.entity';
import { NotificationPreferenceService } from './notification-preference.service';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification-preference.entity';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateLanguage } from '../entities/notification-template.domain';
import { NotificationMetricsService } from './notification-metrics.service';
import { NotificationRateLimitService } from './notification-rate-limit.service';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationConsumerService {
  private readonly mergeNotificationThreshold: number;
  private readonly maxSubjectsPerNotification: number;
  private readonly groupingStrategies: Record<
    string,
    (a: NotificationCreateInput, b: Notification) => boolean
  >;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
    private readonly mutex: RedlockMutex,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly templateService: NotificationTemplateService,
    private readonly metricsService: NotificationMetricsService,
    private readonly rateLimitService: NotificationRateLimitService,
    private readonly notificationService: NotificationService,
  ) {
    this.mergeNotificationThreshold = this.configService.get<number>(
      'notification.mergeNotificationThreshold',
      3600,
    );
    this.maxSubjectsPerNotification = this.configService.get<number>(
      'notification.maxSubjectsPerNotification',
      1000,
    );

    // Initialize grouping strategies for different notification types
    this.groupingStrategies = {
      [NotificationType.PROFILE_UPDATE]: this.canGroupProfileUpdates.bind(this),
      [NotificationType.USER_MENTION]: this.canGroupUserMentions.bind(this),
      // Add more strategies as needed
    };
  }

  /**
   * Determines if a profile update notification can be grouped with an existing notification
   */
  private canGroupProfileUpdates(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newNotification: NotificationCreateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _existingNotification: Notification,
  ): boolean {
    // Profile updates are typically not grouped
    return false;
  }

  /**
   * Determines if a user mention notification can be grouped with an existing notification
   */
  private canGroupUserMentions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newNotification: NotificationCreateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _existingNotification: Notification,
  ): boolean {
    // User mentions are typically not grouped
    return false;
  }

  /**
   * Find candidate notifications for grouping based on key and time threshold
   */
  private async findGroupingCandidates(
    input: NotificationCreateInput,
  ): Promise<Notification[]> {
    return this.prismaService.notification.findMany({
      where: {
        userId: input.userId,
        key: input.key,
        viewedAt: null,
        notificationTime: {
          gte: dayjs()
            .add(-this.mergeNotificationThreshold, 'seconds')
            .toDate(),
        },
        // Don't group if already at max subjects
        subjectCount: {
          lt: this.maxSubjectsPerNotification,
        },
      },
      orderBy: { notificationTime: 'desc' },
      take: 5, // Limit to 5 candidates for performance
    });
  }

  async upsertNotificationSerialByKey(
    input: NotificationCreateInput,
  ): Promise<void> {
    const inputClone = cloneDeep(input);

    try {
      // Check rate limits using the new method in NotificationService
      const isRateLimited = await this.notificationService.isRateLimitExceeded(
        inputClone.userId,
        inputClone.type as NotificationType,
      );

      if (isRateLimited) {
        this.logger.verbose(
          `notification: notification-consumer.service: upsertNotification: skipped - user ${inputClone.userId} is rate limited for ${inputClone.type} notifications`,
        );

        this.metricsService.incrementCounter(inputClone.type, 'rate_limited');

        return;
      }

      // TODO: cache this information
      // Check user preferences before proceeding
      const preference = await this.preferenceService.getPreferenceByType(
        inputClone.userId,
        inputClone.type as NotificationType,
      );

      // If preference exists and notifications are disabled, skip notification creation
      if (!preference.enabled) {
        this.logger.verbose(
          `notification: notification-consumer.service: upsertNotification: skipped - user ${inputClone.userId} has disabled ${inputClone.type} notifications`,
        );

        this.metricsService.incrementCounter(inputClone.type, 'skipped');

        return;
      }

      // If preference exists and doesn't include app channel, skip notification creation
      if (
        preference.channels &&
        !preference.channels.includes(NotificationChannel.IN_APP)
      ) {
        this.logger.verbose(
          `notification: notification-consumer.service: upsertNotification: skipped - user ${inputClone.userId} has disabled app channel for ${inputClone.type} notifications`,
        );
        return;
      }
    } catch (err) {
      // If there's an error getting preferences, continue with notification creation
      this.logger.warn(
        `notification: notification-consumer.service: upsertNotification: error checking preferences: ${err.message}`,
      );
    }

    await this.mutex.lock([inputClone.key], async (signal) => {
      this.logger.verbose(
        `notification: notification-consumer.service: upsertNotification: perform key ${inputClone.key}`,
      );

      // Find potential notifications to group with
      const groupingCandidates = await this.findGroupingCandidates(inputClone);

      // Find the best candidate for grouping based on our strategies
      let existNoti: Notification | null = null;

      if (groupingCandidates.length > 0) {
        const notificationType = inputClone.type;
        const groupingStrategy = this.groupingStrategies[notificationType];

        if (groupingStrategy) {
          // Find the first candidate that matches our grouping strategy
          existNoti =
            groupingCandidates.find((candidate) =>
              groupingStrategy(inputClone, candidate),
            ) || null;
        } else {
          // Default grouping behavior for types without specific strategies
          const [firstCandidate] = groupingCandidates;
          existNoti = firstCandidate;
        }
      }

      if (existNoti) {
        const newSubjectSeenMap: Record<string, boolean> = {};

        if (inputClone.subjects) {
          inputClone.subjects.forEach((s) => {
            newSubjectSeenMap[s.id] = true;
          });
        }

        const existSubjects = existNoti.subjects;
        const otherSubjects = existSubjects.filter(
          (existSubject) => !newSubjectSeenMap[existSubject.id],
        );

        // Check if adding more subjects would exceed the maximum
        const totalSubjectsAfterMerge =
          (inputClone.subjects?.length || 0) + otherSubjects.length;

        if (totalSubjectsAfterMerge <= this.maxSubjectsPerNotification) {
          if (!inputClone.subjects) {
            inputClone.subjects = [];
          }

          inputClone.subjects.push(...otherSubjects);
          inputClone.subjectCount = inputClone.subjects
            ? inputClone.subjects.length
            : 0;
        } else {
          // If we would exceed max subjects, create a new notification instead
          existNoti = null;
        }
      }

      if (signal.aborted) {
        throw new AppError('common.serverError');
      }

      const notiCreatedInput: Prisma.NotificationCreateInput = {
        ...inputClone,
        text: '',
        decorators: [],
      };

      // Try to use the template service first
      const textWithDecorator = await this.templateService.renderTemplate(
        inputClone.type,
        notiCreatedInput,
        TemplateLanguage.VI,
      );

      // Process the rendered template to extract text and decorators
      notiCreatedInput.text = TemplateHelper.getRawText(textWithDecorator);
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
            metadata: {
              ...(existNoti.metadata || {}),
              ...(notiCreatedInput.metadata || {}),
            },
          },
        });

        this.eventEmitter.emit('notification.updated', notification);
      } else {
        notification = await this.prismaService.notification.create({
          data: notiCreatedInput,
        });

        this.eventEmitter.emit('notification.created', notification);
      }

      // Increment rate limit counters after successful notification creation
      await this.rateLimitService.incrementRateLimitCounters(
        inputClone.userId,
        inputClone.type,
      );
    });
  }
}

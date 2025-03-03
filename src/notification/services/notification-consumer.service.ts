import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppResult } from 'src/common/models';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { cloneDeep } from 'lodash';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { TemplateHelper } from './helpers/template.helper';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import { RedlockMutex } from '../repositories/redlock.mutex';
import { Notification } from '../entities/notification.entity';
import { NotificationPreferenceService } from './notification-preference.service';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification-preference.entity';
import { NotificationDomain } from '../entities/notification.domain';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateLanguage } from '../entities/notification-template.domain';

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
    @InjectQueue('notification') private readonly notiQueue: Queue,
  ) {
    this.mergeNotificationThreshold = this.configService.get<number>(
      'notification.mergeNotificationThreshold',
      3600, // Default to 1 hour if not configured
    );
    this.maxSubjectsPerNotification = this.configService.get<number>(
      'notification.maxSubjectsPerNotification',
      10, // Default to 10 if not configured
    );

    // Initialize grouping strategies for different notification types
    this.groupingStrategies = {
      [NotificationType.PROFILE_UPDATE]: this.canGroupProfileUpdates.bind(this),
      [NotificationType.POST_LIKE]: this.canGroupPostLikes.bind(this),
      [NotificationType.POST_COMMENT]: this.canGroupCommentLikes.bind(this),
      [NotificationType.COMMENT_REPLY]: this.canGroupCommentReplies.bind(this),
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
   * Determines if a comment like notification can be grouped with an existing notification
   */
  private canGroupCommentLikes(
    newNotification: NotificationCreateInput,
    existingNotification: Notification,
  ): boolean {
    // Group if they're for the same comment
    if (
      newNotification.metadata?.commentId &&
      existingNotification.metadata?.commentId ===
        newNotification.metadata.commentId
    ) {
      return true;
    }
    return false;
  }

  /**
   * Determines if a post like notification can be grouped with an existing notification
   */
  private canGroupPostLikes(
    newNotification: NotificationCreateInput,
    existingNotification: Notification,
  ): boolean {
    // Group if they're for the same post
    if (
      newNotification.metadata?.postId &&
      existingNotification.metadata?.postId === newNotification.metadata.postId
    ) {
      return true;
    }
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
   * Determines if a comment reply notification can be grouped with an existing notification
   */
  private canGroupCommentReplies(
    newNotification: NotificationCreateInput,
    existingNotification: Notification,
  ): boolean {
    // Group if they're replies to the same comment
    if (
      newNotification.metadata?.parentCommentId &&
      existingNotification.metadata?.parentCommentId ===
        newNotification.metadata.parentCommentId
    ) {
      return true;
    }
    return false;
  }

  /**
   * Find candidate notifications for grouping based on type and time threshold
   */
  private async findGroupingCandidates(
    input: NotificationCreateInput,
  ): Promise<Notification[]> {
    return this.prismaService.notification.findMany({
      where: {
        userId: input.userId,
        type: input.type,
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
  ): Promise<AppResult<Notification, string>> {
    const inputClone = cloneDeep(input);

    try {
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
        return { data: null };
      }

      // If preference exists and doesn't include app channel, skip notification creation
      if (
        preference.channels &&
        !preference.channels.includes(NotificationChannel.IN_APP)
      ) {
        this.logger.verbose(
          `notification: notification-consumer.service: upsertNotification: skipped - user ${inputClone.userId} has disabled app channel for ${inputClone.type} notifications`,
        );
        return { data: null };
      }
    } catch (err) {
      // If there's an error getting preferences, continue with notification creation
      this.logger.warn(
        `notification: notification-consumer.service: upsertNotification: error checking preferences: ${err.message}`,
      );
    }

    return this.mutex
      .lock<AppResult<Notification, string>>(
        [inputClone.key],
        async (signal): Promise<AppResult<Notification, string>> => {
          this.logger.verbose(
            `notification: notification-consumer.service: upsertNotification: perform key ${inputClone.key}`,
          );

          try {
            // Find potential notifications to group with
            const groupingCandidates =
              await this.findGroupingCandidates(inputClone);

            // Find the best candidate for grouping based on our strategies
            let existNoti: Notification | null = null;

            if (groupingCandidates.length > 0) {
              const notificationType = inputClone.type;
              const groupingStrategy =
                this.groupingStrategies[notificationType];

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
              return { err: 'common.serverError' };
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

            // Create domain model for any additional business logic if needed
            NotificationDomain.fromEntity(notification);

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

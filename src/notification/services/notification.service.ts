import { Injectable } from '@nestjs/common';
import { PagedResult } from 'src/common/models';
import { Prisma } from 'src/generated/client';
import { Logger } from 'nestjs-pino';
import { cloneDeep } from 'lodash';
import { NotificationOutput } from '../presentation/dtos/notification.dto';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationMetricsService } from './notification-metrics.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationType } from '../entities/notification-preference.entity';
import { NotificationErrorFactory } from '../entities/errors';

/**
 * Service for managing notifications with optimized queries and caching
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly logger: Logger,
    private readonly notificationRepository: NotificationRepository,
    private readonly metricsService: NotificationMetricsService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  /**
   * Get notifications with pagination and optimized queries
   * @param findManyArgs Prisma find many arguments
   * @returns Paged result of notifications
   */
  async getManyNotifications(
    findManyArgs: Prisma.NotificationFindManyArgs,
  ): Promise<PagedResult<NotificationOutput>> {
    const timer = this.metricsService.startTimer(
      'service',
      'get_many_notifications',
    );

    try {
      const findManyArgsClone = cloneDeep(findManyArgs);
      if (!findManyArgsClone.take) {
        findManyArgsClone.take = 20;
      }

      // Use repository methods for optimized queries
      const notifications = await this.notificationRepository.findMany({
        ...findManyArgsClone,
        orderBy: [{ notificationTime: 'desc', ...findManyArgsClone.orderBy }],
      });

      const total = await this.notificationRepository.count({
        where: findManyArgsClone.where,
      });

      const notiOutputs = notifications.map(NotificationOutput.from);

      return new PagedResult(notiOutputs, {
        pageSize: findManyArgsClone.take,
        pageNumber: Math.floor(findManyArgsClone.skip / findManyArgsClone.take),
        totalItems: total,
        totalPages: Math.ceil(total / findManyArgsClone.take),
        hasNextPage: findManyArgsClone.skip + findManyArgsClone.take < total,
        hasPreviousPage: findManyArgsClone.skip > 0,
      });
    } catch (err) {
      this.logger.error(
        `notification: notification.service: getManyNotifications: ${err.message}`,
        err.stack,
      );

      this.metricsService.incrementCounter('service', 'error');
      throw NotificationErrorFactory.notificationCreateFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      timer.end();
    }
  }

  /**
   * Get notifications for a user with optimized query
   * @param userId User ID
   * @param limit Maximum number of notifications to return
   * @param offset Number of notifications to skip
   * @param includeViewed Whether to include viewed notifications
   * @returns Paged result of notifications
   */
  async getNotificationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    includeViewed: boolean = false,
  ): Promise<PagedResult<NotificationOutput>> {
    const timer = this.metricsService.startTimer(
      'service',
      'get_notifications_for_user',
    );

    try {
      // Use optimized repository method
      const notifications = await this.notificationRepository.findByUserId(
        userId,
        limit,
        offset,
        includeViewed,
      );

      // Get count with caching
      const total = includeViewed
        ? await this.notificationRepository.count({ where: { userId } })
        : await this.notificationRepository.countUnreadByUserId(userId);

      const notiOutputs = notifications.map(NotificationOutput.from);

      return new PagedResult(notiOutputs, {
        pageSize: limit,
        pageNumber: Math.floor(offset / limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + limit < total,
        hasPreviousPage: offset > 0,
      });
    } catch (err) {
      this.logger.error(
        `notification: notification.service: getNotificationsForUser: ${err.message}`,
        err.stack,
      );

      this.metricsService.incrementCounter('service', 'error');
      throw NotificationErrorFactory.notificationCreateFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      timer.end();
    }
  }

  /**
   * Mark notifications as viewed
   * @param userId User ID
   * @param notificationId Optional notification ID (if null, mark all as viewed)
   */
  async view(userId: string, notificationId?: string): Promise<void> {
    const timer = this.metricsService.startTimer('service', 'view');

    try {
      // Use repository method for optimized update
      await this.notificationRepository.updateMany({
        where: {
          userId,
          id: notificationId,
          viewedAt: null,
        },
        data: {
          viewedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Record metric for viewed notifications
      this.metricsService.incrementCounter(
        'notification',
        notificationId ? 'single_viewed' : 'batch_viewed',
      );
    } catch (err) {
      this.logger.error(
        `notification: notification.service: markNotificationAsRead: ${err.message}`,
        err.stack,
      );

      this.metricsService.incrementCounter('service', 'error');
      throw NotificationErrorFactory.notificationUpdateFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      timer.end();
    }
  }

  /**
   * Get unread notification count for a user with caching
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const timer = this.metricsService.startTimer('service', 'get_unread_count');

    try {
      // Use optimized repository method with caching
      return await this.notificationRepository.countUnreadByUserId(userId);
    } catch (err) {
      this.logger.error(
        `notification: notification.service: getUnreadCount: ${err.message}`,
        err.stack,
      );

      this.metricsService.incrementCounter('service', 'error');
      throw err;
    } finally {
      timer.end();
    }
  }

  /**
   * Check if a notification exceeds rate limits
   * @param userId User ID
   * @param type Notification type
   * @returns True if rate limit is exceeded, false otherwise
   */
  async isRateLimitExceeded(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const timer = this.metricsService.startTimer('service', 'check_rate_limit');

    try {
      // Get user's notification preference
      const preference = await this.preferenceService.getPreferenceByType(
        userId,
        type,
      );

      // If no preference or no rate limits defined, rate limit is not exceeded
      if (!preference?.metadata?.rateLimits) {
        return false;
      }

      const { rateLimits } = preference.metadata;
      const now = new Date();

      // Check per minute limit
      if (rateLimits.perMinute) {
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const countLastMinute = await this.notificationRepository.count({
          where: {
            userId,
            type,
            notificationTime: {
              gte: oneMinuteAgo,
            },
          },
        });

        if (countLastMinute >= rateLimits.perMinute) {
          this.logger.debug(
            `Rate limit exceeded for user ${userId}, type ${type}: ${countLastMinute} notifications in the last minute (limit: ${rateLimits.perMinute})`,
          );
          return true;
        }
      }

      // Check per hour limit
      if (rateLimits.perHour) {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const countLastHour = await this.notificationRepository.count({
          where: {
            userId,
            type,
            notificationTime: {
              gte: oneHourAgo,
            },
          },
        });

        if (countLastHour >= rateLimits.perHour) {
          this.logger.debug(
            `Rate limit exceeded for user ${userId}, type ${type}: ${countLastHour} notifications in the last hour (limit: ${rateLimits.perHour})`,
          );
          return true;
        }
      }

      // Check per day limit
      if (rateLimits.perDay) {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const countLastDay = await this.notificationRepository.count({
          where: {
            userId,
            type,
            notificationTime: {
              gte: oneDayAgo,
            },
          },
        });

        if (countLastDay >= rateLimits.perDay) {
          this.logger.debug(
            `Rate limit exceeded for user ${userId}, type ${type}: ${countLastDay} notifications in the last day (limit: ${rateLimits.perDay})`,
          );
          return true;
        }
      }

      // No rate limits exceeded
      return false;
    } catch (err) {
      this.logger.error(
        `notification: notification.service: isRateLimitExceeded: ${err.message}`,
        err.stack,
      );

      this.metricsService.incrementCounter('service', 'error');
      // Since this is checking a condition, we want to handle errors gracefully
      // but use the error factory for logging
      const error = NotificationErrorFactory.rateLimitCheckFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
      this.logger.error(`Rate limit check failed: ${error.message}`);
      // Default to not rate limited in case of error
      return false;
    } finally {
      timer.end();
    }
  }
}

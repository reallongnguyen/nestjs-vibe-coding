import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppError, Collection } from 'src/common/models';
import {
  NotificationPreference,
  NotificationType,
  NotificationChannel,
} from '../entities/notification-preference.entity';
import { INotificationPreferenceRepository } from './interfaces/notification-preference-repository.interface';

/**
 * Service for managing notification preferences
 */
@Injectable()
export class NotificationPreferenceService {
  constructor(
    private readonly logger: Logger,
    @Inject('INotificationPreferenceRepository')
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  /**
   * Get notification preferences for a user
   *
   * @param userId User ID
   * @param options Pagination options
   * @returns Collection of notification preferences
   */
  async getPreferences(
    userId: string,
    options: { offset?: number; limit?: number } = {},
  ): Promise<Collection<NotificationPreference>> {
    try {
      const preferences = await this.preferenceRepository.findMany({
        where: { userId },
        skip: options.offset,
        take: options.limit || 20,
        orderBy: { updatedAt: 'desc' },
      });

      const total = await this.preferenceRepository.count({ userId });

      return {
        edges: preferences,
        pagination: {
          offset: options.offset || 0,
          limit: options.limit || 20,
          total,
        },
      };
    } catch (err) {
      this.logger.error(
        `notification: notification-preference.service: getPreferences: ${err.message}`,
      );
      throw new AppError('common.serverError');
    }
  }

  /**
   * Get a specific notification preference by type
   *
   * @param userId User ID
   * @param type Notification type
   * @returns Notification preference or null if not found
   */
  async getPreferenceByType(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreference> {
    try {
      const preference = await this.preferenceRepository.findByUserIdAndType(
        userId,
        type,
      );

      if (!preference) {
        // Create default preference if not found
        return this.createDefaultPreference(userId, type);
      }

      return preference;
    } catch (err) {
      this.logger.error(
        `notification: notification-preference.service: getPreferenceByType: ${err.message}`,
      );
      throw new AppError('common.serverError');
    }
  }

  /**
   * Create a notification preference
   *
   * @param userId User ID
   * @param type Notification type
   * @param channels Notification channels
   * @param enabled Whether the notification is enabled
   * @returns Created notification preference
   */
  async createPreference(
    userId: string,
    type: NotificationType,
    channels: NotificationChannel[],
    enabled: boolean,
  ): Promise<NotificationPreference> {
    try {
      // Check if preference already exists
      const existingPreference =
        await this.preferenceRepository.findByUserIdAndType(userId, type);

      if (existingPreference) {
        throw new AppError('notification.preference.alreadyExists');
      }

      // Create new preference
      return this.preferenceRepository.create({
        userId,
        type,
        channels: channels.map((c) => c.toString()),
        enabled,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      this.logger.error(
        `notification: notification-preference.service: createPreference: ${err.message}`,
      );
      throw new AppError('common.serverError');
    }
  }

  /**
   * Update a notification preference
   *
   * @param userId User ID
   * @param type Notification type
   * @param data Update data
   * @returns Updated notification preference
   */
  async updatePreference(
    userId: string,
    type: NotificationType,
    data: {
      channels?: NotificationChannel[];
      enabled?: boolean;
    },
  ): Promise<NotificationPreference> {
    try {
      // Get existing preference
      const preference = await this.preferenceRepository.findByUserIdAndType(
        userId,
        type,
      );

      if (!preference) {
        // Create default preference if not found
        const defaultPreference = await this.createDefaultPreference(
          userId,
          type,
        );

        // Apply updates
        if (data.channels !== undefined) {
          defaultPreference.channels = data.channels;
        }
        if (data.enabled !== undefined) {
          defaultPreference.enabled = data.enabled;
        }

        return defaultPreference;
      }

      // Update existing preference
      return this.preferenceRepository.update(preference.id, {
        channels: data.channels?.map((c) => c.toString()),
        enabled: data.enabled,
      });
    } catch (err) {
      this.logger.error(
        `notification: notification-preference.service: updatePreference: ${err.message}`,
      );
      throw new AppError('common.serverError');
    }
  }

  /**
   * Create a default notification preference
   *
   * @param userId User ID
   * @param type Notification type
   * @returns Created notification preference
   */
  private async createDefaultPreference(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreference> {
    try {
      const defaultPreference = NotificationPreference.createDefault(
        userId,
        type,
      );

      return this.preferenceRepository.create({
        userId,
        type,
        channels: defaultPreference.channels.map((c) => c.toString()),
        enabled: defaultPreference.enabled,
      });
    } catch (err) {
      this.logger.error(
        `notification: notification-preference.service: createDefaultPreference: ${err.message}`,
      );
      throw new AppError('common.serverError');
    }
  }
}

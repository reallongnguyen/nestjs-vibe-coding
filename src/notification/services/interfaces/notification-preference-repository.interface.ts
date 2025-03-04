import {
  NotificationPreference,
  NotificationType,
} from '../../entities/notification-preference.entity';

/**
 * Interface for the notification preference repository
 */
export interface INotificationPreferenceRepository {
  /**
   * Find many notification preferences based on the provided criteria
   *
   * @param options Find options
   * @returns Array of notification preferences
   */
  findMany(options: {
    where?: {
      userId?: string;
      type?: string;
      enabled?: boolean;
    };
    skip?: number;
    take?: number;
    orderBy?: {
      createdAt?: 'asc' | 'desc';
      updatedAt?: 'asc' | 'desc';
    };
  }): Promise<NotificationPreference[]>;

  /**
   * Count notification preferences based on the provided criteria
   *
   * @param where Where conditions
   * @returns Number of notification preferences
   */
  count(where: {
    userId?: string;
    type?: string;
    enabled?: boolean;
  }): Promise<number>;

  /**
   * Create a new notification preference
   *
   * @param data Notification preference data
   * @returns Created notification preference
   */
  create(data: {
    userId: string;
    type: NotificationType;
    channels: string[];
    enabled: boolean;
  }): Promise<NotificationPreference>;

  /**
   * Update an existing notification preference
   *
   * @param id Notification preference ID
   * @param data Update data
   * @returns Updated notification preference
   */
  update(
    id: string,
    data: {
      channels?: string[];
      enabled?: boolean;
    },
  ): Promise<NotificationPreference>;

  /**
   * Find a notification preference by user ID and notification type
   *
   * @param userId User ID
   * @param type Notification type
   * @returns Notification preference or null if not found
   */
  findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreference | null>;

  /**
   * Find all notification preferences for a user
   *
   * @param userId User ID
   * @returns Array of notification preferences
   */
  findByUserId(userId: string): Promise<NotificationPreference[]>;

  /**
   * Delete a notification preference
   *
   * @param id Notification preference ID
   * @returns Deleted notification preference
   */
  delete(id: string): Promise<NotificationPreference>;
}

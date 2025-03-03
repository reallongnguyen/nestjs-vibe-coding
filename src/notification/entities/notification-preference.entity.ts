/**
 * Notification Preference Entity
 *
 * This entity represents a user's notification preferences for different notification types.
 * It follows the domain model pattern and is used to control which notifications a user receives
 * and through which channels.
 */

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationType {
  PROFILE_UPDATE = 'profile_update',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_REPLY = 'comment_reply',
  USER_MENTION = 'user_mention',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

/**
 * Notification Preference Domain Model
 *
 * Represents a user's preference for a specific notification type
 */
export class NotificationPreference {
  /**
   * Unique identifier for the preference
   */
  id: string;

  /**
   * User ID that owns this preference
   */
  userId: string;

  /**
   * Type of notification this preference applies to
   */
  type: NotificationType;

  /**
   * Channels through which the user wants to receive this notification type
   */
  channels: NotificationChannel[];

  /**
   * Whether this notification type is enabled for the user
   */
  enabled: boolean;

  /**
   * When the preference was created
   */
  createdAt: Date;

  /**
   * When the preference was last updated
   */
  updatedAt: Date;

  /**
   * Create a new notification preference with default values
   */
  static createDefault(
    userId: string,
    type: NotificationType,
  ): NotificationPreference {
    const preference = new NotificationPreference();
    preference.userId = userId;
    preference.type = type;
    preference.channels = [NotificationChannel.IN_APP];
    preference.enabled = true;
    preference.createdAt = new Date();
    preference.updatedAt = new Date();
    return preference;
  }
}

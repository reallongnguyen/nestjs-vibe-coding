/**
 * Notification Types and Channels
 *
 * This file contains enum definitions for notification types and channels
 * without any Swagger decorators to avoid circular dependencies.
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
  EMOTION_LIKE = 'emotion_like',
  EMOTION_COMMENT = 'emotion_comment',
  COMMENT_LIKE = 'comment_like',
  COMMENT_REPLY = 'comment_reply',
  USER_MENTION = 'user_mention',
  USER_FOLLOW = 'user_follow',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

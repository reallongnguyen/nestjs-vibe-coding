/**
 * Command interface for creating a notification
 */
export interface CreateNotificationCommand {
  userId: string;
  type: string;
  content: Record<string, unknown>;
  sourceId?: string;
  sourceType?: string;
  priority?: 'low' | 'normal' | 'high';
  groupingKey?: string;
  channels?: string[];
}

/**
 * Command interface for marking a notification as read
 */
export interface MarkNotificationReadCommand {
  notificationId: string;
  userId: string;
}

/**
 * Command interface for marking all notifications as read
 */
export interface MarkAllNotificationsReadCommand {
  userId: string;
}

/**
 * Command interface for updating notification preferences
 */
export interface UpdateNotificationPreferenceCommand {
  userId: string;
  type: string;
  channels: string[];
  enabled: boolean;
}

/**
 * Command interface for delivering a notification
 */
export interface DeliverNotificationCommand {
  notificationId: string;
  userId: string;
  channel: string;
  content: Record<string, unknown>;
}

/**
 * Command interface for updating notification content
 */
export interface UpdateNotificationContentCommand {
  notificationId: string;
  content: Record<string, unknown>;
}

/**
 * Command interface for batch updating notifications
 */
export interface BatchUpdateNotificationsCommand {
  filter: {
    userIds?: string[];
    types?: string[];
    sourceIds?: string[];
    sourceTypes?: string[];
    createdBefore?: Date;
    createdAfter?: Date;
  };
  update: {
    content?: Record<string, unknown>;
    isRead?: boolean;
  };
}

/**
 * Command interface for creating a notification template
 */
export interface CreateNotificationTemplateCommand {
  name: string;
  type: string;
  template: string;
  templateContent?: Record<string, string>;
  version: string;
  description?: string;
}

/**
 * Command interface for updating a notification template
 */
export interface UpdateNotificationTemplateCommand {
  templateId: string;
  template: string;
  templateContent?: Record<string, string>;
  version: string;
  description?: string;
}

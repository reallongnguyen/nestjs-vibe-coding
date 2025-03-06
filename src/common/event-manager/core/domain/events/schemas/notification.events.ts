import { EventSchema } from '../event.interface';

/**
 * Schema for notification created event
 */
interface NotificationCreatedSchema {
  notificationId: string;
  userId: string;
  type: string;
  text: string;
  decorators: Array<Record<string, unknown>>;
  link: string;
  notificationTime: Date;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Schema for notification read event
 */
interface NotificationReadSchema {
  notificationId: string;
  userId: string;
  timestamp: number;
}

/**
 * Schema for notification deleted event
 */
interface NotificationDeletedSchema {
  notificationId: string;
  userId: string;
  timestamp: number;
}

/**
 * Schema for notification preference updated event
 */
interface NotificationPreferenceUpdatedSchema {
  userId: string;
  type: string;
  enabled: boolean;
  channels: string[];
  timestamp: number;
}

/**
 * Schema for notification delivery event
 */
interface NotificationDeliveredSchema {
  notificationId: string;
  userId: string;
  channel: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Schema for notification group created event
 */
interface NotificationGroupCreatedSchema {
  groupId: string;
  userId: string;
  type: string;
  notificationIds: string[];
  timestamp: number;
}

/**
 * Schema for notification group updated event
 */
interface NotificationGroupUpdatedSchema {
  groupId: string;
  userId: string;
  notificationIds: string[];
  timestamp: number;
}

/**
 * Schema for all notifications read event
 */
interface AllNotificationsReadSchema {
  userId: string;
  timestamp: number;
}

/**
 * Schema for notification delivery failed event
 */
interface NotificationDeliveryFailedSchema {
  notificationId: string;
  userId: string;
  channel: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

/**
 * Schema for notification template created event
 */
interface NotificationTemplateCreatedSchema {
  templateId: string;
  type: string;
  name: string;
  version: string;
  timestamp: number;
}

/**
 * Schema for notification template updated event
 */
interface NotificationTemplateUpdatedSchema {
  templateId: string;
  type: string;
  name: string;
  version: string;
  timestamp: number;
}

/**
 * Schema for notification template deleted event
 */
interface NotificationTemplateDeletedSchema {
  templateId: string;
  type: string;
  timestamp: number;
}

/**
 * All notification related event schemas
 */
export const NotificationEventSchemas = {
  NOTIFICATION_CREATED: {
    eventName: 'notification.created',
    schema: {} as NotificationCreatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is created',
  } as EventSchema<NotificationCreatedSchema>,

  NOTIFICATION_UPDATED: {
    eventName: 'notification.updated',
    schema: {} as NotificationCreatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is updated',
  } as EventSchema<NotificationCreatedSchema>,

  NOTIFICATION_READ: {
    eventName: 'notification.read',
    schema: {} as NotificationReadSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is read',
  } as EventSchema<NotificationReadSchema>,

  NOTIFICATION_DELETED: {
    eventName: 'notification.deleted',
    schema: {} as NotificationDeletedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is deleted',
  } as EventSchema<NotificationDeletedSchema>,

  NOTIFICATION_PREFERENCE_UPDATED: {
    eventName: 'notification.preference.updated',
    schema: {} as NotificationPreferenceUpdatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when notification preferences are updated',
  } as EventSchema<NotificationPreferenceUpdatedSchema>,

  NOTIFICATION_DELIVERED: {
    eventName: 'notification.delivered',
    schema: {} as NotificationDeliveredSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is delivered',
  } as EventSchema<NotificationDeliveredSchema>,

  NOTIFICATION_GROUP_CREATED: {
    eventName: 'notification.group.created',
    schema: {} as NotificationGroupCreatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification group is created',
  } as EventSchema<NotificationGroupCreatedSchema>,

  NOTIFICATION_GROUP_UPDATED: {
    eventName: 'notification.group.updated',
    schema: {} as NotificationGroupUpdatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification group is updated',
  } as EventSchema<NotificationGroupUpdatedSchema>,

  ALL_NOTIFICATIONS_READ: {
    eventName: 'notification.all_read',
    schema: {} as AllNotificationsReadSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when all notifications are marked as read',
  } as EventSchema<AllNotificationsReadSchema>,

  NOTIFICATION_DELIVERY_FAILED: {
    eventName: 'notification.delivery_failed',
    schema: {} as NotificationDeliveryFailedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification delivery fails',
  } as EventSchema<NotificationDeliveryFailedSchema>,

  TEMPLATE_CREATED: {
    eventName: 'notification.template.created',
    schema: {} as NotificationTemplateCreatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is created',
  } as EventSchema<NotificationTemplateCreatedSchema>,

  TEMPLATE_UPDATED: {
    eventName: 'notification.template.updated',
    schema: {} as NotificationTemplateUpdatedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is updated',
  } as EventSchema<NotificationTemplateUpdatedSchema>,

  TEMPLATE_DELETED: {
    eventName: 'notification.template.deleted',
    schema: {} as NotificationTemplateDeletedSchema,
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is deleted',
  } as EventSchema<NotificationTemplateDeletedSchema>,
} as const;

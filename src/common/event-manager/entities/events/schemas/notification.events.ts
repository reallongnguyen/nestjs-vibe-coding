import {
  IsArray,
  IsBoolean,
  IsObject,
  IsString,
  IsUUID,
} from 'class-validator';
import { EventSchema } from '../event.interface';

/**
 * Payload for notification created events
 */
export class NotificationCreatedPayload {
  @IsUUID()
  notificationId: string;

  @IsUUID()
  userId: string;

  @IsString()
  type: string;

  @IsObject()
  content: Record<string, unknown>;
}

/**
 * Payload for notification read events
 */
export class NotificationReadPayload {
  @IsUUID()
  notificationId: string;

  @IsUUID()
  userId: string;
}

/**
 * Payload for all notifications read events
 */
export class AllNotificationsReadPayload {
  @IsUUID()
  userId: string;
}

/**
 * Payload for notification preference updated events
 */
export class NotificationPreferenceUpdatedPayload {
  @IsUUID()
  userId: string;

  @IsString()
  type: string;

  @IsArray()
  @IsString({ each: true })
  channels: string[];

  @IsBoolean()
  enabled: boolean;
}

/**
 * Payload for notification delivered events
 */
export class NotificationDeliveredPayload {
  @IsUUID()
  notificationId: string;

  @IsUUID()
  userId: string;

  @IsString()
  channel: string;
}

/**
 * Payload for notification delivery failed events
 */
export class NotificationDeliveryFailedPayload {
  @IsUUID()
  notificationId: string;

  @IsUUID()
  userId: string;

  @IsString()
  channel: string;

  @IsString()
  error: string;
}

/**
 * Payload for notification template created events
 */
export class NotificationTemplateCreatedPayload {
  @IsUUID()
  templateId: string;

  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  version: string;
}

/**
 * Payload for notification template updated events
 */
export class NotificationTemplateUpdatedPayload {
  @IsUUID()
  templateId: string;

  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  version: string;
}

/**
 * Payload for notification template deleted events
 */
export class NotificationTemplateDeletedPayload {
  @IsUUID()
  templateId: string;

  @IsString()
  type: string;
}

/**
 * Event schemas for notification events
 */
export const NotificationEventSchemas = {
  NOTIFICATION_CREATED: {
    eventName: 'notification.created',
    schema: new NotificationCreatedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is created',
  } as EventSchema<NotificationCreatedPayload>,

  NOTIFICATION_READ: {
    eventName: 'notification.read',
    schema: new NotificationReadPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is read',
  } as EventSchema<NotificationReadPayload>,

  ALL_NOTIFICATIONS_READ: {
    eventName: 'notification.all_read',
    schema: new AllNotificationsReadPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when all notifications for a user are marked as read',
  } as EventSchema<AllNotificationsReadPayload>,

  NOTIFICATION_PREFERENCE_UPDATED: {
    eventName: 'notification.preference_updated',
    schema: new NotificationPreferenceUpdatedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification preference is updated',
  } as EventSchema<NotificationPreferenceUpdatedPayload>,

  NOTIFICATION_DELIVERED: {
    eventName: 'notification.delivered',
    schema: new NotificationDeliveredPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification is delivered',
  } as EventSchema<NotificationDeliveredPayload>,

  NOTIFICATION_DELIVERY_FAILED: {
    eventName: 'notification.delivery_failed',
    schema: new NotificationDeliveryFailedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification delivery fails',
  } as EventSchema<NotificationDeliveryFailedPayload>,

  NOTIFICATION_TEMPLATE_CREATED: {
    eventName: 'notification.template.created',
    schema: new NotificationTemplateCreatedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is created',
  } as EventSchema<NotificationTemplateCreatedPayload>,

  NOTIFICATION_TEMPLATE_UPDATED: {
    eventName: 'notification.template.updated',
    schema: new NotificationTemplateUpdatedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is updated',
  } as EventSchema<NotificationTemplateUpdatedPayload>,

  NOTIFICATION_TEMPLATE_DELETED: {
    eventName: 'notification.template.deleted',
    schema: new NotificationTemplateDeletedPayload(),
    version: '1.0.0',
    module: 'notification',
    description: 'Emitted when a notification template is deleted',
  } as EventSchema<NotificationTemplateDeletedPayload>,
} as const;

export type NotificationEventName =
  (typeof NotificationEventSchemas)[keyof typeof NotificationEventSchemas]['eventName'];

import { v4 as uuid } from 'uuid';
import { BaseEvent } from './base.event';
import {
  NotificationEventSchemas,
  NotificationCreatedPayload,
  NotificationReadPayload,
  AllNotificationsReadPayload,
  NotificationPreferenceUpdatedPayload,
  NotificationDeliveredPayload,
  NotificationDeliveryFailedPayload,
  NotificationTemplateCreatedPayload,
  NotificationTemplateUpdatedPayload,
  NotificationTemplateDeletedPayload,
} from './schemas/notification.events';

/**
 * Event emitted when a notification is created
 */
export class NotificationCreatedEvent extends BaseEvent<NotificationCreatedPayload> {
  constructor(
    private readonly notificationId: string,
    private readonly userId: string,
    private readonly type: string,
    private readonly content: Record<string, unknown>,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_CREATED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationCreatedPayload {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      type: this.type,
      content: this.content,
    };
  }
}

/**
 * Event emitted when a notification is read
 */
export class NotificationReadEvent extends BaseEvent<NotificationReadPayload> {
  constructor(
    private readonly notificationId: string,
    private readonly userId: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_READ, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationReadPayload {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
    };
  }
}

/**
 * Event emitted when all notifications for a user are marked as read
 */
export class AllNotificationsReadEvent extends BaseEvent<AllNotificationsReadPayload> {
  constructor(private readonly userId: string) {
    super(NotificationEventSchemas.ALL_NOTIFICATIONS_READ, {
      correlationId: uuid(),
    });
  }

  toJSON(): AllNotificationsReadPayload {
    return {
      userId: this.userId,
    };
  }
}

/**
 * Event emitted when a notification preference is updated
 */
export class NotificationPreferenceUpdatedEvent extends BaseEvent<NotificationPreferenceUpdatedPayload> {
  constructor(
    private readonly userId: string,
    private readonly type: string,
    private readonly channels: string[],
    private readonly enabled: boolean,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_PREFERENCE_UPDATED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationPreferenceUpdatedPayload {
    return {
      userId: this.userId,
      type: this.type,
      channels: this.channels,
      enabled: this.enabled,
    };
  }
}

/**
 * Event emitted when a notification is delivered
 */
export class NotificationDeliveredEvent extends BaseEvent<NotificationDeliveredPayload> {
  constructor(
    private readonly notificationId: string,
    private readonly userId: string,
    private readonly channel: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_DELIVERED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationDeliveredPayload {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      channel: this.channel,
    };
  }
}

/**
 * Event emitted when a notification delivery fails
 */
export class NotificationDeliveryFailedEvent extends BaseEvent<NotificationDeliveryFailedPayload> {
  constructor(
    private readonly notificationId: string,
    private readonly userId: string,
    private readonly channel: string,
    private readonly error: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_DELIVERY_FAILED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationDeliveryFailedPayload {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      channel: this.channel,
      error: this.error,
    };
  }
}

/**
 * Event emitted when a notification template is created
 */
export class NotificationTemplateCreatedEvent extends BaseEvent<NotificationTemplateCreatedPayload> {
  constructor(
    private readonly templateId: string,
    private readonly type: string,
    private readonly name: string,
    private readonly version: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_TEMPLATE_CREATED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationTemplateCreatedPayload {
    return {
      templateId: this.templateId,
      type: this.type,
      name: this.name,
      version: this.version,
    };
  }
}

/**
 * Event emitted when a notification template is updated
 */
export class NotificationTemplateUpdatedEvent extends BaseEvent<NotificationTemplateUpdatedPayload> {
  constructor(
    private readonly templateId: string,
    private readonly type: string,
    private readonly name: string,
    private readonly version: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_TEMPLATE_UPDATED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationTemplateUpdatedPayload {
    return {
      templateId: this.templateId,
      type: this.type,
      name: this.name,
      version: this.version,
    };
  }
}

/**
 * Event emitted when a notification template is deleted
 */
export class NotificationTemplateDeletedEvent extends BaseEvent<NotificationTemplateDeletedPayload> {
  constructor(
    private readonly templateId: string,
    private readonly type: string,
  ) {
    super(NotificationEventSchemas.NOTIFICATION_TEMPLATE_DELETED, {
      correlationId: uuid(),
    });
  }

  toJSON(): NotificationTemplateDeletedPayload {
    return {
      templateId: this.templateId,
      type: this.type,
    };
  }
}

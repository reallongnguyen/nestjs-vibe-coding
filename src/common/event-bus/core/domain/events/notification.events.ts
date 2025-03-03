import { BaseEvent } from './base.event';

/**
 * Event emitted when a notification is created
 */
export class NotificationCreatedEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly content: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.created';
  }

  toJSON(): unknown {
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
export class NotificationReadEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.read';
  }

  toJSON(): unknown {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
    };
  }
}

/**
 * Event emitted when all notifications for a user are marked as read
 */
export class AllNotificationsReadEvent extends BaseEvent {
  constructor(
    public readonly userId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.all_read';
  }

  toJSON(): unknown {
    return {
      userId: this.userId,
    };
  }
}

/**
 * Event emitted when a notification preference is updated
 */
export class NotificationPreferenceUpdatedEvent extends BaseEvent {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly channels: string[],
    public readonly enabled: boolean,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.preference_updated';
  }

  toJSON(): unknown {
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
export class NotificationDeliveredEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.delivered';
  }

  toJSON(): unknown {
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
export class NotificationDeliveryFailedEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly error: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.delivery_failed';
  }

  toJSON(): unknown {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      channel: this.channel,
      error: this.error,
    };
  }
}

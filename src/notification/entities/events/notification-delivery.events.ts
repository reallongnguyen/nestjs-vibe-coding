/**
 * Notification delivery events
 * These events are emitted during the notification delivery process
 */

/**
 * Base interface for all notification delivery events
 */
export interface NotificationDeliveryEvent {
  notificationId: string;
  userId: string;
  channel: string;
  timestamp: number;
}

/**
 * Event emitted when a notification delivery is attempted
 */
export class NotificationDeliveryAttemptEvent
  implements NotificationDeliveryEvent
{
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'notification.attempt';
}

/**
 * Event emitted when a notification is successfully delivered
 */
export class NotificationDeliverySuccessEvent
  implements NotificationDeliveryEvent
{
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly latencyMs: number,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'notification.success';
}

/**
 * Event emitted when a notification delivery fails
 */
export class NotificationDeliveryFailureEvent
  implements NotificationDeliveryEvent
{
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly error: Error,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'notification.failure';
}

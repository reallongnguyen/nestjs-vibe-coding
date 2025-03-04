/**
 * Notification Domain Model
 *
 * This file contains the domain models for the notification system following DDD principles.
 * It separates the domain logic from the persistence model (entity).
 */
import {
  NotificationObject,
  NotificationDecorator,
  Notification,
} from './notification.entity';
import { NotificationType } from './notification-preference.entity';

/**
 * Notification Domain Model
 *
 * Represents a notification in the system with all its business rules and behaviors
 */
export class NotificationDomain {
  /**
   * Unique identifier for the notification
   */
  id: string;

  /**
   * Unique key for grouping similar notifications
   */
  key: string;

  /**
   * Type of notification
   */
  type: NotificationType;

  /**
   * User ID that should receive this notification
   */
  userId: string;

  /**
   * Subjects that triggered the notification (e.g., users who liked a post)
   */
  subjects: NotificationObject[];

  /**
   * Count of subjects for grouped notifications
   */
  subjectCount: number;

  /**
   * Direct object of the notification (e.g., the post being liked)
   */
  diObject?: NotificationObject;

  /**
   * Indirect object of the notification (e.g., the comment being liked)
   */
  inObject?: NotificationObject;

  /**
   * Parent object of the notification (e.g., the post containing the comment)
   */
  prObject?: NotificationObject;

  /**
   * Human-readable notification message
   */
  text: string;

  /**
   * Text decorations for rich notification content
   */
  decorators: NotificationDecorator[];

  /**
   * URL associated with the notification
   */
  link?: string;

  /**
   * Time when the notification should be shown
   */
  notificationTime: Date;

  /**
   * When the user viewed the notification
   */
  viewedAt?: Date;

  /**
   * When the notification was created
   */
  createdAt: Date;

  /**
   * When the notification was last updated
   */
  updatedAt: Date;

  /**
   * Additional metadata for the notification
   */
  metadata?: Record<string, unknown>;

  /**
   * Create a domain model from an entity
   *
   * @param entity The notification entity from the database
   * @returns A new NotificationDomain instance
   */
  static fromEntity(entity: Notification): NotificationDomain {
    const domain = new NotificationDomain();

    domain.id = entity.id;
    domain.key = entity.key;
    domain.type = entity.type as NotificationType;
    domain.userId = entity.userId;
    domain.subjects = entity.subjects;
    domain.subjectCount = entity.subjectCount;
    domain.diObject = entity.diObject;
    domain.inObject = entity.inObject;
    domain.prObject = entity.prObject;
    domain.text = entity.text;
    domain.decorators = entity.decorators;
    domain.link = entity.link;
    domain.notificationTime = entity.notificationTime;
    domain.viewedAt = entity.viewedAt;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.metadata = entity.metadata;

    return domain;
  }

  /**
   * Check if the notification has been viewed
   */
  isViewed(): boolean {
    return !!this.viewedAt;
  }

  /**
   * Mark the notification as viewed
   */
  markAsViewed(): void {
    this.viewedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if the notification can be grouped with another notification
   *
   * @param other The other notification to check for grouping compatibility
   * @param thresholdSeconds The time threshold in seconds for grouping
   */
  canGroupWith(other: NotificationDomain, thresholdSeconds: number): boolean {
    if (this.key !== other.key) {
      return false;
    }

    if (this.userId !== other.userId) {
      return false;
    }

    if (this.isViewed()) {
      return false;
    }

    const timeDiffMs = Math.abs(
      this.notificationTime.getTime() - other.notificationTime.getTime(),
    );
    const thresholdMs = thresholdSeconds * 1000;

    return timeDiffMs <= thresholdMs;
  }

  /**
   * Merge this notification with another notification
   *
   * @param other The other notification to merge with
   */
  mergeWith(other: NotificationDomain): void {
    // Create a map of existing subjects to avoid duplicates
    const subjectMap = new Map<string, NotificationObject>();

    // Add existing subjects to the map
    this.subjects.forEach((subject) => {
      subjectMap.set(subject.id, subject);
    });

    // Add new subjects if they don't already exist
    other.subjects.forEach((subject) => {
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, subject);
      }
    });

    // Update the subjects array and count
    this.subjects = Array.from(subjectMap.values());
    this.subjectCount = this.subjects.length;

    // Update the notification time to the most recent
    if (other.notificationTime > this.notificationTime) {
      this.notificationTime = other.notificationTime;
    }

    // Update the updatedAt timestamp
    this.updatedAt = new Date();
  }
}

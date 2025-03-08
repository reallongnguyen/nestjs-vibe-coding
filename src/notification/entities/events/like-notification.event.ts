import { NotificationObject } from '../notification.entity';
import { NotificationType } from '../notification-preference.entity';

/**
 * Event emitted when a user likes content
 */
export class LikeNotificationEvent {
  constructor(
    public readonly userId: string,
    public readonly contentId: string,
    public readonly contentType: string,
    public readonly likedByUserId: string,
    public readonly likedByUserName: string,
    public readonly likedByUserAvatar?: string,
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'notification.like.created';

  /**
   * Convert to notification input
   */
  toNotificationInput() {
    const subject: NotificationObject = {
      id: this.likedByUserId,
      name: this.likedByUserName,
      type: 'USER',
      image: this.likedByUserAvatar,
    };

    const diObject: NotificationObject = {
      id: this.contentId,
      name: '',
      type: this.contentType,
    };

    return {
      key: `like:${this.contentType}:${this.contentId}`,
      type: NotificationType.POST_LIKE,
      userId: this.userId,
      subjects: [subject],
      subjectCount: 1,
      diObject,
      link: `/${this.contentType.toLowerCase()}/${this.contentId}`,
    };
  }
}

import { BaseEvent, SocialEventSchemas } from 'src/common/event-manager';
import { v4 as uuid } from 'uuid';

/**
 * Event emitted when a user unfollows another user
 */
export class UserUnfollowedEvent extends BaseEvent<
  typeof SocialEventSchemas.USER_UNFOLLOWED.schema
> {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly timestamp: Date,
  ) {
    super(SocialEventSchemas.USER_UNFOLLOWED, {
      correlationId: uuid(),
    });
  }

  /**
   * Convert event to JSON payload
   * @returns Event payload
   */
  toJSON() {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      timestamp: this.timestamp,
    };
  }
}

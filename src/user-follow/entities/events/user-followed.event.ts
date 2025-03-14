/**
 * Re-export UserFollowedEvent from common module with adapter pattern
 * This file exists for backward compatibility
 */
import { BaseEvent, SocialEventSchemas } from 'src/common/event-manager';
import { v4 as uuid } from 'uuid';

/**
 * Event emitted when a user follows another user
 */
export class UserFollowedEvent extends BaseEvent<
  typeof SocialEventSchemas.USER_FOLLOWED.schema
> {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerName: string,
    public readonly followerAvatar: string | null,
    public readonly timestamp: Date,
  ) {
    super(SocialEventSchemas.USER_FOLLOWED, {
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
      followerName: this.followerName,
      followingId: this.followingId,
      followerAvatar: this.followerAvatar || undefined,
      timestamp: this.timestamp,
    };
  }
}

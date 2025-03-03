/**
 * Re-export UserFollowedEvent from common module with adapter pattern
 * This file exists for backward compatibility
 */
import { BaseEvent } from 'src/common';
import { UserFollowedEvent as CommonUserFollowedEvent } from 'src/common/event-bus/core/domain/events/social-interaction.events';

/**
 * @deprecated Use the common implementation from src/common/event-bus/core/domain/events/social-interaction.events
 */
export class UserFollowedEvent extends BaseEvent {
  static readonly eventName = 'user.followed';

  // Internal reference to the common implementation
  private readonly commonEvent: CommonUserFollowedEvent;

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerName: string,
    public readonly followerAvatar: string | null,
    public readonly timestamp: Date,
  ) {
    super();
    // Create the common implementation internally
    this.commonEvent = new CommonUserFollowedEvent(
      followerId,
      followerName,
      followingId,
      followerAvatar || undefined,
      timestamp.getTime(),
      {
        occurredOn: timestamp,
      },
    );
  }

  eventName(): string {
    return UserFollowedEvent.eventName;
  }

  toJSON() {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      followerName: this.followerName,
      followerAvatar: this.followerAvatar,
      timestamp: this.timestamp,
    };
  }
}

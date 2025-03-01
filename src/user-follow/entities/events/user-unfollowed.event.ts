import { BaseEvent } from 'src/common';

export class UserUnfollowedEvent extends BaseEvent {
  static readonly eventName = 'user.unfollowed';

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly timestamp: Date,
  ) {
    super();
  }

  eventName(): string {
    return UserUnfollowedEvent.eventName;
  }

  toJSON() {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      timestamp: this.timestamp,
    };
  }
}

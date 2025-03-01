import { BaseEvent } from 'src/common';

export class UserFollowedEvent extends BaseEvent {
  static readonly eventName = 'user.followed';

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerName: string,
    public readonly followerAvatar: string | null,
    public readonly timestamp: Date,
  ) {
    super();
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

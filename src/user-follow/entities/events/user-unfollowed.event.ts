export class UserUnfollowedEvent {
  static readonly eventName = 'user.unfollowed';

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly timestamp: Date,
  ) {}

  toJSON() {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      timestamp: this.timestamp,
    };
  }
}

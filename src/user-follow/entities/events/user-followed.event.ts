export class UserFollowedEvent {
  static readonly eventName = 'user.followed';

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerName: string,
    public readonly followerAvatar: string | null,
    public readonly timestamp: Date,
  ) {}

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

/**
 * Social interaction events
 * These events are emitted when social interactions occur in the platform
 */

/**
 * Base interface for all social interaction events
 */
export interface SocialInteractionEvent {
  timestamp: number;
}

/**
 * Event emitted when a post is liked
 */
export class PostLikedEvent implements SocialInteractionEvent {
  constructor(
    public readonly postId: string,
    public readonly postOwnerId: string,
    public readonly likerId: string,
    public readonly likerName: string,
    public readonly likerAvatar?: string,
    public readonly postTitle?: string,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'post.liked';
}

/**
 * Event emitted when a comment is added to a post
 */
export class CommentAddedEvent implements SocialInteractionEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
    public readonly postOwnerId: string,
    public readonly commenterId: string,
    public readonly commenterName: string,
    public readonly commentText: string,
    public readonly postTitle?: string,
    public readonly commenterAvatar?: string,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'comment.added';
}

/**
 * Event emitted when a user is mentioned in content
 */
export class UserMentionedEvent implements SocialInteractionEvent {
  constructor(
    public readonly contentId: string,
    public readonly contentType: 'post' | 'comment',
    public readonly mentionedUserId: string,
    public readonly mentioningUserId: string,
    public readonly mentioningUserName: string,
    public readonly contentText: string,
    public readonly contentTitle?: string,
    public readonly mentioningUserAvatar?: string,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'user.mentioned';
}

/**
 * Event emitted when a user follows another user
 */
export class UserFollowedEvent implements SocialInteractionEvent {
  constructor(
    public readonly followerId: string,
    public readonly followerName: string,
    public readonly followingId: string,
    public readonly followerAvatar?: string,
    public readonly timestamp: number = Date.now(),
  ) {}

  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'user.followed';
}

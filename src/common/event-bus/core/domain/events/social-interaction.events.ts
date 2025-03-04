import { BaseEvent } from './base.event';

/**
 * Event emitted when a post is liked
 */
export class PostLikedEvent extends BaseEvent {
  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'post.liked';

  constructor(
    public readonly postId: string,
    public readonly postOwnerId: string,
    public readonly likerId: string,
    public readonly likerName: string,
    public readonly likerAvatar?: string,
    public readonly postTitle?: string,
    public readonly timestamp: number = Date.now(),
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return PostLikedEvent.EVENT_NAME;
  }

  toJSON(): unknown {
    return {
      postId: this.postId,
      postOwnerId: this.postOwnerId,
      likerId: this.likerId,
      likerName: this.likerName,
      likerAvatar: this.likerAvatar,
      postTitle: this.postTitle,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Event emitted when a comment is added to a post
 */
export class CommentAddedEvent extends BaseEvent {
  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'comment.added';

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
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return CommentAddedEvent.EVENT_NAME;
  }

  toJSON(): unknown {
    return {
      commentId: this.commentId,
      postId: this.postId,
      postOwnerId: this.postOwnerId,
      commenterId: this.commenterId,
      commenterName: this.commenterName,
      commentText: this.commentText,
      postTitle: this.postTitle,
      commenterAvatar: this.commenterAvatar,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Event emitted when a user is mentioned in content
 */
export class UserMentionedEvent extends BaseEvent {
  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'user.mentioned';

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
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return UserMentionedEvent.EVENT_NAME;
  }

  toJSON(): unknown {
    return {
      contentId: this.contentId,
      contentType: this.contentType,
      mentionedUserId: this.mentionedUserId,
      mentioningUserId: this.mentioningUserId,
      mentioningUserName: this.mentioningUserName,
      contentText: this.contentText,
      contentTitle: this.contentTitle,
      mentioningUserAvatar: this.mentioningUserAvatar,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Event emitted when a user follows another user
 */
export class UserFollowedEvent extends BaseEvent {
  /**
   * Event name for EventEmitter
   */
  static readonly EVENT_NAME = 'user.followed';

  constructor(
    public readonly followerId: string,
    public readonly followerName: string,
    public readonly followingId: string,
    public readonly followerAvatar?: string,
    public readonly timestamp: number = Date.now(),
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return UserFollowedEvent.EVENT_NAME;
  }

  toJSON(): unknown {
    return {
      followerId: this.followerId,
      followerName: this.followerName,
      followingId: this.followingId,
      followerAvatar: this.followerAvatar,
      timestamp: this.timestamp,
    };
  }
}

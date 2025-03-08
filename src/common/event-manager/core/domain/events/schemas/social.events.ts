import { IsEnum, IsString, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';

export enum ContentType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  EMOTION = 'EMOTION',
}

/**
 * Schema for post like event
 */
interface PostLikedSchema {
  postId: string;
  userId: string;
  postOwnerId: string;
  likerId: string;
  likerName: string;
  likerAvatar?: string;
  postTitle: string;
  postType: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for post unlike event
 */
interface PostUnlikedSchema {
  postId: string;
  userId: string;
  postOwnerId: string;
  postType: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for comment like event
 */
interface CommentLikedSchema {
  commentId: string;
  postId: string;
  userId: string;
  commentOwnerId: string;
  likerId: string;
  likerName: string;
  likerAvatar?: string;
  commentContent: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for comment unlike event
 */
interface CommentUnlikedSchema {
  commentId: string;
  postId: string;
  userId: string;
  commentOwnerId: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for bookmark event
 */
interface BookmarkCreatedSchema {
  userId: string;
  contentId: string;
  contentType: ContentType;
  contentOwnerId: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for bookmark removal event
 */
interface BookmarkRemovedSchema {
  userId: string;
  contentId: string;
  contentType: ContentType;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for feed content processed event
 */
interface FeedContentProcessedSchema {
  contentId: string;
  contentType: ContentType;
  contentOwnerId: string;
  score: number;
  factors: Record<string, number>;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for user follow event
 */
interface UserFollowedSchema {
  followerId: string;
  followerName: string;
  followingId: string;
  followingName: string;
  followerAvatar?: string;
  followingAvatar?: string;
  timestamp: number;
}

/**
 * Schema for user unfollow event
 */
interface UserUnfollowedSchema {
  followerId: string;
  followingId: string;
  timestamp: number;
}

/**
 * Schema for content view event
 */
interface ContentViewedSchema {
  contentId: string;
  contentType: ContentType;
  contentOwnerId: string;
  viewDuration: number;
  isComplete: boolean;
  viewerHash: string;
  viewerId?: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for content share event
 */
interface ContentSharedSchema {
  contentId: string;
  contentType: ContentType;
  userId: string;
  contentOwnerId: string;
  shareTarget: string;
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for emotion liked event
 */
interface EmotionLikedSchema {
  emotionId: string;
  userId: string;
  likerId: string;
  likerName: string;
  likerAvatar?: string;
  timestamp: number;
}

/**
 * Schema for emotion unliked event
 */
interface EmotionUnlikedSchema {
  emotionId: string;
  userId: string;
  emotionOwnerId: string;
  emotionType: string;
  spaceId?: string;
  timestamp: number;
}

export class LikeCreatedPayload {
  @IsUUID()
  actorId: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsUUID()
  contentId: string;

  @IsUUID()
  targetUserId: string;
}

export class LikeDeletedPayload {
  @IsUUID()
  actorId: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsUUID()
  contentId: string;

  @IsUUID()
  targetUserId: string;
}

/**
 * Schema for comment events
 */
export class CommentEventSchema {
  @IsUUID()
  actorId: string;

  @IsEnum(ContentType)
  contentType: ContentType.POST | ContentType.EMOTION;

  @IsUUID()
  contentId: string;

  @IsUUID()
  commentId: string;

  @IsUUID()
  targetUserId: string;

  @IsString()
  preview?: string;
}

/**
 * Schema for follow events
 */
interface FollowEventSchema {
  followerId: string;
  followingId: string;
}

/**
 * All social related event schemas
 */
export const SocialEventSchemas = {
  POST_LIKED: {
    eventName: 'social.post.liked',
    schema: {} as PostLikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user likes a post',
  } as EventSchema<PostLikedSchema>,

  POST_UNLIKED: {
    eventName: 'social.post.unliked',
    schema: {} as PostUnlikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unlikes a post',
  } as EventSchema<PostUnlikedSchema>,

  COMMENT_LIKED: {
    eventName: 'social.comment.liked',
    schema: {} as CommentLikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user likes a comment',
  } as EventSchema<CommentLikedSchema>,

  COMMENT_UNLIKED: {
    eventName: 'social.comment.unliked',
    schema: {} as CommentUnlikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unlikes a comment',
  } as EventSchema<CommentUnlikedSchema>,

  BOOKMARK_CREATED: {
    eventName: 'social.bookmark.created',
    schema: {} as BookmarkCreatedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user bookmarks content',
  } as EventSchema<BookmarkCreatedSchema>,

  BOOKMARK_REMOVED: {
    eventName: 'social.bookmark.removed',
    schema: {} as BookmarkRemovedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user removes a bookmark',
  } as EventSchema<BookmarkRemovedSchema>,

  FEED_CONTENT_PROCESSED: {
    eventName: 'social.feed.content.processed',
    schema: {} as FeedContentProcessedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when content is processed for feed distribution',
  } as EventSchema<FeedContentProcessedSchema>,

  USER_FOLLOWED: {
    eventName: 'social.user.followed',
    schema: {} as UserFollowedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user follows another user',
  } as EventSchema<UserFollowedSchema>,

  USER_UNFOLLOWED: {
    eventName: 'social.user.unfollowed',
    schema: {} as UserUnfollowedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unfollows another user',
  } as EventSchema<UserUnfollowedSchema>,

  CONTENT_VIEWED: {
    eventName: 'social.content.viewed',
    schema: {} as ContentViewedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user views content',
  } as EventSchema<ContentViewedSchema>,

  CONTENT_SHARED: {
    eventName: 'social.content.shared',
    schema: {} as ContentSharedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user shares content',
  } as EventSchema<ContentSharedSchema>,

  EMOTION_LIKED: {
    eventName: 'social.emotion.liked',
    schema: {} as EmotionLikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user likes an emotion',
  } as EventSchema<EmotionLikedSchema>,

  EMOTION_UNLIKED: {
    eventName: 'social.emotion.unliked',
    schema: {} as EmotionUnlikedSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unlikes an emotion',
  } as EventSchema<EmotionUnlikedSchema>,

  LIKE_CREATED: {
    eventName: 'social.like.created',
    schema: new LikeCreatedPayload(),
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user likes content',
  } as EventSchema<LikeCreatedPayload>,

  LIKE_DELETED: {
    eventName: 'social.like.deleted',
    schema: new LikeDeletedPayload(),
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unlikes content',
  } as EventSchema<LikeDeletedPayload>,

  COMMENT_CREATED: {
    eventName: 'social.comment.created',
    schema: new CommentEventSchema(),
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user comments on content',
  } as EventSchema<CommentEventSchema>,

  COMMENT_REPLIED: {
    eventName: 'social.comment.replied',
    schema: new CommentEventSchema(),
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user replies to a comment',
  } as EventSchema<CommentEventSchema>,

  FOLLOW_CREATED: {
    eventName: 'social.follow.created',
    schema: {} as FollowEventSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user follows another user',
  } as EventSchema<FollowEventSchema>,

  FOLLOW_DELETED: {
    eventName: 'social.follow.deleted',
    schema: {} as FollowEventSchema,
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when a user unfollows another user',
  } as EventSchema<FollowEventSchema>,
} as const;

import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';

export enum ContentType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  EMOTION = 'EMOTION',
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

export class BaseViewEventPayload {
  @IsUUID()
  contentId: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsString()
  viewerHash: string;

  @IsOptional()
  @IsString()
  viewerId?: string;

  @IsDate()
  timestamp: Date;
}

export class ContentViewedEventPayload extends BaseViewEventPayload {}

/**
 * All social related event schemas
 */
export const SocialEventSchemas = {
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

  CONTENT_VIEWED: {
    eventName: 'social.content.viewed',
    schema: new ContentViewedEventPayload(),
    version: '1.0.0',
    module: 'social',
    description: 'Emitted when content is viewed by a user or anonymous viewer',
  } satisfies EventSchema<ContentViewedEventPayload>,
} as const;

export type SocialEventName =
  (typeof SocialEventSchemas)[keyof typeof SocialEventSchemas]['eventName'];

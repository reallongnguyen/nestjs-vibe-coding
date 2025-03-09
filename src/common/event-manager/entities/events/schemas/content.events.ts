import { IsArray, IsString, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';

/**
 * Base payload for post events
 */
class BasePostEventPayload {
  @IsUUID()
  draftId: string;

  @IsUUID()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsArray()
  @IsUUID('4', { each: true })
  topics: string[];
}

/**
 * Payload for post published event
 */
class PostPublishedEventPayload extends BasePostEventPayload {
  @IsUUID()
  publishedId: string;
}

/**
 * Payload for post updated event
 */
class PostUpdatedEventPayload extends BasePostEventPayload {
  @IsUUID()
  postId: string;
}

/**
 * All content related event schemas
 */
export const ContentEventSchemas = {
  POST_PUBLISHED: {
    eventName: 'content.post.published',
    schema: new PostPublishedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a post is published',
  } as EventSchema<PostPublishedEventPayload>,

  POST_UPDATED: {
    eventName: 'content.post.updated',
    schema: new PostUpdatedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a post is updated',
  } as EventSchema<PostUpdatedEventPayload>,
} as const;

import {
  IsArray,
  IsString,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
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
 * Payload for post deleted event
 */
class PostDeletedEventPayload {
  @IsUUID()
  postId: string;

  @IsUUID()
  userId: string;
}

/**
 * Payload for tweet created event
 */
class TweetCreatedEventPayload {
  @IsUUID()
  tweetId: string;

  @IsUUID()
  userId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for tweet updated event
 */
class TweetUpdatedEventPayload {
  @IsUUID()
  tweetId: string;

  @IsUUID()
  userId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  timestamp: number;

  @IsBoolean()
  isArchived: boolean;
}

/**
 * Payload for tweet deleted event
 */
class TweetDeletedEventPayload {
  @IsUUID()
  tweetId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for tweet viewed event
 */
class TweetViewedEventPayload {
  @IsUUID()
  tweetId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for story created event
 */
class StoryCreatedEventPayload {
  @IsUUID()
  storyId: string;

  @IsUUID()
  userId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  rootId?: string;

  @IsNumber()
  chainPosition: number;

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for story continued event
 */
class StoryContinuedEventPayload {
  @IsUUID()
  storyId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  parentId: string;

  @IsUUID()
  rootId: string;

  @IsNumber()
  chainPosition: number;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for story forked event
 */
class StoryForkedEventPayload {
  @IsUUID()
  storyId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  sourceStoryId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  timestamp: number;
}

/**
 * Payload for story viewed event
 */
class StoryViewedEventPayload {
  @IsUUID()
  storyId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  timestamp: number;
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

  DRAFT_POST_DELETED: {
    eventName: 'content.draft-post.deleted',
    schema: new PostDeletedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a draft post is deleted',
  } as EventSchema<PostDeletedEventPayload>,

  PUBLISHED_POST_DELETED: {
    eventName: 'content.published-post.deleted',
    schema: new PostDeletedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a published post is deleted',
  } as EventSchema<PostDeletedEventPayload>,

  TWEET_CREATED: {
    eventName: 'content.tweet.created',
    schema: new TweetCreatedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a tweet is created',
  } as EventSchema<TweetCreatedEventPayload>,

  TWEET_UPDATED: {
    eventName: 'content.tweet.updated',
    schema: new TweetUpdatedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a tweet is updated',
  } as EventSchema<TweetUpdatedEventPayload>,

  TWEET_DELETED: {
    eventName: 'content.tweet.deleted',
    schema: new TweetDeletedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a tweet is deleted',
  } as EventSchema<TweetDeletedEventPayload>,

  TWEET_VIEWED: {
    eventName: 'content.tweet.viewed',
    schema: new TweetViewedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a tweet is viewed',
  } as EventSchema<TweetViewedEventPayload>,

  STORY_CREATED: {
    eventName: 'content.story.created',
    schema: new StoryCreatedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a story is created',
  } as EventSchema<StoryCreatedEventPayload>,

  STORY_CONTINUED: {
    eventName: 'content.story.continued',
    schema: new StoryContinuedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a story is continued',
  } as EventSchema<StoryContinuedEventPayload>,

  STORY_FORKED: {
    eventName: 'content.story.forked',
    schema: new StoryForkedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a story is forked',
  } as EventSchema<StoryForkedEventPayload>,

  STORY_VIEWED: {
    eventName: 'content.story.viewed',
    schema: new StoryViewedEventPayload(),
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a story is viewed',
  } as EventSchema<StoryViewedEventPayload>,

  DELETE_IMAGE: {
    eventName: 'content.image.delete',
    schema: { imageUrl: '' },
    version: '1.0.0',
    module: 'content',
    description: 'Command to delete an image',
  } as EventSchema<{ imageUrl: string }>,
} as const;

import { EventSchema } from '../event.interface';

/**
 * Schema for draft creation event
 */
interface DraftCreatedSchema {
  draftId: string;
  userId: string;
  title: string;
  topicIds: string[];
  timestamp: number;
}

/**
 * Schema for draft update event
 */
interface DraftUpdatedSchema {
  draftId: string;
  userId: string;
  title?: string;
  topicIds?: string[];
  updatedFields: string[];
  timestamp: number;
}

/**
 * Schema for draft deletion event
 */
interface DraftDeletedSchema {
  draftId: string;
  userId: string;
  timestamp: number;
}

/**
 * Schema for post publication event
 */
interface PostPublishedSchema {
  postId: string;
  draftId: string;
  userId: string;
  title: string;
  topicIds: string[];
  spaceId?: string;
  timestamp: number;
}

/**
 * Schema for post update event
 */
interface PostUpdatedSchema {
  postId: string;
  userId: string;
  title?: string;
  topicIds?: string[];
  updatedFields: string[];
  timestamp: number;
}

/**
 * Schema for post deletion event
 */
interface PostDeletedSchema {
  postId: string;
  userId: string;
  timestamp: number;
}

/**
 * Schema for comment creation event
 */
interface CommentCreatedSchema {
  commentId: string;
  postId: string;
  postOwnerId: string;
  commenterId: string;
  commenterName: string;
  commenterAvatar?: string;
  commentText: string;
  postTitle: string;
  parentId?: string;
  timestamp: number;
}

/**
 * Schema for comment update event
 */
interface CommentUpdatedSchema {
  commentId: string;
  userId: string;
  content: string;
  timestamp: number;
}

/**
 * Schema for comment deletion event
 */
interface CommentDeletedSchema {
  commentId: string;
  postId: string;
  userId: string;
  timestamp: number;
}

/**
 * Schema for topic creation event
 */
interface TopicCreatedSchema {
  topicId: string;
  name: string;
  description?: string;
  createdBy: string;
  timestamp: number;
}

/**
 * Schema for topic update event
 */
interface TopicUpdatedSchema {
  topicId: string;
  name?: string;
  description?: string;
  updatedBy: string;
  timestamp: number;
}

/**
 * Schema for space creation event
 */
interface SpaceCreatedSchema {
  spaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  timestamp: number;
}

/**
 * Schema for space update event
 */
interface SpaceUpdatedSchema {
  spaceId: string;
  name?: string;
  description?: string;
  updatedBy: string;
  timestamp: number;
}

/**
 * All content related event schemas
 */
export const ContentEventSchemas = {
  DRAFT_CREATED: {
    eventName: 'content.draft.created',
    schema: {} as DraftCreatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a draft is created',
  } as EventSchema<DraftCreatedSchema>,

  DRAFT_UPDATED: {
    eventName: 'content.draft.updated',
    schema: {} as DraftUpdatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a draft is updated',
  } as EventSchema<DraftUpdatedSchema>,

  DRAFT_DELETED: {
    eventName: 'content.draft.deleted',
    schema: {} as DraftDeletedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a draft is deleted',
  } as EventSchema<DraftDeletedSchema>,

  POST_PUBLISHED: {
    eventName: 'content.post.published',
    schema: {} as PostPublishedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a post is published',
  } as EventSchema<PostPublishedSchema>,

  POST_UPDATED: {
    eventName: 'content.post.updated',
    schema: {} as PostUpdatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a post is updated',
  } as EventSchema<PostUpdatedSchema>,

  POST_DELETED: {
    eventName: 'content.post.deleted',
    schema: {} as PostDeletedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a post is deleted',
  } as EventSchema<PostDeletedSchema>,

  COMMENT_CREATED: {
    eventName: 'content.comment.created',
    schema: {} as CommentCreatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a comment is created',
  } as EventSchema<CommentCreatedSchema>,

  COMMENT_UPDATED: {
    eventName: 'content.comment.updated',
    schema: {} as CommentUpdatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a comment is updated',
  } as EventSchema<CommentUpdatedSchema>,

  COMMENT_DELETED: {
    eventName: 'content.comment.deleted',
    schema: {} as CommentDeletedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a comment is deleted',
  } as EventSchema<CommentDeletedSchema>,

  TOPIC_CREATED: {
    eventName: 'content.topic.created',
    schema: {} as TopicCreatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a topic is created',
  } as EventSchema<TopicCreatedSchema>,

  TOPIC_UPDATED: {
    eventName: 'content.topic.updated',
    schema: {} as TopicUpdatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a topic is updated',
  } as EventSchema<TopicUpdatedSchema>,

  SPACE_CREATED: {
    eventName: 'content.space.created',
    schema: {} as SpaceCreatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a space is created',
  } as EventSchema<SpaceCreatedSchema>,

  SPACE_UPDATED: {
    eventName: 'content.space.updated',
    schema: {} as SpaceUpdatedSchema,
    version: '1.0.0',
    module: 'content',
    description: 'Emitted when a space is updated',
  } as EventSchema<SpaceUpdatedSchema>,
} as const;

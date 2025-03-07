import { BaseEvent } from './base.event';
import { EventMetadata, EventSchema } from './event.interface';
import { SocialEventSchemas } from './schemas/social.events';

/**
 * Base class for social events
 */
abstract class SocialEvent<T> extends BaseEvent<T> {
  private readonly eventPayload: T;

  constructor(
    schema: EventSchema<T>,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(schema, metadata);
    this.eventPayload = schema.schema;
  }

  getPartitionKey(): string {
    return 'social';
  }

  toJSON(): T {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user likes content
 */
export class LikeCreatedEvent extends SocialEvent<
  typeof SocialEventSchemas.LIKE_CREATED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.LIKE_CREATED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.LIKE_CREATED,
        schema: payload,
      },
      metadata,
    );
  }
}

/**
 * Event emitted when a user unlikes content
 */
export class LikeDeletedEvent extends SocialEvent<
  typeof SocialEventSchemas.LIKE_DELETED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.LIKE_DELETED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.LIKE_DELETED,
        schema: payload,
      },
      metadata,
    );
  }
}

/**
 * Event emitted when a user comments on content
 */
export class CommentCreatedEvent extends SocialEvent<
  typeof SocialEventSchemas.COMMENT_CREATED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.COMMENT_CREATED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.COMMENT_CREATED,
        schema: payload,
      },
      metadata,
    );
  }
}

/**
 * Event emitted when a user replies to a comment
 */
export class CommentRepliedEvent extends SocialEvent<
  typeof SocialEventSchemas.COMMENT_REPLIED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.COMMENT_REPLIED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.COMMENT_REPLIED,
        schema: payload,
      },
      metadata,
    );
  }
}

/**
 * Event emitted when a user follows another user
 */
export class FollowCreatedEvent extends SocialEvent<
  typeof SocialEventSchemas.FOLLOW_CREATED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.FOLLOW_CREATED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.FOLLOW_CREATED,
        schema: payload,
      },
      metadata,
    );
  }
}

/**
 * Event emitted when a user unfollows another user
 */
export class FollowDeletedEvent extends SocialEvent<
  typeof SocialEventSchemas.FOLLOW_DELETED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.FOLLOW_DELETED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(
      {
        ...SocialEventSchemas.FOLLOW_DELETED,
        schema: payload,
      },
      metadata,
    );
  }
}

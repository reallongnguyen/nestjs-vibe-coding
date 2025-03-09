import {
  BaseEvent,
  EventMetadata,
  EventSchema,
  SocialEventSchemas,
  LikeCreatedPayload,
  LikeDeletedPayload,
  ContentType,
} from 'src/common/event-manager';

export { ContentType };

/**
 * Base class for social events
 */
export abstract class SocialEvent<T extends object> extends BaseEvent<T> {
  private readonly eventPayload: T;

  constructor(
    schema: EventSchema<T>,
    payload: T,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(schema, metadata);
    this.eventPayload = payload;
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
export class LikeCreatedEvent extends SocialEvent<LikeCreatedPayload> {
  constructor(
    payload: LikeCreatedPayload,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(SocialEventSchemas.LIKE_CREATED, payload, metadata);
  }
}

/**
 * Event emitted when a user unlikes content
 */
export class LikeDeletedEvent extends SocialEvent<LikeDeletedPayload> {
  constructor(
    payload: LikeDeletedPayload,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(SocialEventSchemas.LIKE_DELETED, payload, metadata);
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
    super(SocialEventSchemas.COMMENT_CREATED, payload, metadata);
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
    super(SocialEventSchemas.COMMENT_REPLIED, payload, metadata);
  }
}

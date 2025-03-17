import {
  BaseEvent,
  ContentEventSchemas,
  EventMetadata,
} from 'src/common/event-manager';

/**
 * Event emitted when a tweet is created
 */
export class TweetCreatedEvent extends BaseEvent<
  typeof ContentEventSchemas.TWEET_CREATED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.TWEET_CREATED.schema;

  constructor(
    payload: typeof ContentEventSchemas.TWEET_CREATED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.TWEET_CREATED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a tweet is updated
 */
export class TweetUpdatedEvent extends BaseEvent<
  typeof ContentEventSchemas.TWEET_UPDATED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.TWEET_UPDATED.schema;

  constructor(
    payload: typeof ContentEventSchemas.TWEET_UPDATED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.TWEET_UPDATED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a tweet is deleted
 */
export class TweetDeletedEvent extends BaseEvent<
  typeof ContentEventSchemas.TWEET_DELETED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.TWEET_DELETED.schema;

  constructor(
    payload: typeof ContentEventSchemas.TWEET_DELETED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.TWEET_DELETED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a tweet is viewed
 */
export class TweetViewedEvent extends BaseEvent<
  typeof ContentEventSchemas.TWEET_VIEWED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.TWEET_VIEWED.schema;

  constructor(
    payload: typeof ContentEventSchemas.TWEET_VIEWED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.TWEET_VIEWED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Re-export event schemas for convenience
 */
export { ContentEventSchemas as TWEET_EVENTS } from 'src/common/event-manager/entities/events/schemas/content.events';

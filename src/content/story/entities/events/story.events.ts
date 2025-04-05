import {
  BaseEvent,
  ContentEventSchemas,
  EventMetadata,
} from 'src/common/event-manager';

/**
 * Event emitted when a story is created
 */
export class StoryCreatedEvent extends BaseEvent<
  typeof ContentEventSchemas.STORY_CREATED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.STORY_CREATED.schema;

  constructor(
    payload: typeof ContentEventSchemas.STORY_CREATED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.STORY_CREATED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a story is continued
 */
export class StoryContinuedEvent extends BaseEvent<
  typeof ContentEventSchemas.STORY_CONTINUED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.STORY_CONTINUED.schema;

  constructor(
    payload: typeof ContentEventSchemas.STORY_CONTINUED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.STORY_CONTINUED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a story is forked
 */
export class StoryForkedEvent extends BaseEvent<
  typeof ContentEventSchemas.STORY_FORKED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.STORY_FORKED.schema;

  constructor(
    payload: typeof ContentEventSchemas.STORY_FORKED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.STORY_FORKED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a story is viewed
 */
export class StoryViewedEvent extends BaseEvent<
  typeof ContentEventSchemas.STORY_VIEWED.schema
> {
  private readonly eventPayload: typeof ContentEventSchemas.STORY_VIEWED.schema;

  constructor(
    payload: typeof ContentEventSchemas.STORY_VIEWED.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(ContentEventSchemas.STORY_VIEWED, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Re-export event schemas for convenience
 */
export { ContentEventSchemas as STORY_EVENTS } from 'src/common/event-manager/entities/events/schemas/content.events';

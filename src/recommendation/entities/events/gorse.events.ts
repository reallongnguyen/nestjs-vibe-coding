import {
  GorseEventSchemas,
  BaseEvent,
  EventMetadata,
  EventSchema,
} from 'src/common/event-manager';

/**
 * Base class for all Gorse events
 */
export abstract class GorseEvent<T extends object> extends BaseEvent<T> {
  protected readonly eventPayload: T;

  constructor(
    eventSchema: EventSchema<T>,
    payload: T,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(eventSchema, metadata);
    this.eventPayload = payload;
  }

  getPartitionKey(): string {
    return 'gorse';
  }

  toJSON(): T {
    return this.eventPayload;
  }
}

/**
 * Event for synchronizing user data with Gorse
 */
export class UserSyncEvent extends GorseEvent<
  typeof GorseEventSchemas.USER_SYNC.schema
> {
  constructor(
    payload: typeof GorseEventSchemas.USER_SYNC.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.USER_SYNC, payload, metadata);
  }
}

/**
 * Event for synchronizing item data with Gorse
 */
export class ItemSyncEvent extends GorseEvent<
  typeof GorseEventSchemas.ITEM_SYNC.schema
> {
  constructor(
    payload: typeof GorseEventSchemas.ITEM_SYNC.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.ITEM_SYNC, payload, metadata);
  }
}

/**
 * Event for synchronizing feedback data with Gorse
 */
export class FeedbackSyncEvent extends GorseEvent<
  typeof GorseEventSchemas.FEEDBACK_SYNC.schema
> {
  constructor(
    payload: typeof GorseEventSchemas.FEEDBACK_SYNC.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.FEEDBACK_SYNC, payload, metadata);
  }
}

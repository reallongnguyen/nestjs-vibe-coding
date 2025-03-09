import {
  GorseEventSchemas,
  BaseEvent,
  EventMetadata,
} from '../../../common/event-manager';

/**
 * Event for syncing user data with Gorse
 */
export class UserSyncEvent extends BaseEvent<
  typeof GorseEventSchemas.USER_SYNC.schema
> {
  private readonly eventPayload: typeof GorseEventSchemas.USER_SYNC.schema;

  constructor(
    payload: typeof GorseEventSchemas.USER_SYNC.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.USER_SYNC, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event for syncing item data with Gorse
 */
export class ItemSyncEvent extends BaseEvent<
  typeof GorseEventSchemas.ITEM_SYNC.schema
> {
  private readonly eventPayload: typeof GorseEventSchemas.ITEM_SYNC.schema;

  constructor(
    payload: typeof GorseEventSchemas.ITEM_SYNC.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.ITEM_SYNC, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event for syncing feedback data with Gorse
 */
export class FeedbackSyncEvent extends BaseEvent<
  typeof GorseEventSchemas.FEEDBACK_SYNC.schema
> {
  private readonly eventPayload: typeof GorseEventSchemas.FEEDBACK_SYNC.schema;

  constructor(
    payload: typeof GorseEventSchemas.FEEDBACK_SYNC.schema,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas.FEEDBACK_SYNC, params);
    this.eventPayload = payload;
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Re-export event schemas for convenience
 */
export { GorseEventSchemas as GORSE_EVENTS } from 'src/common/event-manager/entities/events/schemas/recommendation.events';

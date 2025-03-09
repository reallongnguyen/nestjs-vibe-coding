import {
  GorseEventSchemas,
  UserSyncPayload,
  ItemSyncPayload,
  FeedbackSyncPayload,
  BaseEvent,
  EventMetadata,
} from 'src/common/event-manager';

/**
 * Base class for all Gorse events
 */
export abstract class GorseEvent<T extends object> extends BaseEvent<T> {
  protected readonly eventPayload: T;

  constructor(
    eventName: string,
    payload: T,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(GorseEventSchemas[eventName] as any, metadata);
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
export class UserSyncEvent extends GorseEvent<UserSyncPayload> {
  constructor(
    payload: UserSyncPayload,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super('gorse.user.sync', payload, metadata);
  }
}

/**
 * Event for synchronizing item data with Gorse
 */
export class ItemSyncEvent extends GorseEvent<ItemSyncPayload> {
  constructor(
    payload: ItemSyncPayload,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super('gorse.item.sync', payload, metadata);
  }
}

/**
 * Event for synchronizing feedback data with Gorse
 */
export class FeedbackSyncEvent extends GorseEvent<FeedbackSyncPayload> {
  constructor(
    payload: FeedbackSyncPayload,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super('gorse.feedback.sync', payload, metadata);
  }
}

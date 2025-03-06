import { v7 as uuidv7 } from 'uuid';
import { EventBusMessage, EventMetadata, EventSchema } from './event.interface';

/**
 * Base event class that all domain events must extend
 * Implements both event-driven and message-driven patterns
 */
export abstract class BaseEvent<T = unknown> implements EventBusMessage<T> {
  /**
   * Unique identifier for this event instance
   */
  public readonly eventId: string;

  /**
   * Name of the event
   */
  public readonly eventName: string;

  /**
   * Event metadata
   */
  public readonly metadata: EventMetadata;

  /**
   * Schema definition for this event
   */
  protected readonly schema: EventSchema<T>;

  constructor(
    schema: EventSchema<T>,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    this.schema = schema;
    this.eventId = uuidv7();
    this.eventName = schema.eventName;

    this.metadata = {
      correlationId: params?.correlationId,
      metadata: params?.metadata,
      timestamp: Date.now(),
      version: schema.version,
    };
  }

  /**
   * Get the event payload
   * Must match the schema definition
   */
  abstract toJSON(): T;

  /**
   * Get the event payload
   */
  get payload(): T {
    return this.toJSON();
  }

  /**
   * Get the event schema
   */
  getSchema(): EventSchema<T> {
    return this.schema;
  }

  /**
   * Returns the partition key for Kafka
   * Default implementation uses eventId
   */
  getPartitionKey(): string {
    return this.eventId;
  }
}

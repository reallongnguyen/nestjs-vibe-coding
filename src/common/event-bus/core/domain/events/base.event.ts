import { v7 as uuidv7 } from 'uuid';

/**
 * Base event class that follows both event-driven and message-driven patterns
 * Compatible with both in-memory events and message brokers like Kafka
 */
export abstract class BaseEvent {
  /**
   * Unique identifier for the event instance
   */
  public readonly eventId: string;

  /**
   * Timestamp when the event occurred
   */
  public readonly occurredOn: Date;

  /**
   * Version of the event schema
   */
  public readonly version: string = '1.0.0';

  /**
   * Optional correlation ID for tracking event chains
   */
  public readonly correlationId?: string;

  /**
   * Optional metadata for additional context
   */
  public readonly metadata?: Record<string, unknown>;

  constructor(params?: {
    correlationId?: string;
    metadata?: Record<string, unknown>;
    occurredOn?: Date;
  }) {
    this.eventId = uuidv7();
    this.occurredOn = params?.occurredOn ?? new Date();
    this.correlationId = params?.correlationId;
    this.metadata = params?.metadata;
  }

  /**
   * Returns the event type name
   * Used as Kafka topic name or event emitter event name
   */
  abstract eventName(): string;

  /**
   * Returns the event payload
   * Used as Kafka message value
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * Returns the partition key for Kafka
   * Default implementation uses eventId
   */
  getPartitionKey(): string {
    return this.eventId;
  }
}

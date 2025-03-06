/**
 * Metadata for all events in the system
 */
export interface EventMetadata {
  /**
   * Unique identifier for tracking event chains
   */
  correlationId?: string;

  /**
   * Additional context information
   */
  metadata?: Record<string, unknown>;

  /**
   * When the event occurred
   */
  timestamp: number;

  /**
   * Schema version of the event
   */
  version: string;
}

/**
 * Definition of an event's schema and metadata
 */
export interface EventSchema<T = unknown> {
  /**
   * Unique name of the event
   * Format: {module}.{entity}.{action}
   */
  readonly eventName: string;

  /**
   * JSON schema of the event payload
   */
  readonly schema: T;

  /**
   * Schema version following semver
   */
  readonly version: string;

  /**
   * Module that owns this event
   */
  readonly module: string;

  /**
   * Human readable description of the event
   */
  readonly description: string;
}

/**
 * Structure of messages passed through the event bus
 */
export interface EventBusMessage<T = unknown> {
  /**
   * Unique identifier for this event instance
   */
  readonly eventId: string;

  /**
   * Name of the event
   */
  readonly eventName: string;

  /**
   * Event data
   */
  readonly payload: T;

  /**
   * Event metadata
   */
  readonly metadata: EventMetadata;
}

/**
 * Interface that all event handlers must implement
 */
export interface EventHandler<T = unknown> {
  /**
   * Handle an event
   * @param event The event to handle
   */
  handle(event: EventBusMessage<T>): Promise<void>;
}

/**
 * Interface for modules to declare which events they handle
 */
export interface EventSubscriber {
  /**
   * Get the events this subscriber handles
   */
  getSubscribedEvents(): EventSchema[];
}

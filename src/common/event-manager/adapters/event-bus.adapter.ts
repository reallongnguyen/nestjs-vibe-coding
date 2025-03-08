import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from '../core/domain/events/base.event';
import { EventBusMessage } from '../core/domain/events/event.interface';
import { EventValidationError } from '../core/domain/errors/event.errors';

/**
 * Adapter for publishing and subscribing to events using NestJS EventEmitter
 */
@Injectable()
export class EventBusAdapter {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger,
  ) {}

  /**
   * Publish an event to all subscribers
   * @throws EventValidationError if validation fails
   */
  async publish<T extends object>(event: BaseEvent<T>): Promise<void> {
    try {
      // Validate event before publishing
      await event.validate();

      const message: EventBusMessage<T> = {
        eventId: event.eventId,
        eventName: event.eventName,
        payload: event.payload,
        metadata: event.metadata,
      };

      await this.eventEmitter.emitAsync(event.eventName, message);
    } catch (error) {
      if (error instanceof EventValidationError) {
        this.logger.error(
          `Event validation failed for ${event.eventName}: ${error.message}`,
          error.getValidationMessages(),
        );
        throw error;
      }

      this.logger.error(
        `Failed to emit event ${event.eventName}: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribe to an event
   * @deprecated Use @OnEvent() decorator instead
   */
  subscribe<T extends object>(
    eventName: string,
    handler: (event: EventBusMessage<T>) => Promise<void>,
  ): void {
    this.logger.warn(
      'Using deprecated subscribe() method. Please use @OnEvent() decorator instead.',
    );
    this.eventEmitter.on(eventName, handler);
  }

  /**
   * Unsubscribe from an event
   * @deprecated Use @OnEvent() decorator instead
   */
  unsubscribe<T extends object>(
    eventName: string,
    handler: (event: EventBusMessage<T>) => Promise<void>,
  ): void {
    this.logger.warn(
      'Using deprecated unsubscribe() method. Please use @OnEvent() decorator instead.',
    );
    this.eventEmitter.off(eventName, handler);
  }
}

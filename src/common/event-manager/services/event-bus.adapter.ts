import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from '../entities/events/base.event';
import { EventBusMessage } from '../entities/events/event.interface';
import { EventValidationError } from '../entities/errors/event.errors';

/**
 * Adapter for publishing and subscribing to events using NestJS EventEmitter
 */
@Injectable()
export class EventBusAdapter {
  private readonly logger: Logger;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.logger = new Logger(EventBusAdapter.name);
  }

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
}

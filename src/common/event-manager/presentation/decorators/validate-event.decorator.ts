import { Logger } from '@nestjs/common';
import { validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventValidationError } from '../../entities/errors/event.errors';
import { BaseEvent } from '../../entities/events/base.event';

/**
 * Decorator that validates event payload against its schema
 * Provides type safety and runtime validation
 */
export function ValidateEvent() {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value;
    const logger = new Logger('ValidateEvent');

    return {
      ...descriptor,
      async value(...args: any[]) {
        const event = args[0] as BaseEvent;

        if (!event?.eventName || !event?.payload) {
          throw new EventValidationError('Invalid event structure', []);
        }

        try {
          // Get event schema
          const schema = event.getSchema();
          if (!schema) {
            throw new EventValidationError('Event schema not found', []);
          }

          // Convert payload to class instance
          const PayloadClass = schema.schema.constructor as new () => object;
          const payloadInstance = plainToInstance(PayloadClass, event.payload);

          // Validate using class-validator
          const errors: ValidationError[] = validateSync(
            payloadInstance as object,
          );

          if (errors.length > 0) {
            throw new EventValidationError(
              `Invalid event payload for ${event.eventName}`,
              errors,
            );
          }

          // Return original method result
          return originalMethod.apply(this, [
            {
              ...event,
              payload: payloadInstance,
            },
          ]);
        } catch (error) {
          logger.error(
            `Event validation failed for ${event.eventName}: ${error.message}`,
            error.stack,
          );

          if (error instanceof EventValidationError) {
            throw error;
          }

          throw new EventValidationError(
            `Event validation failed: ${error.message}`,
            [],
          );
        }
      },
    };
  };
}

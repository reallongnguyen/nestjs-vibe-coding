import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventValidationError } from '../errors/event.errors';
import { EventSchema } from '../events/event.interface';

/**
 * Validates event payloads against their schema definitions
 */
export class EventValidator {
  /**
   * Validates an event payload against its schema
   * @throws EventValidationError if validation fails
   */
  public static async validate<T extends object>(
    schema: EventSchema<T>,
    payload: T,
  ): Promise<void> {
    // Convert plain object to class instance for validation
    const instance = plainToInstance(
      payload.constructor as new () => T,
      payload,
      {
        enableImplicitConversion: true,
      },
    );

    // Validate using class-validator
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new EventValidationError(
        `Invalid event payload for ${schema.eventName}`,
        errors,
      );
    }
  }
}

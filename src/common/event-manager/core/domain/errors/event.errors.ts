import { ValidationError } from 'class-validator';

/**
 * Error thrown when event validation fails
 */
export class EventValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: ValidationError[],
  ) {
    super(message);
    this.name = 'EventValidationError';
  }

  /**
   * Get validation error messages
   */
  getValidationMessages(): string[] {
    return this.validationErrors.map((error) => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });
  }
}

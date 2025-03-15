import {
  NotificationNotFoundError,
  NotificationCreateError,
  NotificationUpdateError,
  NotificationDeliveryError,
  RateLimitExceededError,
  RateLimitCheckError,
  RateLimitUpdateError,
  RateLimitOverrideDisabledError,
  RateLimitOverrideError,
  PreferenceNotFoundError,
  PreferenceAlreadyExistsError,
  TemplateNotFoundError,
  TemplateInvalidContentError,
  TemplateInvalidSyntaxError,
  TemplateCompileError,
  TemplateRenderError,
  ProducerError,
} from './notification.error-classes';

/**
 * Factory for creating Notification module errors
 */
export class NotificationErrorFactory {
  /**
   * Creates an error for when a notification is not found
   * @param notificationId - The ID of the notification
   * @returns NotificationNotFoundError
   */
  static notificationNotFound(
    notificationId: string,
  ): NotificationNotFoundError {
    return new NotificationNotFoundError(notificationId);
  }

  /**
   * Creates an error for when notification creation fails
   * @param cause - The original error
   * @returns NotificationCreateError
   */
  static notificationCreateFailed(cause?: Error): NotificationCreateError {
    return new NotificationCreateError(cause);
  }

  /**
   * Creates an error for when notification update fails
   * @param cause - The original error
   * @returns NotificationUpdateError
   */
  static notificationUpdateFailed(cause?: Error): NotificationUpdateError {
    return new NotificationUpdateError(cause);
  }

  /**
   * Creates an error for when notification delivery fails
   * @param message - The error message
   * @param cause - The original error
   * @returns NotificationDeliveryError
   */
  static notificationDeliveryFailed(
    message: string,
    cause?: Error,
  ): NotificationDeliveryError {
    return new NotificationDeliveryError(message, cause);
  }

  /**
   * Creates an error for when rate limit is exceeded
   * @returns RateLimitExceededError
   */
  static rateLimitExceeded(): RateLimitExceededError {
    return new RateLimitExceededError();
  }

  /**
   * Creates an error for when rate limit check fails
   * @param cause - The original error
   * @returns RateLimitCheckError
   */
  static rateLimitCheckFailed(cause?: Error): RateLimitCheckError {
    return new RateLimitCheckError(cause);
  }

  /**
   * Creates an error for when rate limit update fails
   * @param cause - The original error
   * @returns RateLimitUpdateError
   */
  static rateLimitUpdateFailed(cause?: Error): RateLimitUpdateError {
    return new RateLimitUpdateError(cause);
  }

  /**
   * Creates an error for when rate limit override is disabled
   * @returns RateLimitOverrideDisabledError
   */
  static rateLimitOverrideDisabled(): RateLimitOverrideDisabledError {
    return new RateLimitOverrideDisabledError();
  }

  /**
   * Creates an error for when rate limit override fails
   * @param cause - The original error
   * @returns RateLimitOverrideError
   */
  static rateLimitOverrideFailed(cause?: Error): RateLimitOverrideError {
    return new RateLimitOverrideError(cause);
  }

  /**
   * Creates an error for when a notification preference is not found
   * @returns PreferenceNotFoundError
   */
  static preferenceNotFound(): PreferenceNotFoundError {
    return new PreferenceNotFoundError();
  }

  /**
   * Creates an error for when a notification preference already exists
   * @returns PreferenceAlreadyExistsError
   */
  static preferenceAlreadyExists(): PreferenceAlreadyExistsError {
    return new PreferenceAlreadyExistsError();
  }

  /**
   * Creates an error for when a notification template is not found
   * @returns TemplateNotFoundError
   */
  static templateNotFound(): TemplateNotFoundError {
    return new TemplateNotFoundError();
  }

  /**
   * Creates an error for when a notification template has invalid content
   * @returns TemplateInvalidContentError
   */
  static templateInvalidContent(): TemplateInvalidContentError {
    return new TemplateInvalidContentError();
  }

  /**
   * Creates an error for when a notification template has invalid syntax
   * @returns TemplateInvalidSyntaxError
   */
  static templateInvalidSyntax(): TemplateInvalidSyntaxError {
    return new TemplateInvalidSyntaxError();
  }

  /**
   * Creates an error for when a notification template fails to compile
   * @param type - The template type
   * @param language - The template language
   * @param cause - The original error
   * @returns TemplateCompileError
   */
  static templateCompileError(
    type: string,
    language: string,
    cause?: Error,
  ): TemplateCompileError {
    return new TemplateCompileError(type, language, cause);
  }

  /**
   * Creates an error for when a notification template fails to render
   * @param type - The template type
   * @param language - The template language
   * @param cause - The original error
   * @returns TemplateRenderError
   */
  static templateRenderError(
    type: string,
    language: string,
    cause?: Error,
  ): TemplateRenderError {
    return new TemplateRenderError(type, language, cause);
  }

  /**
   * Creates an error for when a notification producer fails
   * @param message - The error message
   * @param code - The error code
   * @param cause - The original error
   * @returns ProducerError
   */
  static producerFailed(
    message: string,
    code: string,
    cause?: Error,
  ): ProducerError {
    return new ProducerError(message, code, cause);
  }
}

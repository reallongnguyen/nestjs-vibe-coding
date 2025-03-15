import { AppError } from 'src/common/errors';
import { NotificationErrorCode } from './notification.error-codes';
import { NOTIFICATION_ERRORS } from './notification.errors';

/**
 * Base error class for Notification module errors
 */
export class NotificationError extends AppError {
  constructor(code: NotificationErrorCode, params?: Record<string, any>) {
    const errorCode = `notification.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * Error thrown when a notification is not found
 */
export class NotificationNotFoundError extends AppError {
  constructor(notificationId: string) {
    super(
      NotificationErrorCode.NOTIFICATION_NOT_FOUND,
      NOTIFICATION_ERRORS[NotificationErrorCode.NOTIFICATION_NOT_FOUND],
      {
        params: { notificationId },
      },
    );
  }
}

/**
 * Error thrown when notification creation fails
 */
export class NotificationCreateError extends AppError {
  constructor(cause?: Error) {
    super(
      NotificationErrorCode.NOTIFICATION_CREATE_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.NOTIFICATION_CREATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when notification update fails
 */
export class NotificationUpdateError extends AppError {
  constructor(cause?: Error) {
    super(
      NotificationErrorCode.NOTIFICATION_UPDATE_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.NOTIFICATION_UPDATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when notification delivery fails
 */
export class NotificationDeliveryError extends AppError {
  constructor(message: string, cause?: Error) {
    super(
      NotificationErrorCode.NOTIFICATION_DELIVERY_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.NOTIFICATION_DELIVERY_FAILED],
      {
        params: { message, cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitExceededError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.RATE_LIMIT_EXCEEDED,
      NOTIFICATION_ERRORS[NotificationErrorCode.RATE_LIMIT_EXCEEDED],
    );
  }
}

/**
 * Error thrown when rate limit check fails
 */
export class RateLimitCheckError extends AppError {
  constructor(cause?: Error) {
    super(
      NotificationErrorCode.RATE_LIMIT_CHECK_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.RATE_LIMIT_CHECK_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when rate limit update fails
 */
export class RateLimitUpdateError extends AppError {
  constructor(cause?: Error) {
    super(
      NotificationErrorCode.RATE_LIMIT_UPDATE_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.RATE_LIMIT_UPDATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when rate limit override is disabled
 */
export class RateLimitOverrideDisabledError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.RATE_LIMIT_OVERRIDE_DISABLED,
      NOTIFICATION_ERRORS[NotificationErrorCode.RATE_LIMIT_OVERRIDE_DISABLED],
    );
  }
}

/**
 * Error thrown when rate limit override fails
 */
export class RateLimitOverrideError extends AppError {
  constructor(cause?: Error) {
    super(
      NotificationErrorCode.RATE_LIMIT_OVERRIDE_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.RATE_LIMIT_OVERRIDE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when a notification preference is not found
 */
export class PreferenceNotFoundError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.PREFERENCE_NOT_FOUND,
      NOTIFICATION_ERRORS[NotificationErrorCode.PREFERENCE_NOT_FOUND],
    );
  }
}

/**
 * Error thrown when a notification preference already exists
 */
export class PreferenceAlreadyExistsError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.PREFERENCE_ALREADY_EXISTS,
      NOTIFICATION_ERRORS[NotificationErrorCode.PREFERENCE_ALREADY_EXISTS],
    );
  }
}

/**
 * Error thrown when a notification template is not found
 */
export class TemplateNotFoundError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.TEMPLATE_NOT_FOUND,
      NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_NOT_FOUND],
    );
  }
}

/**
 * Error thrown when a notification template has invalid content
 */
export class TemplateInvalidContentError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.TEMPLATE_INVALID_CONTENT,
      NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_INVALID_CONTENT],
    );
  }
}

/**
 * Error thrown when a notification template has invalid syntax
 */
export class TemplateInvalidSyntaxError extends AppError {
  constructor() {
    super(
      NotificationErrorCode.TEMPLATE_INVALID_SYNTAX,
      NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_INVALID_SYNTAX],
    );
  }
}

/**
 * Error thrown when a notification template fails to compile
 */
export class TemplateCompileError extends AppError {
  constructor(type: string, language: string, cause?: Error) {
    super(
      NotificationErrorCode.TEMPLATE_COMPILE_ERROR,
      NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_COMPILE_ERROR],
      {
        params: { type, language, cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when a notification template fails to render
 */
export class TemplateRenderError extends AppError {
  constructor(type: string, language: string, cause?: Error) {
    super(
      NotificationErrorCode.TEMPLATE_RENDER_ERROR,
      NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_RENDER_ERROR],
      {
        params: { type, language, cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error thrown when a notification producer fails
 */
export class ProducerError extends AppError {
  constructor(message: string, code: string, cause?: Error) {
    super(
      NotificationErrorCode.PRODUCER_FAILED,
      NOTIFICATION_ERRORS[NotificationErrorCode.PRODUCER_FAILED],
      {
        params: { message, code, cause: cause?.message },
        cause,
      },
    );
  }
}

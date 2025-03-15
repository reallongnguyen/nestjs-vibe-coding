import { HttpStatus } from '@nestjs/common';
import { NotificationErrorCode } from './notification.error-codes';

/**
 * Interface for error definitions
 */
export interface ErrorDefinition {
  message: string;
  status: HttpStatus;
}

/**
 * Error definitions for Notification module
 * Each error code maps to a message template and HTTP status code
 */
export const NOTIFICATION_ERRORS: Record<
  NotificationErrorCode,
  ErrorDefinition
> = {
  // Notification errors
  [NotificationErrorCode.NOTIFICATION_NOT_FOUND]: {
    message: 'Notification not found: {{notificationId}}',
    status: HttpStatus.NOT_FOUND,
  },
  [NotificationErrorCode.NOTIFICATION_CREATE_FAILED]: {
    message: 'Failed to create notification: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [NotificationErrorCode.NOTIFICATION_UPDATE_FAILED]: {
    message: 'Failed to update notification: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [NotificationErrorCode.NOTIFICATION_DELIVERY_FAILED]: {
    message: 'Failed to deliver notification: {{message}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Rate limit errors
  [NotificationErrorCode.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded for this notification type',
    status: HttpStatus.TOO_MANY_REQUESTS,
  },
  [NotificationErrorCode.RATE_LIMIT_CHECK_FAILED]: {
    message: 'Failed to check rate limit status: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [NotificationErrorCode.RATE_LIMIT_UPDATE_FAILED]: {
    message: 'Failed to update rate limit configuration: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [NotificationErrorCode.RATE_LIMIT_OVERRIDE_DISABLED]: {
    message: 'Rate limit override is disabled',
    status: HttpStatus.FORBIDDEN,
  },
  [NotificationErrorCode.RATE_LIMIT_OVERRIDE_FAILED]: {
    message: 'Failed to override rate limit: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Preference errors
  [NotificationErrorCode.PREFERENCE_NOT_FOUND]: {
    message: 'Notification preference not found',
    status: HttpStatus.NOT_FOUND,
  },
  [NotificationErrorCode.PREFERENCE_ALREADY_EXISTS]: {
    message: 'Notification preference already exists',
    status: HttpStatus.CONFLICT,
  },

  // Template errors
  [NotificationErrorCode.TEMPLATE_NOT_FOUND]: {
    message: 'Notification template not found',
    status: HttpStatus.NOT_FOUND,
  },
  [NotificationErrorCode.TEMPLATE_INVALID_CONTENT]: {
    message: 'Invalid template content',
    status: HttpStatus.BAD_REQUEST,
  },
  [NotificationErrorCode.TEMPLATE_INVALID_SYNTAX]: {
    message: 'Invalid template syntax',
    status: HttpStatus.BAD_REQUEST,
  },
  [NotificationErrorCode.TEMPLATE_COMPILE_ERROR]: {
    message:
      'Failed to compile template {{type}} for language {{language}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [NotificationErrorCode.TEMPLATE_RENDER_ERROR]: {
    message:
      'Failed to render template {{type}} for language {{language}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Producer errors
  [NotificationErrorCode.PRODUCER_FAILED]: {
    message: 'Notification producer failed: {{message}} (code: {{code}})',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};

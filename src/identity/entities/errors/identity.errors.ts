import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { IdentityErrorCode } from './identity.error-codes';

/**
 * Error definitions for Identity module
 * Each error code maps to a message template and HTTP status code
 */
export const IDENTITY_ERRORS: Record<IdentityErrorCode, ErrorDefinition> = {
  // User errors
  [IdentityErrorCode.USER_NOT_FOUND]: {
    message: 'User {{userId}} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [IdentityErrorCode.USER_CREATE_FAILED]: {
    message: 'Failed to create user: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [IdentityErrorCode.USER_UPDATE_FAILED]: {
    message: 'Failed to update user {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [IdentityErrorCode.USER_DELETE_FAILED]: {
    message: 'Failed to delete user {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Profile errors
  [IdentityErrorCode.USER_PROFILE_NOT_FOUND]: {
    message: 'User profile for {{userId}} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [IdentityErrorCode.USER_PROFILE_UPDATE_FAILED]: {
    message: 'Failed to update user profile for {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Bulk operation errors
  [IdentityErrorCode.INVALID_BULK_OPERATION]: {
    message: 'Invalid bulk operation: {{operation}}',
    status: HttpStatus.BAD_REQUEST,
  },

  // Authentication errors
  [IdentityErrorCode.REQUIRE_PERSON]: {
    message: 'Agent must be a person',
    status: HttpStatus.FORBIDDEN,
  },

  // Password errors
  [IdentityErrorCode.PASSWORD_RESET_FAILED]: {
    message: 'Failed to reset password for user {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};

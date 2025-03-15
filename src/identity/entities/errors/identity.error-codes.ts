/**
 * Standardized error codes for the Identity module
 * These codes are used by the error factory to create specific error instances
 */
export enum IdentityErrorCode {
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_CREATE_FAILED = 'USER_CREATE_FAILED',
  USER_UPDATE_FAILED = 'USER_UPDATE_FAILED',
  USER_DELETE_FAILED = 'USER_DELETE_FAILED',

  // Profile errors
  USER_PROFILE_NOT_FOUND = 'USER_PROFILE_NOT_FOUND',
  USER_PROFILE_UPDATE_FAILED = 'USER_PROFILE_UPDATE_FAILED',

  // Bulk operation errors
  INVALID_BULK_OPERATION = 'INVALID_BULK_OPERATION',

  // Authentication errors
  REQUIRE_PERSON = 'REQUIRE_PERSON',

  // Password errors
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
}

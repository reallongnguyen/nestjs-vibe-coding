import { AppError } from 'src/common/errors/app.error';
import { IdentityErrorCode } from './identity.error-codes';
import { IDENTITY_ERRORS } from './identity.errors';

/**
 * Base error class for Identity module errors
 */
export class IdentityError extends AppError {
  constructor(code: IdentityErrorCode, params?: Record<string, any>) {
    const errorCode = `identity.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * User-related error classes
 */
export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(
      IdentityErrorCode.USER_NOT_FOUND,
      IDENTITY_ERRORS[IdentityErrorCode.USER_NOT_FOUND],
      {
        params: { userId },
      },
    );
  }
}

export class UserCreateError extends AppError {
  constructor(cause?: Error) {
    super(
      IdentityErrorCode.USER_CREATE_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.USER_CREATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class UserUpdateError extends AppError {
  constructor(userId: string, cause?: Error) {
    super(
      IdentityErrorCode.USER_UPDATE_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.USER_UPDATE_FAILED],
      {
        params: { userId, cause: cause?.message },
        cause,
      },
    );
  }
}

export class UserDeleteError extends AppError {
  constructor(userId: string, cause?: Error) {
    super(
      IdentityErrorCode.USER_DELETE_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.USER_DELETE_FAILED],
      {
        params: { userId, cause: cause?.message },
        cause,
      },
    );
  }
}

export class UserQueryError extends AppError {
  constructor(cause?: Error) {
    super(
      IdentityErrorCode.USER_QUERY_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.USER_QUERY_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Profile-related error classes
 */
export class UserProfileNotFoundError extends AppError {
  constructor(userId: string) {
    super(
      IdentityErrorCode.USER_PROFILE_NOT_FOUND,
      IDENTITY_ERRORS[IdentityErrorCode.USER_PROFILE_NOT_FOUND],
      {
        params: { userId },
      },
    );
  }
}

export class UserProfileUpdateError extends AppError {
  constructor(userId: string, cause?: Error) {
    super(
      IdentityErrorCode.USER_PROFILE_UPDATE_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.USER_PROFILE_UPDATE_FAILED],
      {
        params: { userId, cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Bulk operation error classes
 */
export class InvalidBulkOperationError extends AppError {
  constructor(operation: string) {
    super(
      IdentityErrorCode.INVALID_BULK_OPERATION,
      IDENTITY_ERRORS[IdentityErrorCode.INVALID_BULK_OPERATION],
      {
        params: { operation },
      },
    );
  }
}

/**
 * Authentication error classes
 */
export class RequirePersonError extends AppError {
  constructor() {
    super(
      IdentityErrorCode.REQUIRE_PERSON,
      IDENTITY_ERRORS[IdentityErrorCode.REQUIRE_PERSON],
    );
  }
}

/**
 * Password error classes
 */
export class PasswordResetError extends AppError {
  constructor(userId: string, cause?: Error) {
    super(
      IdentityErrorCode.PASSWORD_RESET_FAILED,
      IDENTITY_ERRORS[IdentityErrorCode.PASSWORD_RESET_FAILED],
      {
        params: { userId, cause: cause?.message },
        cause,
      },
    );
  }
}

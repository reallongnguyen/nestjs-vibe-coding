import {
  InvalidBulkOperationError,
  PasswordResetError,
  RequirePersonError,
  UserCreateError,
  UserDeleteError,
  UserNotFoundError,
  UserProfileNotFoundError,
  UserProfileUpdateError,
  UserUpdateError,
} from './identity.error-classes';

/**
 * Factory for creating Identity module errors
 * Provides a consistent way to create error instances
 */
export class IdentityErrorFactory {
  /**
   * Creates an error for when a user is not found
   * @param userId - The ID of the user that was not found
   * @returns UserNotFoundError
   */
  static userNotFound(userId: string): UserNotFoundError {
    return new UserNotFoundError(userId);
  }

  /**
   * Creates an error for when a user profile is not found
   * @param userId - The ID of the user whose profile was not found
   * @returns UserProfileNotFoundError
   */
  static userProfileNotFound(userId: string): UserProfileNotFoundError {
    return new UserProfileNotFoundError(userId);
  }

  /**
   * Creates an error for when a bulk operation is invalid
   * @param operation - The invalid operation
   * @returns InvalidBulkOperationError
   */
  static invalidBulkOperation(operation: string): InvalidBulkOperationError {
    return new InvalidBulkOperationError(operation);
  }

  /**
   * Creates an error for when user creation fails
   * @param cause - The original error
   * @returns UserCreateError
   */
  static userCreateFailed(cause?: Error): UserCreateError {
    return new UserCreateError(cause);
  }

  /**
   * Creates an error for when user update fails
   * @param userId - The ID of the user that could not be updated
   * @param cause - The original error
   * @returns UserUpdateError
   */
  static userUpdateFailed(userId: string, cause?: Error): UserUpdateError {
    return new UserUpdateError(userId, cause);
  }

  /**
   * Creates an error for when user deletion fails
   * @param userId - The ID of the user that could not be deleted
   * @param cause - The original error
   * @returns UserDeleteError
   */
  static userDeleteFailed(userId: string, cause?: Error): UserDeleteError {
    return new UserDeleteError(userId, cause);
  }

  /**
   * Creates an error for when user profile update fails
   * @param userId - The ID of the user whose profile could not be updated
   * @param cause - The original error
   * @returns UserProfileUpdateError
   */
  static userProfileUpdateFailed(
    userId: string,
    cause?: Error,
  ): UserProfileUpdateError {
    return new UserProfileUpdateError(userId, cause);
  }

  /**
   * Creates an error for when an operation requires a person
   * @returns RequirePersonError
   */
  static requirePerson(): RequirePersonError {
    return new RequirePersonError();
  }

  /**
   * Creates an error for when password reset fails
   * @param userId - The ID of the user whose password could not be reset
   * @param cause - The original error
   * @returns PasswordResetError
   */
  static passwordResetFailed(
    userId: string,
    cause?: Error,
  ): PasswordResetError {
    return new PasswordResetError(userId, cause);
  }
}

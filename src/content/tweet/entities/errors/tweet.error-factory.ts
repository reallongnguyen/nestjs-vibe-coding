import {
  TweetNotFoundError,
  TweetContentEmptyError,
  TweetContentTooLongError,
  TweetUnauthorizedError,
  TweetCreationFailedError,
  TweetUpdateFailedError,
  TweetDeleteFailedError,
  TweetImageInvalidError,
  TweetImageLimitExceededError,
  TweetImageUserMismatchError,
  TweetImageBucketInvalidError,
} from './tweet.error-classes';

/**
 * Factory for creating Tweet module errors
 * Provides a consistent way to create error instances
 */
export class TweetErrorFactory {
  /**
   * Creates an error for when a tweet is not found
   * @param id - The tweet ID
   * @returns TweetNotFoundError
   */
  static tweetNotFound(id: string): TweetNotFoundError {
    return new TweetNotFoundError(id);
  }

  /**
   * Creates an error for when tweet content is empty
   * @returns TweetContentEmptyError
   */
  static contentEmpty(): TweetContentEmptyError {
    return new TweetContentEmptyError();
  }

  /**
   * Creates an error for when tweet content is too long
   * @returns TweetContentTooLongError
   */
  static contentTooLong(): TweetContentTooLongError {
    return new TweetContentTooLongError();
  }

  /**
   * Creates an error for when user is not authorized to perform an action on a tweet
   * @param action - The action being attempted (e.g., 'update', 'delete')
   * @returns TweetUnauthorizedError
   */
  static unauthorized(action: string): TweetUnauthorizedError {
    return new TweetUnauthorizedError(action);
  }

  /**
   * Creates an error for when tweet creation fails
   * @param reason - The reason creation failed
   * @param cause - The original error
   * @returns TweetCreationFailedError
   */
  static creationFailed(
    reason: string,
    cause?: Error,
  ): TweetCreationFailedError {
    return new TweetCreationFailedError(reason, cause);
  }

  /**
   * Creates an error for when tweet update fails
   * @param reason - The reason update failed
   * @param cause - The original error
   * @returns TweetUpdateFailedError
   */
  static updateFailed(reason: string, cause?: Error): TweetUpdateFailedError {
    return new TweetUpdateFailedError(reason, cause);
  }

  /**
   * Creates an error for when tweet deletion fails
   * @param reason - The reason deletion failed
   * @param cause - The original error
   * @returns TweetDeleteFailedError
   */
  static deleteFailed(reason: string, cause?: Error): TweetDeleteFailedError {
    return new TweetDeleteFailedError(reason, cause);
  }

  /**
   * Creates an error for when tweet image URL is invalid
   * @param urls - The invalid image URLs
   * @returns TweetImageInvalidError
   */
  static imageInvalid(urls: string[]): TweetImageInvalidError {
    return new TweetImageInvalidError(urls);
  }

  /**
   * Creates an error for when tweet image limit is exceeded
   * @returns TweetImageLimitExceededError
   */
  static imageLimitExceeded(): TweetImageLimitExceededError {
    return new TweetImageLimitExceededError();
  }

  /**
   * Creates an error for when image URL contains a user ID that doesn't match the authenticated user
   * @param urlUserId - The user ID in the URL
   * @param userId - The authenticated user ID
   * @returns TweetImageUserMismatchError
   */
  static imageUserMismatch(
    urlUserId: string,
    userId: string,
  ): TweetImageUserMismatchError {
    return new TweetImageUserMismatchError(urlUserId, userId);
  }

  /**
   * Creates an error for when image URL contains an invalid bucket
   * @param bucket - The bucket in the URL
   * @param expectedBucket - The expected bucket
   * @returns TweetImageBucketInvalidError
   */
  static imageBucketInvalid(
    bucket: string,
    expectedBucket: string,
  ): TweetImageBucketInvalidError {
    return new TweetImageBucketInvalidError(bucket, expectedBucket);
  }
}

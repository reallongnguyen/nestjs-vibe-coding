import { AppError } from 'src/common/errors/app.error';
import { TweetErrorCode } from './tweet.error-codes';
import { TWEET_ERRORS } from './tweet.errors';

/**
 * Base error class for Tweet module errors
 */
export class TweetError extends AppError {
  constructor(code: TweetErrorCode, params?: Record<string, any>) {
    const errorCode = `tweet.${code}`;
    super(errorCode, TWEET_ERRORS[code], { params });
  }
}

/**
 * Error thrown when a tweet is not found
 */
export class TweetNotFoundError extends TweetError {
  constructor(id: string) {
    super(TweetErrorCode.TWEET_NOT_FOUND, { id });
  }
}

/**
 * Error thrown when tweet content is empty
 */
export class TweetContentEmptyError extends TweetError {
  constructor() {
    super(TweetErrorCode.TWEET_CONTENT_EMPTY);
  }
}

/**
 * Error thrown when tweet content is too long
 */
export class TweetContentTooLongError extends TweetError {
  constructor() {
    super(TweetErrorCode.TWEET_CONTENT_TOO_LONG);
  }
}

/**
 * Error thrown when user is not authorized to perform an action on a tweet
 */
export class TweetUnauthorizedError extends TweetError {
  constructor(action: string) {
    super(TweetErrorCode.TWEET_UNAUTHORIZED, { action });
  }
}

/**
 * Error thrown when tweet creation fails
 */
export class TweetCreationFailedError extends TweetError {
  constructor(reason: string, cause?: Error) {
    super(TweetErrorCode.TWEET_CREATION_FAILED, { reason, cause });
  }
}

/**
 * Error thrown when tweet update fails
 */
export class TweetUpdateFailedError extends TweetError {
  constructor(reason: string, cause?: Error) {
    super(TweetErrorCode.TWEET_UPDATE_FAILED, { reason, cause });
  }
}

/**
 * Error thrown when tweet deletion fails
 */
export class TweetDeleteFailedError extends TweetError {
  constructor(reason: string, cause?: Error) {
    super(TweetErrorCode.TWEET_DELETE_FAILED, { reason, cause });
  }
}

/**
 * Error thrown when tweet image URL is invalid
 */
export class TweetImageInvalidError extends TweetError {
  constructor(urls: string[]) {
    super(TweetErrorCode.TWEET_IMAGE_INVALID, { urls: urls.join(', ') });
  }
}

/**
 * Error thrown when tweet image limit is exceeded
 */
export class TweetImageLimitExceededError extends TweetError {
  constructor() {
    super(TweetErrorCode.TWEET_IMAGE_LIMIT_EXCEEDED);
  }
}

/**
 * Error thrown when image URL contains a user ID that doesn't match the authenticated user
 */
export class TweetImageUserMismatchError extends TweetError {
  constructor(urlUserId: string, userId: string) {
    super(TweetErrorCode.TWEET_IMAGE_USER_MISMATCH, { urlUserId, userId });
  }
}

/**
 * Error thrown when image URL contains an invalid bucket
 */
export class TweetImageBucketInvalidError extends TweetError {
  constructor(bucket: string, expectedBucket: string) {
    super(TweetErrorCode.TWEET_IMAGE_BUCKET_INVALID, {
      bucket,
      expectedBucket,
    });
  }
}

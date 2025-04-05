import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { TweetErrorCode } from './tweet.error-codes';

/**
 * Error definitions for Tweet module
 * Each error code maps to a message template and HTTP status code
 */
export const TWEET_ERRORS: Record<TweetErrorCode, ErrorDefinition> = {
  [TweetErrorCode.TWEET_NOT_FOUND]: {
    message: 'Tweet with ID {id} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [TweetErrorCode.TWEET_CONTENT_EMPTY]: {
    message: 'Tweet content cannot be empty',
    status: HttpStatus.BAD_REQUEST,
  },
  [TweetErrorCode.TWEET_CONTENT_TOO_LONG]: {
    message: 'Tweet content cannot exceed 280 characters',
    status: HttpStatus.BAD_REQUEST,
  },
  [TweetErrorCode.TWEET_UNAUTHORIZED]: {
    message: 'You are not authorized to {action} this tweet',
    status: HttpStatus.FORBIDDEN,
  },
  [TweetErrorCode.TWEET_CREATION_FAILED]: {
    message: 'Failed to create tweet: {reason}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [TweetErrorCode.TWEET_UPDATE_FAILED]: {
    message: 'Failed to update tweet: {reason}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [TweetErrorCode.TWEET_DELETE_FAILED]: {
    message: 'Failed to delete tweet: {reason}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [TweetErrorCode.TWEET_IMAGE_INVALID]: {
    message:
      'Invalid image URLs: {urls}. URLs must be in the format: gs://{bucket}/images/users/{userId}/tweets/{tweetId}/',
    status: HttpStatus.BAD_REQUEST,
  },
  [TweetErrorCode.TWEET_IMAGE_LIMIT_EXCEEDED]: {
    message: 'Maximum of 4 images allowed per tweet',
    status: HttpStatus.BAD_REQUEST,
  },
  [TweetErrorCode.TWEET_IMAGE_USER_MISMATCH]: {
    message:
      'Image URL contains user ID {urlUserId} which does not match the authenticated user {userId}',
    status: HttpStatus.BAD_REQUEST,
  },
  [TweetErrorCode.TWEET_IMAGE_BUCKET_INVALID]: {
    message: 'Invalid bucket {bucket} in image URL. Expected {expectedBucket}',
    status: HttpStatus.BAD_REQUEST,
  },
};

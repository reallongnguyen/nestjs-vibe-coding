/**
 * Error codes for the Tweet module
 */
export enum TweetErrorCode {
  TWEET_NOT_FOUND = 'not-found',
  TWEET_CONTENT_EMPTY = 'content-empty',
  TWEET_CONTENT_TOO_LONG = 'content-too-long',
  TWEET_UNAUTHORIZED = 'unauthorized',
  TWEET_CREATION_FAILED = 'creation-failed',
  TWEET_UPDATE_FAILED = 'update-failed',
  TWEET_DELETE_FAILED = 'delete-failed',
  TWEET_IMAGE_INVALID = 'image-invalid',
  TWEET_IMAGE_LIMIT_EXCEEDED = 'image-limit-exceeded',
  TWEET_IMAGE_USER_MISMATCH = 'image-user-mismatch',
  TWEET_IMAGE_BUCKET_INVALID = 'image-bucket-invalid',
}

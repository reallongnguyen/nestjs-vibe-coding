/**
 * Error codes for the Social module
 */
export enum SocialErrorCode {
  // Like errors
  LIKE_ALREADY_EXISTS = 'social.like.already_exists',
  LIKE_FAILED = 'social.like.failed',

  // Unlike errors
  UNLIKE_NOT_FOUND = 'social.unlike.not_found',
  UNLIKE_FAILED = 'social.unlike.failed',

  // View errors
  VIEW_FAILED = 'social.view.failed',

  // Engageable errors
  ENGAGEABLE_NOT_FOUND = 'social.engageable.not_found',

  // Comment errors
  COMMENT_NOT_FOUND = 'social.comment.not_found',
  COMMENT_CREATE_FAILED = 'social.comment.create_failed',
  COMMENT_UPDATE_FAILED = 'social.comment.update_failed',
  COMMENT_DELETE_FAILED = 'social.comment.delete_failed',
  COMMENT_NOT_OWNER = 'social.comment.not_owner',
  COMMENT_ALREADY_LIKED = 'social.comment.already_liked',
  COMMENT_NOT_LIKED = 'social.comment.not_liked',

  // Redis errors
  REDIS_OPERATION_FAILED = 'social.redis.operation_failed',
}

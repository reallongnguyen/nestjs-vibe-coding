import { AppError } from 'src/common/errors/app.error';
import { SocialErrorCode } from './social.error-codes';
import { SOCIAL_ERRORS } from './social.errors';

/**
 * Error thrown when a user tries to like content they've already liked
 */
export class ContentAlreadyLikedError extends AppError {
  constructor(userId: string, contentId: string, contentType: string) {
    super(
      SocialErrorCode.LIKE_ALREADY_EXISTS,
      SOCIAL_ERRORS[SocialErrorCode.LIKE_ALREADY_EXISTS],
      {
        params: { userId, contentId, contentType },
      },
    );
  }
}

/**
 * Error thrown when a user tries to unlike content they haven't liked
 */
export class ContentNotLikedError extends AppError {
  constructor(userId: string, contentId: string, contentType: string) {
    super(
      SocialErrorCode.UNLIKE_NOT_FOUND,
      SOCIAL_ERRORS[SocialErrorCode.UNLIKE_NOT_FOUND],
      {
        params: { userId, contentId, contentType },
      },
    );
  }
}

/**
 * Error thrown when view recording fails
 */
export class ContentViewError extends AppError {
  constructor(contentId: string, contentType: string, cause?: Error) {
    super(
      SocialErrorCode.VIEW_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.VIEW_FAILED],
      {
        params: { contentId, contentType },
        cause,
      },
    );
  }
}

/**
 * Error thrown when engageable content cannot be found
 */
export class EngageableNotFoundError extends AppError {
  constructor(contentId: string, contentType: string) {
    super(
      SocialErrorCode.ENGAGEABLE_NOT_FOUND,
      SOCIAL_ERRORS[SocialErrorCode.ENGAGEABLE_NOT_FOUND],
      {
        params: { contentId, contentType },
      },
    );
  }
}

/**
 * Error thrown when a comment is not found
 */
export class CommentNotFoundError extends AppError {
  constructor(commentId: string) {
    super(
      SocialErrorCode.COMMENT_NOT_FOUND,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND],
      {
        params: { commentId },
      },
    );
  }
}

/**
 * Error thrown when comment creation fails
 */
export class CommentCreateError extends AppError {
  constructor(cause?: Error) {
    super(
      SocialErrorCode.COMMENT_CREATE_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_CREATE_FAILED],
      {
        cause,
      },
    );
  }
}

/**
 * Error thrown when comment update fails
 */
export class CommentUpdateError extends AppError {
  constructor(commentId: string, cause?: Error) {
    super(
      SocialErrorCode.COMMENT_UPDATE_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_UPDATE_FAILED],
      {
        params: { commentId },
        cause,
      },
    );
  }
}

/**
 * Error thrown when a user tries to modify a comment they do not own
 */
export class NotCommentOwnerError extends AppError {
  constructor(userId: string, commentId: string) {
    super(
      SocialErrorCode.COMMENT_NOT_OWNER,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_OWNER],
      {
        params: { userId, commentId },
      },
    );
  }
}

/**
 * Error thrown when comment deletion fails
 */
export class CommentDeleteError extends AppError {
  constructor(commentId: string, cause?: Error) {
    super(
      SocialErrorCode.COMMENT_DELETE_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_DELETE_FAILED],
      {
        params: { commentId },
        cause,
      },
    );
  }
}

/**
 * Error thrown when a user tries to like a comment they've already liked
 */
export class CommentAlreadyLikedError extends AppError {
  constructor(userId: string, commentId: string) {
    super(
      SocialErrorCode.COMMENT_ALREADY_LIKED,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_ALREADY_LIKED],
      {
        params: { userId, commentId },
      },
    );
  }
}

/**
 * Error thrown when a user tries to unlike a comment they haven't liked
 */
export class CommentNotLikedError extends AppError {
  constructor(userId: string, commentId: string) {
    super(
      SocialErrorCode.COMMENT_NOT_LIKED,
      SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_LIKED],
      {
        params: { userId, commentId },
      },
    );
  }
}

/**
 * Error thrown when a Redis operation fails
 */
export class RedisOperationError extends AppError {
  constructor(operation: string, cause?: Error) {
    super(
      SocialErrorCode.REDIS_OPERATION_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.REDIS_OPERATION_FAILED],
      {
        params: { operation, cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Error for when a general social operation fails
 */
export class SocialOperationError extends AppError {
  constructor(operation: string, cause?: Error) {
    super(
      SocialErrorCode.SOCIAL_OPERATION_FAILED,
      SOCIAL_ERRORS[SocialErrorCode.SOCIAL_OPERATION_FAILED],
      {
        params: { operation, cause: cause?.message },
        cause,
      },
    );
  }
}

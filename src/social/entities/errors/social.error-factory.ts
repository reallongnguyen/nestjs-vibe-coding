import {
  CommentAlreadyLikedError,
  CommentCreateError,
  CommentDeleteError,
  CommentNotFoundError,
  CommentNotLikedError,
  CommentUpdateError,
  ContentAlreadyLikedError,
  ContentNotLikedError,
  ContentViewError,
  EngageableNotFoundError,
  NotCommentOwnerError,
  RedisOperationError,
} from './social.error-classes';

/**
 * Factory for creating Social module errors
 */
export class SocialErrorFactory {
  /**
   * Creates an error for when content is already liked
   * @param userId - ID of the user
   * @param contentId - ID of the content
   * @param contentType - Type of the content
   * @returns ContentAlreadyLikedError
   */
  static contentAlreadyLiked(
    userId: string,
    contentId: string,
    contentType: string,
  ): ContentAlreadyLikedError {
    return new ContentAlreadyLikedError(userId, contentId, contentType);
  }

  /**
   * Creates an error for when content is not liked
   * @param userId - ID of the user
   * @param contentId - ID of the content
   * @param contentType - Type of the content
   * @returns ContentNotLikedError
   */
  static contentNotLiked(
    userId: string,
    contentId: string,
    contentType: string,
  ): ContentNotLikedError {
    return new ContentNotLikedError(userId, contentId, contentType);
  }

  /**
   * Creates an error for when content view recording fails
   * @param contentId - ID of the content
   * @param contentType - Type of the content
   * @param cause - The original error
   * @returns ContentViewError
   */
  static contentViewFailed(
    contentId: string,
    contentType: string,
    cause?: Error,
  ): ContentViewError {
    return new ContentViewError(contentId, contentType, cause);
  }

  /**
   * Creates an error for when engageable content is not found
   * @param contentId - ID of the content
   * @param contentType - Type of the content
   * @returns EngageableNotFoundError
   */
  static engageableNotFound(
    contentId: string,
    contentType: string,
  ): EngageableNotFoundError {
    return new EngageableNotFoundError(contentId, contentType);
  }

  /**
   * Creates an error for when a comment is not found
   * @param commentId - ID of the comment
   * @returns CommentNotFoundError
   */
  static commentNotFound(commentId: string): CommentNotFoundError {
    return new CommentNotFoundError(commentId);
  }

  /**
   * Creates an error for when comment creation fails
   * @param cause - The original error
   * @returns CommentCreateError
   */
  static commentCreateFailed(cause?: Error): CommentCreateError {
    return new CommentCreateError(cause);
  }

  /**
   * Creates an error for when comment update fails
   * @param commentId - ID of the comment
   * @param cause - The original error
   * @returns CommentUpdateError
   */
  static commentUpdateFailed(
    commentId: string,
    cause?: Error,
  ): CommentUpdateError {
    return new CommentUpdateError(commentId, cause);
  }

  /**
   * Creates an error for when a user is not the owner of a comment
   * @param userId - ID of the user
   * @param commentId - ID of the comment
   * @returns NotCommentOwnerError
   */
  static notCommentOwner(
    userId: string,
    commentId: string,
  ): NotCommentOwnerError {
    return new NotCommentOwnerError(userId, commentId);
  }

  /**
   * Creates an error for when comment deletion fails
   * @param commentId - ID of the comment
   * @param cause - The original error
   * @returns CommentDeleteError
   */
  static commentDeleteFailed(
    commentId: string,
    cause?: Error,
  ): CommentDeleteError {
    return new CommentDeleteError(commentId, cause);
  }

  /**
   * Creates an error for when a comment is already liked
   * @param userId - ID of the user
   * @param commentId - ID of the comment
   * @returns CommentAlreadyLikedError
   */
  static commentAlreadyLiked(
    userId: string,
    commentId: string,
  ): CommentAlreadyLikedError {
    return new CommentAlreadyLikedError(userId, commentId);
  }

  /**
   * Creates an error for when a comment is not liked
   * @param userId - ID of the user
   * @param commentId - ID of the comment
   * @returns CommentNotLikedError
   */
  static commentNotLiked(
    userId: string,
    commentId: string,
  ): CommentNotLikedError {
    return new CommentNotLikedError(userId, commentId);
  }

  static redisOperationError(
    operation: string,
    error: Error,
  ): RedisOperationError {
    return new RedisOperationError(operation, error);
  }
}

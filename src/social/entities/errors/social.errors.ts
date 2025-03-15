import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { SocialErrorCode } from './social.error-codes';

/**
 * Error definitions for the Social module
 */
export const SOCIAL_ERRORS: Record<SocialErrorCode, ErrorDefinition> = {
  // Like errors
  [SocialErrorCode.LIKE_ALREADY_EXISTS]: {
    message:
      'Content {contentType} with ID {contentId} is already liked by user {userId}',
    status: HttpStatus.BAD_REQUEST,
  },
  [SocialErrorCode.LIKE_FAILED]: {
    message: 'Failed to like content {contentType} with ID {contentId}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Unlike errors
  [SocialErrorCode.UNLIKE_NOT_FOUND]: {
    message:
      'Content {contentType} with ID {contentId} is not liked by user {userId}',
    status: HttpStatus.BAD_REQUEST,
  },
  [SocialErrorCode.UNLIKE_FAILED]: {
    message: 'Failed to unlike content {contentType} with ID {contentId}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // View errors
  [SocialErrorCode.VIEW_FAILED]: {
    message:
      'Failed to record view for content {contentType} with ID {contentId}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Engageable errors
  [SocialErrorCode.ENGAGEABLE_NOT_FOUND]: {
    message: 'Engageable content {contentType} with ID {contentId} not found',
    status: HttpStatus.NOT_FOUND,
  },

  // Comment errors
  [SocialErrorCode.COMMENT_NOT_FOUND]: {
    message: 'Comment with ID {commentId} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [SocialErrorCode.COMMENT_CREATE_FAILED]: {
    message: 'Failed to create comment',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [SocialErrorCode.COMMENT_UPDATE_FAILED]: {
    message: 'Failed to update comment with ID {commentId}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [SocialErrorCode.COMMENT_DELETE_FAILED]: {
    message: 'Failed to delete comment with ID {commentId}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [SocialErrorCode.COMMENT_NOT_OWNER]: {
    message: 'User {userId} is not the owner of comment {commentId}',
    status: HttpStatus.FORBIDDEN,
  },
  [SocialErrorCode.COMMENT_ALREADY_LIKED]: {
    message: 'Comment with ID {commentId} is already liked by user {userId}',
    status: HttpStatus.BAD_REQUEST,
  },
  [SocialErrorCode.COMMENT_NOT_LIKED]: {
    message: 'Comment with ID {commentId} is not liked by user {userId}',
    status: HttpStatus.BAD_REQUEST,
  },
  [SocialErrorCode.REDIS_OPERATION_FAILED]: {
    message: 'Failed to perform Redis operation {operation}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};

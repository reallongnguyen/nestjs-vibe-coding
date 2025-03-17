import { HttpStatus } from '@nestjs/common';
import { ContentErrorCode } from './content.error-codes';

/**
 * Error definition interface
 */
export interface ErrorDefinition {
  message: string;
  status: HttpStatus;
}

/**
 * Error definitions for Content module
 * Each error code maps to a message template and HTTP status code
 */
export const CONTENT_ERRORS: Record<ContentErrorCode, ErrorDefinition> = {
  [ContentErrorCode.DRAFT_CREATE_FAILED]: {
    message: 'Failed to create draft post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.DRAFT_UPDATE_FAILED]: {
    message: 'Failed to update draft post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.DRAFT_NOT_FOUND]: {
    message: 'Draft post not found with ID: {{draftId}}',
    status: HttpStatus.NOT_FOUND,
  },
  [ContentErrorCode.DRAFT_NOT_OWNER]: {
    message: 'Not authorized to access draft with ID: {{draftId}}',
    status: HttpStatus.FORBIDDEN,
  },
  [ContentErrorCode.DRAFT_DELETE_FAILED]: {
    message: 'Failed to delete draft post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.DRAFT_PUBLISH_FAILED]: {
    message: 'Failed to publish draft post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.DRAFT_NOT_LINKED_TO_PUBLISHED]: {
    message: 'Draft with ID: {{draftId}} is not linked to a published post',
    status: HttpStatus.BAD_REQUEST,
  },
  [ContentErrorCode.PUBLISHED_POST_NOT_FOUND]: {
    message: 'Published post not found with ID: {{postId}}',
    status: HttpStatus.NOT_FOUND,
  },
  [ContentErrorCode.PUBLISHED_POST_NOT_OWNER]: {
    message: 'Not authorized to access published post with ID: {{postId}}',
    status: HttpStatus.FORBIDDEN,
  },
  [ContentErrorCode.PUBLISHED_POST_DELETE_FAILED]: {
    message: 'Failed to delete published post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.POST_UPDATE_FAILED]: {
    message: 'Failed to update post: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ContentErrorCode.TOPIC_NOT_FOUND]: {
    message: 'One or more topics not found: {{missingTopicIds}}',
    status: HttpStatus.NOT_FOUND,
  },
  [ContentErrorCode.SLUG_EXISTS]: {
    message: 'A post with slug: {{slug}} already exists',
    status: HttpStatus.CONFLICT,
  },
  [ContentErrorCode.CONTENT_GET_FAILED]: {
    message: 'Failed to retrieve content: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};

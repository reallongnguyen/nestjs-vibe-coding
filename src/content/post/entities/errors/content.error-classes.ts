import { AppError } from 'src/common/errors/app.error';
import { ContentErrorCode } from './content.error-codes';
import { CONTENT_ERRORS } from './content.errors';

/**
 * Base error class for Content module errors
 */
export class ContentError extends AppError {
  constructor(code: ContentErrorCode, params?: Record<string, any>) {
    const errorCode = `content.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * Draft-related error classes
 */
export class DraftCreateError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.DRAFT_CREATE_FAILED,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_CREATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class DraftUpdateError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.DRAFT_UPDATE_FAILED,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_UPDATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class DraftNotFoundError extends AppError {
  constructor(draftId: string) {
    super(
      ContentErrorCode.DRAFT_NOT_FOUND,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_NOT_FOUND],
      {
        params: { draftId },
      },
    );
  }
}

export class NotDraftOwnerError extends AppError {
  constructor(userId: string, draftId: string) {
    super(
      ContentErrorCode.DRAFT_NOT_OWNER,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_NOT_OWNER],
      {
        params: { userId, draftId },
      },
    );
  }
}

export class DraftDeleteError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.DRAFT_DELETE_FAILED,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_DELETE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class DraftPublishError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.DRAFT_PUBLISH_FAILED,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_PUBLISH_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class DraftNotLinkedToPublishedError extends AppError {
  constructor(draftId: string) {
    super(
      ContentErrorCode.DRAFT_NOT_LINKED_TO_PUBLISHED,
      CONTENT_ERRORS[ContentErrorCode.DRAFT_NOT_LINKED_TO_PUBLISHED],
      {
        params: { draftId },
      },
    );
  }
}

/**
 * Published post-related error classes
 */
export class PublishedPostNotFoundError extends AppError {
  constructor(postId: string) {
    super(
      ContentErrorCode.PUBLISHED_POST_NOT_FOUND,
      CONTENT_ERRORS[ContentErrorCode.PUBLISHED_POST_NOT_FOUND],
      {
        params: { postId },
      },
    );
  }
}

export class NotPublishedPostOwnerError extends AppError {
  constructor(userId: string, postId: string) {
    super(
      ContentErrorCode.PUBLISHED_POST_NOT_OWNER,
      CONTENT_ERRORS[ContentErrorCode.PUBLISHED_POST_NOT_OWNER],
      {
        params: { userId, postId },
      },
    );
  }
}

export class PublishedPostDeleteError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.PUBLISHED_POST_DELETE_FAILED,
      CONTENT_ERRORS[ContentErrorCode.PUBLISHED_POST_DELETE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class PostUpdateError extends AppError {
  constructor(cause?: unknown) {
    super(
      ContentErrorCode.POST_UPDATE_FAILED,
      CONTENT_ERRORS[ContentErrorCode.POST_UPDATE_FAILED],
      {
        params: {
          cause: cause instanceof Error ? cause.message : JSON.stringify(cause),
        },
        cause: cause instanceof Error ? cause : undefined,
      },
    );
  }
}

/**
 * Topic-related error classes
 */
export class TopicNotFoundError extends AppError {
  constructor(missingTopicIds: string[]) {
    super(
      ContentErrorCode.TOPIC_NOT_FOUND,
      CONTENT_ERRORS[ContentErrorCode.TOPIC_NOT_FOUND],
      {
        params: { missingTopicIds: missingTopicIds.join(', ') },
      },
    );
  }
}

/**
 * Slug-related error classes
 */
export class SlugExistsError extends AppError {
  constructor(slug: string) {
    super(
      ContentErrorCode.SLUG_EXISTS,
      CONTENT_ERRORS[ContentErrorCode.SLUG_EXISTS],
      {
        params: { slug },
      },
    );
  }
}

/**
 * General content-related error classes
 */
export class ContentGetError extends AppError {
  constructor(cause?: Error) {
    super(
      ContentErrorCode.CONTENT_GET_FAILED,
      CONTENT_ERRORS[ContentErrorCode.CONTENT_GET_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

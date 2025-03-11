import { AppError } from 'src/common/models';

export class ContentAlreadyLikedError extends AppError {
  constructor(userId: string, contentId: string, contentType: string) {
    super('social.like.alreadyLiked', {
      userId,
      contentId,
      contentType,
    });
  }
}

export class ContentNotLikedError extends AppError {
  constructor(userId: string, contentId: string, contentType: string) {
    super('social.unlike.notLiked', {
      userId,
      contentId,
      contentType,
    });
  }
}

export class ContentViewError extends AppError {
  constructor(contentId: string, contentType: string, cause?: Error) {
    super('social.view.failed', {
      contentId,
      contentType,
      cause: cause?.message,
    });
  }
}

export class EngageableNotFoundError extends AppError {
  constructor(contentId: string, contentType: string) {
    super('social.engageable.notFound', {
      contentId,
      contentType,
    });
  }
}

export class RedisOperationError extends Error {
  constructor(operation: string, cause: unknown) {
    super(
      `Redis operation '${operation}' failed: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.name = 'RedisOperationError';
  }
}

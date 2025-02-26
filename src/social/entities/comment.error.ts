import { AppError } from 'src/common/models';

export class CommentNotFoundError extends AppError {
  constructor(id: string) {
    super('comment.get.notFound', {
      commentId: id,
    });
  }
}

export class CommentCreateError extends AppError {
  constructor(cause?: Error) {
    super('comment.create.failed', {
      cause: cause?.message,
    });
  }
}

export class CommentUpdateError extends AppError {
  constructor(cause?: Error) {
    super('comment.update.failed', {
      cause: cause?.message,
    });
  }
}

export class NotCommentOwnerError extends AppError {
  constructor(userId: string, commentId: string) {
    super('comment.update.notOwner', {
      userId,
      commentId,
    });
  }
}

export class CommentDeleteError extends AppError {
  constructor(cause?: Error) {
    super('comment.delete.failed', {
      cause: cause?.message,
    });
  }
}

export class CommentAlreadyLikedError extends AppError {
  constructor(userId: string, commentId: string) {
    super('comment.like.alreadyLiked', {
      userId,
      commentId,
    });
  }
}

export class CommentNotLikedError extends AppError {
  constructor(userId: string, commentId: string) {
    super('comment.unlike.notLiked', {
      userId,
      commentId,
    });
  }
}

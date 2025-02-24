import { AppError } from 'src/common/models';

export class TopicNotFoundError extends AppError {
  constructor(topicIds: string[]) {
    super('draft.create.topicNotFound', {
      missingTopicIds: topicIds.join(', '),
    });
  }
}

export class DraftCreateError extends AppError {
  constructor(cause?: Error) {
    super('draft.create.failed', {
      cause: cause?.message,
    });
  }
}

export class DraftNotFoundError extends AppError {
  constructor(id: string) {
    super('draft.notFound', {
      draftId: id,
    });
  }
}

export class DraftUpdateError extends AppError {
  constructor(cause?: Error) {
    super('draft.update.failed', {
      cause: cause?.message,
    });
  }
}

export class NotDraftOwnerError extends AppError {
  constructor(userId: string, draftId: string) {
    super('draft.notOwner', {
      userId,
      draftId,
    });
  }
}

export class SlugExistsError extends AppError {
  constructor(slug: string) {
    super('draft.publish.slugExists', {
      slug,
    });
  }
}

export class DraftPublishError extends AppError {
  constructor(cause?: Error) {
    super('draft.publish.failed', {
      cause: cause?.message,
    });
  }
}

export class PublishedPostNotFoundError extends AppError {
  constructor(id: string) {
    super('published.notFound', {
      postId: id,
    });
  }
}

export class NotPublishedPostOwnerError extends AppError {
  constructor(userId: string, postId: string) {
    super('published.notOwner', {
      userId,
      postId,
    });
  }
}

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

import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { FeedContentType } from '../feed.entity';

export class PostPublishedEvent extends BaseEvent {
  constructor(public readonly postId: string) {
    super();
  }

  eventName(): string {
    return 'post.published';
  }

  toJSON(): any {
    return {
      postId: this.postId,
    };
  }
}

export class EmotionCreatedEvent extends BaseEvent {
  constructor(public readonly emotionId: string) {
    super();
  }

  eventName(): string {
    return 'emotion.created';
  }

  toJSON(): any {
    return {
      emotionId: this.emotionId,
    };
  }
}

export class ContentProcessedEvent extends BaseEvent {
  constructor(
    public readonly type: FeedContentType,
    public readonly id: string,
    public readonly score: number,
    public readonly timestamp: Date,
  ) {
    super();
  }

  eventName(): string {
    return 'content.processed';
  }

  toJSON(): any {
    return {
      type: this.type,
      id: this.id,
      score: this.score,
      timestamp: this.timestamp,
    };
  }
}

export class PostUpdatedEvent extends BaseEvent {
  constructor(
    public readonly postId: string,
    public readonly updatedAt: Date,
  ) {
    super();
  }

  eventName(): string {
    return 'post.updated';
  }

  toJSON(): any {
    return {
      postId: this.postId,
      updatedAt: this.updatedAt,
    };
  }
}

export class PostDeletedEvent extends BaseEvent {
  constructor(public readonly postId: string) {
    super();
  }

  eventName(): string {
    return 'post.deleted';
  }

  toJSON(): any {
    return {
      postId: this.postId,
    };
  }
}

export class EmotionDeletedEvent extends BaseEvent {
  constructor(public readonly emotionId: string) {
    super();
  }

  eventName(): string {
    return 'emotion.deleted';
  }

  toJSON(): any {
    return {
      emotionId: this.emotionId,
    };
  }
}

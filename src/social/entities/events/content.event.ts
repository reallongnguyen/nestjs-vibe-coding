import {
  BaseEvent,
  SocialEventSchemas,
  ContentProcessedPayload,
} from 'src/common/event-manager';
import { v4 as uuid } from 'uuid';
import { FeedContentType } from '../feed.entity';

export class PostPublishedEvent {
  constructor(public readonly postId: string) {}

  eventName(): string {
    return 'post.published';
  }

  toJSON(): any {
    return {
      postId: this.postId,
    };
  }
}

export class EmotionCreatedEvent {
  constructor(public readonly emotionId: string) {}

  eventName(): string {
    return 'emotion.created';
  }

  toJSON(): any {
    return {
      emotionId: this.emotionId,
    };
  }
}

export class ContentProcessedEvent extends BaseEvent<ContentProcessedPayload> {
  private readonly payloadData: ContentProcessedPayload;

  constructor(
    type: FeedContentType,
    id: string,
    score: number,
    timestamp: Date,
  ) {
    super(SocialEventSchemas.CONTENT_PROCESSED, {
      correlationId: uuid(),
    });

    this.payloadData = {
      type,
      id,
      score,
      timestamp,
    };
  }

  toJSON(): ContentProcessedPayload {
    return this.payloadData;
  }
}

export class PostUpdatedEvent {
  constructor(
    public readonly postId: string,
    public readonly updatedAt: Date,
  ) {}

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

export class PostDeletedEvent {
  constructor(public readonly postId: string) {}

  eventName(): string {
    return 'post.deleted';
  }

  toJSON(): any {
    return {
      postId: this.postId,
    };
  }
}

export class EmotionDeletedEvent {
  constructor(public readonly emotionId: string) {}

  eventName(): string {
    return 'emotion.deleted';
  }

  toJSON(): any {
    return {
      emotionId: this.emotionId,
    };
  }
}

import { FeedContentType } from '../entities/feed.entity';

export interface PostPublishedEvent {
  postId: string;
}

export interface EmotionCreatedEvent {
  emotionId: string;
}

export interface ContentProcessedEvent {
  type: FeedContentType;
  id: string;
  score: number;
  timestamp: Date;
}

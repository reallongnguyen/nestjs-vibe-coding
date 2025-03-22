import { IEvent } from '@nestjs/cqrs';

export interface TweetImageCleanupEventPayload {
  tweetId: string;
  imageUrls: string[];
  timestamp: number;
}

export class TweetImageCleanupEvent implements IEvent {
  constructor(public readonly payload: TweetImageCleanupEventPayload) {}
}

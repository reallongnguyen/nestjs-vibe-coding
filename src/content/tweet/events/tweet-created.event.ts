import { IEvent } from '@nestjs/cqrs';

export interface TweetCreatedEventPayload {
  tweetId: string;
  userId: string;
  content: string;
  images: string[];
  timestamp: number;
}

export class TweetCreatedEvent implements IEvent {
  constructor(public readonly payload: TweetCreatedEventPayload) {}
}

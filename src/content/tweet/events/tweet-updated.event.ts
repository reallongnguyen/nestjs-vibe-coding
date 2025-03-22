import { IEvent } from '@nestjs/cqrs';

export interface TweetUpdatedEventPayload {
  tweetId: string;
  userId: string;
  content: string;
  images: string[];
  isArchived: boolean;
  timestamp: number;
}

export class TweetUpdatedEvent implements IEvent {
  constructor(public readonly payload: TweetUpdatedEventPayload) {}
}

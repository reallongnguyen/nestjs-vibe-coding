import { IEvent } from '@nestjs/cqrs';

export interface TweetDeletedEventPayload {
  tweetId: string;
  userId: string;
  timestamp: number;
}

export class TweetDeletedEvent implements IEvent {
  constructor(public readonly payload: TweetDeletedEventPayload) {}
}

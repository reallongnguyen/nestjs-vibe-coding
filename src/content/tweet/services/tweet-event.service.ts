import { Injectable, Logger, Inject } from '@nestjs/common';
import { IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { Retry } from 'src/common/decorators/retry.decorator';
import {
  TweetCreatedEvent,
  TweetDeletedEvent,
  TweetUpdatedEvent,
} from '../entities/events/tweet.events';
import { Tweet } from '../models/tweet.model';

@Injectable()
export class TweetEventService {
  private readonly logger = new Logger(TweetEventService.name);

  constructor(@Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus) {}

  @Retry({
    maxAttempts: 3,
    backoffMs: 100,
    exponential: true,
  })
  async publishTweetCreatedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetCreatedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      content: tweet.content,
      images: tweet.images,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }

  @Retry({
    maxAttempts: 3,
    backoffMs: 100,
    exponential: true,
  })
  async publishTweetUpdatedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetUpdatedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      content: tweet.content,
      images: tweet.images,
      isArchived: tweet.isArchived,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }

  @Retry({
    maxAttempts: 3,
    backoffMs: 100,
    exponential: true,
  })
  async publishTweetDeletedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetDeletedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }
}

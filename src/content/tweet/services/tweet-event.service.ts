import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { TweetCreatedEvent } from '../events/tweet-created.event';
import { TweetUpdatedEvent } from '../events/tweet-updated.event';
import { TweetDeletedEvent } from '../events/tweet-deleted.event';
import { Tweet } from '../models/tweet.model';

@Injectable()
export class TweetEventService {
  private readonly logger = new Logger(TweetEventService.name);
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 100; // 100ms

  constructor(private readonly eventBus: EventBus) {}

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const executeAttempt = async (attempt: number): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        const delayTime = TweetEventService.BASE_DELAY * 2 ** attempt;

        this.logger.warn(
          `Failed to publish ${context} (attempt ${attempt + 1}/${
            TweetEventService.MAX_RETRIES
          }): ${error.message}`,
        );

        if (attempt >= TweetEventService.MAX_RETRIES - 1) {
          const errorMessage = `Failed to publish ${context} after ${TweetEventService.MAX_RETRIES} attempts`;
          this.logger.error(errorMessage, error.stack);
          throw new Error(errorMessage);
        }

        await delay(delayTime);
        return executeAttempt(attempt + 1);
      }
    };

    return executeAttempt(0);
  }

  async publishTweetCreatedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetCreatedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      content: tweet.content,
      images: tweet.images,
      timestamp: Date.now(),
    });

    await this.retryWithExponentialBackoff(
      () => this.eventBus.publish(event),
      'tweet created event',
    );
  }

  async publishTweetUpdatedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetUpdatedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      content: tweet.content,
      images: tweet.images,
      isArchived: tweet.isArchived,
      timestamp: Date.now(),
    });

    await this.retryWithExponentialBackoff(
      () => this.eventBus.publish(event),
      'tweet updated event',
    );
  }

  async publishTweetDeletedEvent(tweet: Tweet): Promise<void> {
    const event = new TweetDeletedEvent({
      tweetId: tweet.id,
      userId: tweet.userId,
      timestamp: Date.now(),
    });

    await this.retryWithExponentialBackoff(
      () => this.eventBus.publish(event),
      'tweet deleted event',
    );
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { Retry } from 'src/common/decorators/retry.decorator';
import { CreateTweetDto } from '../dtos/create-tweet.dto';
import { UpdateTweetDto } from '../dtos/update-tweet.dto';
import { TweetDto } from '../dtos/tweet.dto';
import { Tweet } from '../models/tweet.model';
import {
  FindTweetsOptions,
  TweetRepository,
} from '../repositories/tweet.repository';
import { TWEET_REPOSITORY } from '../tweet.constants';
import { TweetUserService } from './tweet-user.service';
import { TweetImageService } from './tweet-image.service';
import { TweetEventService } from './tweet-event.service';
import { TweetErrorFactory } from '../entities/errors';

@Injectable()
export class TweetService {
  private readonly logger = new Logger(TweetService.name);

  constructor(
    @Inject(TWEET_REPOSITORY)
    private readonly tweetRepository: TweetRepository,
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly tweetUserService: TweetUserService,
    private readonly tweetImageService: TweetImageService,
    private readonly tweetEventService: TweetEventService,
  ) {}

  async createTweet(createTweetDto: CreateTweetDto): Promise<TweetDto> {
    const { content, images, userId } = createTweetDto;

    // Validate tweet content
    if (!content || content.trim().length === 0) {
      throw TweetErrorFactory.contentEmpty();
    }

    if (content.length > 280) {
      throw TweetErrorFactory.contentTooLong();
    }

    // Validate images
    if (images && images.length > 0) {
      await this.tweetImageService.validateImages(images, userId);
    }

    const tweet = await this.tweetRepository.create({
      content,
      images: images || [],
      userId,
    });

    // Publish tweet created event
    await this.publishTweetCreatedEvent(tweet);

    // Enrich with user data
    return this.enrichTweetWithUser(tweet);
  }

  async getTweetById(id: string): Promise<Tweet> {
    const tweet = await this.tweetRepository.findById(id);

    if (!tweet) {
      throw TweetErrorFactory.tweetNotFound(id);
    }

    return tweet;
  }

  async getTweetsByUserId(
    userId: string,
    options?: FindTweetsOptions,
  ): Promise<TweetDto[]> {
    const tweets = await this.tweetRepository.findByUserId(userId, options);
    return this.enrichTweetsWithUsers(tweets);
  }

  private async enrichTweetWithUser(tweet: Tweet): Promise<TweetDto> {
    const userData = await this.tweetUserService.getUserData(tweet.userId);

    return {
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      userId: tweet.userId,
      isArchived: tweet.isArchived,
      version: tweet.version,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      author: userData
        ? {
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: userData.avatar,
          }
        : undefined,
    };
  }

  private async enrichTweetsWithUsers(tweets: Tweet[]): Promise<TweetDto[]> {
    if (tweets.length === 0) {
      return [];
    }

    const userIds = [...new Set(tweets.map((tweet) => tweet.userId))];
    const usersData = await this.tweetUserService.getUsersData(userIds);

    return tweets.map((tweet) => {
      const userData = usersData.get(tweet.userId);
      return {
        id: tweet.id,
        content: tweet.content,
        images: tweet.images,
        userId: tweet.userId,
        isArchived: tweet.isArchived,
        version: tweet.version,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
        author: userData
          ? {
              firstName: userData.firstName,
              lastName: userData.lastName,
              avatar: userData.avatar,
            }
          : undefined,
      };
    });
  }

  async countTweetsByUserId(
    userId: string,
    includeArchived = false,
  ): Promise<number> {
    return this.tweetRepository.countByUserId(userId, includeArchived);
  }

  @Retry({
    maxAttempts: 3,
    backoffMs: 100,
    exponential: true,
    retryableErrors: [Error],
  })
  async updateTweet(
    id: string,
    userId: string,
    updateTweetDto: UpdateTweetDto,
  ): Promise<TweetDto> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw TweetErrorFactory.unauthorized('update');
    }

    const { content, images } = updateTweetDto;

    // Validate tweet content if provided
    if (content !== undefined) {
      if (content.trim().length === 0) {
        throw TweetErrorFactory.contentEmpty();
      }

      if (content.length > 280) {
        throw TweetErrorFactory.contentTooLong();
      }
    }

    // Validate images if provided
    if (images !== undefined) {
      await this.tweetImageService.validateImages(images, userId);
    }

    // If images are being updated, trigger cleanup for old images
    if (images !== undefined && tweet.images.length > 0) {
      await this.tweetImageService.triggerCleanup(tweet.images, tweet.id);
    }

    const updatedTweet = tweet.update(
      content ?? tweet.content,
      images ?? tweet.images,
    );

    const savedTweet = await this.tweetRepository.update(updatedTweet);

    // Publish tweet updated event
    await this.publishTweetUpdatedEvent(savedTweet);

    return this.enrichTweetWithUser(savedTweet);
  }

  @Retry({
    maxAttempts: 3,
    backoffMs: 100,
    exponential: true,
    retryableErrors: [Error],
  })
  async archiveTweet(id: string, userId: string): Promise<TweetDto> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw TweetErrorFactory.unauthorized('archive');
    }

    const archivedTweet = tweet.archive();
    const savedTweet = await this.tweetRepository.update(archivedTweet);

    // Publish tweet updated event
    await this.publishTweetUpdatedEvent(savedTweet);

    return this.enrichTweetWithUser(savedTweet);
  }

  async deleteTweet(id: string, userId: string): Promise<void> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw TweetErrorFactory.unauthorized('delete');
    }

    // Trigger cleanup for tweet images
    if (tweet.images.length > 0) {
      await this.tweetImageService.triggerCleanup(tweet.images, tweet.id);
    }

    await this.tweetRepository.delete(id);

    // Publish tweet deleted event
    await this.publishTweetDeletedEvent(tweet);
  }

  private async publishTweetCreatedEvent(tweet: Tweet): Promise<void> {
    try {
      await this.tweetEventService.publishTweetCreatedEvent(tweet);
    } catch (error) {
      this.logger.error('Failed to publish tweet created event:', error);
    }
  }

  private async publishTweetUpdatedEvent(tweet: Tweet): Promise<void> {
    try {
      await this.tweetEventService.publishTweetUpdatedEvent(tweet);
    } catch (error) {
      this.logger.error('Failed to publish tweet updated event:', error);
    }
  }

  private async publishTweetDeletedEvent(tweet: Tweet): Promise<void> {
    try {
      await this.tweetEventService.publishTweetDeletedEvent(tweet);
    } catch (error) {
      this.logger.error('Failed to publish tweet deleted event:', error);
    }
  }
}

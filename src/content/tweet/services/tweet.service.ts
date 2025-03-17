import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Tweet } from '../entities/tweet.entity';
import {
  TWEET_REPOSITORY,
  TweetRepository,
} from '../repositories/tweet.repository';
import {
  TweetCreatedEvent,
  TweetUpdatedEvent,
  TweetDeletedEvent,
} from '../entities/events/tweet.events';

export interface CreateTweetDto {
  content: string;
  images: string[];
  userId: string;
}

export interface UpdateTweetDto {
  content?: string;
  images?: string[];
}

export interface FindTweetsOptions {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

@Injectable()
export class TweetService {
  private readonly logger = new Logger(TweetService.name);

  constructor(
    @Inject(TWEET_REPOSITORY)
    private readonly tweetRepository: TweetRepository,
    @InjectEventBus() private readonly eventBus: IEventBus,
    private readonly prismaService: PrismaService,
  ) {}

  async createTweet(createTweetDto: CreateTweetDto): Promise<Tweet> {
    const { content, images, userId } = createTweetDto;

    // Validate tweet content
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Tweet content cannot be empty');
    }

    if (content.length > 280) {
      throw new BadRequestException(
        'Tweet content cannot exceed 280 characters',
      );
    }

    // Validate images
    if (images && images.length > 4) {
      throw new BadRequestException('Tweet cannot have more than 4 images');
    }

    const tweet = await this.tweetRepository.create({
      content,
      images: images || [],
      userId,
    });

    // Publish tweet created event instead of directly syncing with Gorse
    await this.publishTweetCreatedEvent(tweet);

    return tweet;
  }

  private async publishTweetCreatedEvent(tweet: Tweet): Promise<void> {
    try {
      const event = new TweetCreatedEvent({
        tweetId: tweet.id,
        userId: tweet.userId,
        content: tweet.content,
        images: tweet.images,
      });

      await this.eventBus.publish(event);
    } catch (error) {
      this.logger.error(
        `Failed to publish tweet created event: ${error.message}`,
        error.stack,
      );
    }
  }

  async getTweetById(id: string): Promise<Tweet> {
    const tweet = await this.tweetRepository.findById(id);

    if (!tweet) {
      throw new NotFoundException(`Tweet with ID ${id} not found`);
    }

    return tweet;
  }

  async getTweetsByUserId(
    userId: string,
    options?: FindTweetsOptions,
  ): Promise<Tweet[]> {
    return this.tweetRepository.findByUserId(userId, options);
  }

  async countTweetsByUserId(
    userId: string,
    includeArchived = false,
  ): Promise<number> {
    return this.tweetRepository.countByUserId(userId, includeArchived);
  }

  async updateTweet(
    id: string,
    userId: string,
    updateTweetDto: UpdateTweetDto,
  ): Promise<Tweet> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw new BadRequestException(
        'You are not authorized to update this tweet',
      );
    }

    const { content, images } = updateTweetDto;

    // Validate tweet content if provided
    if (content !== undefined) {
      if (content.trim().length === 0) {
        throw new BadRequestException('Tweet content cannot be empty');
      }

      if (content.length > 280) {
        throw new BadRequestException(
          'Tweet content cannot exceed 280 characters',
        );
      }
    }

    // Validate images if provided
    if (images !== undefined && images.length > 4) {
      throw new BadRequestException('Tweet cannot have more than 4 images');
    }

    const updatedTweet = new Tweet(
      tweet.id,
      content ?? tweet.content,
      images ?? tweet.images,
      tweet.userId,
      tweet.isArchived,
      tweet.createdAt,
      new Date(),
    );

    const savedTweet = await this.tweetRepository.update(updatedTweet);

    // Publish tweet updated event
    await this.publishTweetUpdatedEvent(savedTweet);

    return savedTweet;
  }

  private async publishTweetUpdatedEvent(tweet: Tweet): Promise<void> {
    try {
      const event = new TweetUpdatedEvent({
        tweetId: tweet.id,
        userId: tweet.userId,
        content: tweet.content,
        images: tweet.images,
      });

      await this.eventBus.publish(event);
    } catch (error) {
      this.logger.error(
        `Failed to publish tweet updated event: ${error.message}`,
        error.stack,
      );
    }
  }

  async archiveTweet(id: string, userId: string): Promise<Tweet> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw new BadRequestException(
        'You are not authorized to archive this tweet',
      );
    }

    const archivedTweet = tweet.archive();
    const savedTweet = await this.tweetRepository.update(archivedTweet);

    // Publish tweet updated event (with isArchived = true in the model)
    await this.publishTweetUpdatedEvent(savedTweet);

    return savedTweet;
  }

  async deleteTweet(id: string, userId: string): Promise<void> {
    const tweet = await this.getTweetById(id);

    // Check if the user owns the tweet
    if (!tweet.isOwner(userId)) {
      throw new BadRequestException(
        'You are not authorized to delete this tweet',
      );
    }

    // Store images before deletion for cleanup
    const images = tweet.images || [];

    // Use a database transaction to ensure consistency between
    // tweet deletion and event publishing
    await this.prismaService.$transaction(async (prisma) => {
      // Delete the tweet (repository should be updated to accept tx)
      await this.tweetRepository.delete(id, prisma);

      // Publish tweet deleted event with images for cleanup
      // This ensures the event is only published if the tweet is deleted successfully
      await this.publishTweetDeletedEvent(id, userId, images);
    });
  }

  private async publishTweetDeletedEvent(
    tweetId: string,
    userId: string,
    images: string[] = [],
  ): Promise<void> {
    try {
      const event = new TweetDeletedEvent({
        tweetId,
        userId,
        images, // Include images in the payload for cleanup
      });

      await this.eventBus.publish(event);
    } catch (error) {
      // Log the error but don't rethrow it
      this.logger.error(
        `Failed to publish tweet deleted event: ${error.message}`,
      );
    }
  }
}

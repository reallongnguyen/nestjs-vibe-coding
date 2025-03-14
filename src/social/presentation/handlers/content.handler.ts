import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import {
  ContentProcessedEvent,
  PostPublishedEvent,
  PostUpdatedEvent,
  PostDeletedEvent,
  EmotionCreatedEvent,
  EmotionDeletedEvent,
} from '../../entities/events/content.event';
import { ContentProcessorService } from '../../services/content-processor.service';
import { FeedDistributionService } from '../../services/feed-distribution.service';
import { FeedCacheService } from '../../services/feed-cache.service';

@Injectable()
export class ContentHandler {
  constructor(
    private readonly contentProcessor: ContentProcessorService,
    private readonly distributionService: FeedDistributionService,
    private readonly cacheService: FeedCacheService,
    private readonly logger: Logger,
  ) {}

  @OnEvent('post.published')
  async handlePostPublished(event: PostPublishedEvent): Promise<void> {
    await this.contentProcessor.processPost(event.postId);
  }

  @OnEvent('post.updated')
  async handlePostUpdated(event: PostUpdatedEvent): Promise<void> {
    await this.contentProcessor.processPost(event.postId);
  }

  @OnEvent('post.deleted')
  async handlePostDeleted(event: PostDeletedEvent): Promise<void> {
    await this.contentProcessor.removePost(event.postId);
  }

  @OnEvent('emotion.created')
  async handleEmotionCreated(event: EmotionCreatedEvent): Promise<void> {
    await this.contentProcessor.processEmotion(event.emotionId);
  }

  @OnEvent('emotion.deleted')
  async handleEmotionDeleted(event: EmotionDeletedEvent): Promise<void> {
    await this.contentProcessor.removeEmotion(event.emotionId);
  }

  @OnEvent('social.content.processed')
  async handleContentProcessed(event: ContentProcessedEvent): Promise<void> {
    try {
      const eventData = event.toJSON();
      await this.distributionService.distributeContent(event);
      await this.cacheService.invalidateUserFeeds();

      this.logger.log(
        `Content ${eventData.id} processed and distributed with score ${eventData.score}`,
      );
    } catch (error) {
      const eventData = event.toJSON();
      this.logger.error(
        `Failed to handle processed content ${eventData.id}: ${error.message}`,
      );
      throw error;
    }
  }
}

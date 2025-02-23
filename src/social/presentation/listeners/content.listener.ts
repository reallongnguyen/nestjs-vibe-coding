import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentProcessorService } from '../../services/content-processor.service';
import {
  PostPublishedEvent,
  EmotionCreatedEvent,
} from '../../entities/events/content.event';

@Injectable()
export class ContentListener {
  constructor(private readonly contentProcessor: ContentProcessorService) {}

  @OnEvent('post.published')
  async handlePostPublished(event: PostPublishedEvent): Promise<void> {
    await this.contentProcessor.processPost(event.postId);
  }

  @OnEvent('emotion.created')
  async handleEmotionCreated(event: EmotionCreatedEvent): Promise<void> {
    await this.contentProcessor.processEmotion(event.emotionId);
  }
}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentProcessorService } from '../services/content-processor.service';
import {
  PostPublishedEvent,
  EmotionCreatedEvent,
} from '../events/content.event';

@Injectable()
export class ContentListener {
  constructor(private readonly contentProcessor: ContentProcessorService) {}

  @OnEvent('post.published')
  async handlePostPublished(payload: PostPublishedEvent): Promise<void> {
    await this.contentProcessor.processPost(payload.postId);
  }

  @OnEvent('emotion.created')
  async handleEmotionCreated(payload: EmotionCreatedEvent): Promise<void> {
    await this.contentProcessor.processEmotion(payload.emotionId);
  }
}

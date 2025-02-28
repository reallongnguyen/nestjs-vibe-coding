import {
  OnModuleInit,
  OnModuleDestroy,
  Injectable,
  Inject,
} from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { OnEvent } from '@nestjs/event-emitter';
import { EmotionLikedEvent } from '../../entities/events/emotion-liked.event';
import { PostLikedEvent } from '../../entities/events/post-liked.event';
import { PostUnlikedEvent } from '../../entities/events/post-unliked.event';
import { EmotionUnlikedEvent } from '../../entities/events/emotion-unliked.event';
import { ILikeRepository } from '../../services/interfaces/like-repository.interface';

export interface LikeOperation {
  contentId: string;
  contentType: string;
  userId: string;
  operation: 'like' | 'unlike';
}

@Injectable()
export class UpdateLikeCountHandler implements OnModuleInit, OnModuleDestroy {
  protected emotionLikeProcessor: RedisBatchProcessor<LikeOperation>;
  protected postLikeProcessor: RedisBatchProcessor<LikeOperation>;
  constructor(
    protected readonly redisService: RedisService,
    @Inject('ILikeRepository')
    protected readonly likeEngagementHelper: ILikeRepository,
  ) {}

  async onModuleInit() {
    const redis = this.redisService.getOrThrow();

    this.emotionLikeProcessor = new RedisBatchProcessor(redis, {
      batchKey: `emotion:likes:batch`,
      batchSize: 100,
      batchTimeout: 8000,
      processBatch: async (items) => {
        await this.likeEngagementHelper.batchUpdateLikeCount(items);
      },
    });

    this.postLikeProcessor = new RedisBatchProcessor(redis, {
      batchKey: `post:likes:batch`,
      batchSize: 100,
      batchTimeout: 8000,
      processBatch: async (items) => {
        await this.likeEngagementHelper.batchUpdateLikeCount(items);
      },
    });
  }

  async onModuleDestroy() {
    if (this.emotionLikeProcessor) {
      await this.emotionLikeProcessor.onApplicationShutdown();
    }

    if (this.postLikeProcessor) {
      await this.postLikeProcessor.onApplicationShutdown();
    }
  }

  @OnEvent(EmotionLikedEvent.eventName)
  async handleEmotionLiked(event: EmotionLikedEvent) {
    const payload = event.toJSON();

    await this.emotionLikeProcessor.add({
      contentId: payload.emotionId,
      contentType: 'EMOTION',
      userId: payload.userId,
      operation: 'like',
    });
  }

  @OnEvent(PostLikedEvent.eventName)
  async handlePostLiked(event: PostLikedEvent) {
    const payload = event.toJSON();

    await this.postLikeProcessor.add({
      contentId: payload.postId,
      contentType: 'POST',
      userId: payload.userId,
      operation: 'like',
    });
  }

  @OnEvent(PostUnlikedEvent.eventName)
  async handlePostUnliked(event: PostUnlikedEvent) {
    const payload = event.toJSON();

    await this.postLikeProcessor.add({
      contentId: payload.postId,
      contentType: 'POST',
      userId: payload.userId,
      operation: 'unlike',
    });
  }

  @OnEvent(EmotionUnlikedEvent.eventName)
  async handleEmotionUnliked(event: EmotionUnlikedEvent) {
    const payload = event.toJSON();

    await this.emotionLikeProcessor.add({
      contentId: payload.emotionId,
      contentType: 'EMOTION',
      userId: payload.userId,
      operation: 'unlike',
    });
  }
}

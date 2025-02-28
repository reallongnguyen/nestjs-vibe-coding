import {
  OnModuleInit,
  OnModuleDestroy,
  Injectable,
  Inject,
} from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { OnEvent } from '@nestjs/event-emitter';
import { IViewRepository } from '../../services/interfaces/view-repository.interface';
import { PostViewedEvent } from '../../entities/events/post-viewed.event';
import { EmotionViewedEvent } from '../../entities/events/emotion-viewed.event';

export interface ViewOperation {
  contentId: string;
  contentType: string;
  viewerHash: string;
  viewerId?: string;
}

@Injectable()
export class UpdateViewCountHandler implements OnModuleInit, OnModuleDestroy {
  protected postViewProcessor: RedisBatchProcessor<ViewOperation>;
  protected emotionViewProcessor: RedisBatchProcessor<ViewOperation>;
  constructor(
    protected readonly redisService: RedisService,
    @Inject('IViewRepository')
    protected readonly viewEngagementHelper: IViewRepository,
  ) {}

  async onModuleInit() {
    const redis = this.redisService.getOrThrow();

    this.postViewProcessor = new RedisBatchProcessor(redis, {
      batchKey: `post:views:batch`,
      batchSize: 100,
      batchTimeout: 8000,
      processBatch: async (items) => {
        await this.viewEngagementHelper.batchInsertView(items);
      },
    });

    this.emotionViewProcessor = new RedisBatchProcessor(redis, {
      batchKey: `emotion:views:batch`,
      batchSize: 100,
      batchTimeout: 8000,
      processBatch: async (items) => {
        await this.viewEngagementHelper.batchInsertView(items);
      },
    });
  }

  async onModuleDestroy() {
    if (this.postViewProcessor) {
      await this.postViewProcessor.onApplicationShutdown();
    }

    if (this.emotionViewProcessor) {
      await this.emotionViewProcessor.onApplicationShutdown();
    }
  }

  @OnEvent(PostViewedEvent.eventName)
  async handlePostViewed(event: PostViewedEvent) {
    const payload = event.toJSON();

    await this.postViewProcessor.add({
      contentId: payload.postId,
      contentType: 'POST',
      viewerHash: payload.viewerHash,
      viewerId: payload.viewerId,
    });
  }

  @OnEvent(EmotionViewedEvent.eventName)
  async handleEmotionViewed(event: EmotionViewedEvent) {
    const payload = event.toJSON();

    await this.emotionViewProcessor.add({
      contentId: payload.emotionId,
      contentType: 'EMOTION',
      viewerHash: payload.viewerHash,
      viewerId: payload.viewerId,
    });
  }
}

import {
  OnModuleInit,
  OnModuleDestroy,
  Injectable,
  Inject,
} from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocialEventSchemas, EventBusMessage } from 'src/common/event-manager';
import { IViewRepository } from '../../services/interfaces/view-repository.interface';

export interface ViewOperation {
  contentId: string;
  contentType: string;
  viewerHash: string;
  viewerId?: string;
}

@Injectable()
export class UpdateViewCountHandler implements OnModuleInit, OnModuleDestroy {
  protected viewProcessor: RedisBatchProcessor<ViewOperation>;

  constructor(
    protected readonly redisService: RedisService,
    @Inject('IViewRepository')
    protected readonly viewEngagementHelper: IViewRepository,
  ) {}

  async onModuleInit() {
    const redis = this.redisService.getOrThrow();

    this.viewProcessor = new RedisBatchProcessor(redis, {
      batchKey: `content:views:batch`,
      batchSize: 100,
      batchTimeout: 8000,
      processBatch: async (items) => {
        await this.viewEngagementHelper.batchInsertView(items);
      },
    });
  }

  async onModuleDestroy() {
    if (this.viewProcessor) {
      await this.viewProcessor.onApplicationShutdown();
    }
  }

  @OnEvent(SocialEventSchemas.CONTENT_VIEWED.eventName)
  async handleContentViewed(
    event: EventBusMessage<typeof SocialEventSchemas.CONTENT_VIEWED.schema>,
  ) {
    const { contentId, contentType, viewerHash, viewerId } = event.payload;

    await this.viewProcessor.add({
      contentId,
      contentType,
      viewerHash,
      viewerId,
    });
  }
}

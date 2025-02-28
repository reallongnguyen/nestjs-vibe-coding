import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { OnEvent } from '@nestjs/event-emitter';

import { CommentCreatedEvent } from '../../entities/events/comment-created.event';
import { SocialEngagementService } from '../../services/social-engagement.service';

interface CommentCountUpdate {
  type: string;
  contentId: string;
}

@Injectable()
export class UpdateCommentCountHandler
  implements OnModuleInit, OnModuleDestroy
{
  private commentCountProcessor: RedisBatchProcessor<CommentCountUpdate>;

  constructor(
    private readonly redisService: RedisService,
    private readonly socialEngagementService: SocialEngagementService,
  ) {}

  async onModuleInit() {
    const redis = this.redisService.getOrThrow();

    this.commentCountProcessor = new RedisBatchProcessor<CommentCountUpdate>(
      redis,
      {
        batchKey: 'comments:count:updates',
        batchSize: 100,
        batchTimeout: 5000,
        processBatch: async (updates) => {
          await this.socialEngagementService.batchUpdateCommentCount(updates);
        },
      },
    );
  }

  async onModuleDestroy() {
    await this.commentCountProcessor.onApplicationShutdown();
  }

  @OnEvent(CommentCreatedEvent.getEventName())
  async handleCommentCreated(event: CommentCreatedEvent) {
    const type = event.comment.postId ? 'POST' : 'EMOTION';
    const contentId = event.comment.postId || event.comment.emotionId;

    if (!contentId) {
      return;
    }

    await this.commentCountProcessor.add({
      type,
      contentId,
    });
  }
}

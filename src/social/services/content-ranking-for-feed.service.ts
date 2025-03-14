import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { Retry } from 'src/common/decorators/retry.decorator';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { InjectEventBus, IEventBus } from 'src/common/event-manager';

import { FeedContentType } from '../entities/feed.entity';
import { ContentProcessedEvent } from '../entities/events/content.event';

@Injectable()
export class ContentRankingForFeedService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
    private readonly logger: Logger,
  ) {}

  @Retry({
    maxAttempts: 3,
    retryableErrors: [PrismaClientKnownRequestError],
  })
  async processPost(postId: string): Promise<void> {
    const post = await this.prisma.publishedPost.findUnique({
      where: { id: postId },
      include: {
        comments: true,
      },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      return;
    }

    const score = this.calculatePostScore(post);

    await this.publishWithRetry(
      new ContentProcessedEvent(
        FeedContentType.POST,
        postId,
        score,
        post.publishedAt,
      ),
    );
  }

  @Retry({
    maxAttempts: 3,
    retryableErrors: [PrismaClientKnownRequestError],
  })
  async processEmotion(emotionId: string): Promise<void> {
    const emotion = await this.prisma.userEmotion.findUnique({
      where: { id: emotionId },
    });

    if (!emotion) {
      this.logger.warn(`Emotion ${emotionId} not found`);
      return;
    }

    const score = this.calculateEmotionScore(emotion);

    await this.publishWithRetry(
      new ContentProcessedEvent(
        FeedContentType.USER_EMOTION,
        emotionId,
        score,
        emotion.createdAt,
      ),
    );
  }

  @Retry()
  private async publishWithRetry(event: ContentProcessedEvent): Promise<void> {
    await this.eventBus.publish(event);
  }

  async removeContent(type: FeedContentType, contentId: string): Promise<void> {
    await this.eventBus.publish(
      new ContentProcessedEvent(type, contentId, 0, new Date()),
    );
    this.logger.log(`Content ${contentId} marked for removal from feed`);
  }

  private calculatePostScore(post: any): number {
    const engagement = post.likes.length + post.comments.length;
    const timeDiff = (Date.now() - post.publishedAt.getTime()) / 1000 / 60 / 60;
    return (engagement * 1000) / (timeDiff + 1);
  }

  private calculateEmotionScore(emotion: any): number {
    const timeDiff =
      (Date.now() - emotion.createdAt.getTime()) / 1000 / 60 / 60;
    return (emotion.intensity * 1000) / (timeDiff + 1);
  }
}

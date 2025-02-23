import { Process, Processor } from '@nestjs/bull';
import { Logger } from 'nestjs-pino';
import { Job } from 'bull';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';
import { Inject } from '@nestjs/common';
import { FeedContentType } from '../../entities/feed.entity';
import { ContentProcessedEvent } from '../../entities/events/content.event';

@Processor('content-processing')
export class ContentProcessor {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
    private readonly logger: Logger,
  ) {}

  @Process('process-post')
  async processPost(job: Job<{ postId: string }>): Promise<void> {
    const { postId } = job.data;

    const post = await this.prisma.publishedPost.findUnique({
      where: { id: postId },
      include: {
        likes: true,
        comments: true,
      },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      return;
    }

    // Calculate post score based on engagement
    const score = this.calculatePostScore(post);

    // Emit typed event
    await this.eventBus.publish(
      new ContentProcessedEvent(
        FeedContentType.POST,
        postId,
        score,
        post.publishedAt,
      ),
    );
  }

  @Process('process-emotion')
  async processEmotion(job: Job<{ emotionId: string }>): Promise<void> {
    const { emotionId } = job.data;

    const emotion = await this.prisma.userEmotion.findUnique({
      where: { id: emotionId },
    });

    if (!emotion) {
      this.logger.warn(`Emotion ${emotionId} not found`);
      return;
    }

    // Calculate emotion score based on intensity
    const score = this.calculateEmotionScore(emotion);

    // Emit typed event
    await this.eventBus.publish(
      new ContentProcessedEvent(
        FeedContentType.USER_EMOTION,
        emotionId,
        score,
        emotion.createdAt,
      ),
    );
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

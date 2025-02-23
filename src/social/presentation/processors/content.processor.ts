import { Process, Processor } from '@nestjs/bull';
import { Logger } from 'nestjs-pino';
import { Job } from 'bull';
import { ContentRankingForFeedService } from '../../services/content-ranking-for-feed.service';
import { FeedContentType } from '../../entities/feed.entity';

@Processor('content-processing')
export class ContentProcessor {
  constructor(
    private readonly rankingService: ContentRankingForFeedService,
    private readonly logger: Logger,
  ) {}

  @Process('process-post')
  async processPost(job: Job<{ postId: string }>): Promise<void> {
    const { postId } = job.data;
    await this.rankingService.processPost(postId);
  }

  @Process('process-emotion')
  async processEmotion(job: Job<{ emotionId: string }>): Promise<void> {
    const { emotionId } = job.data;
    await this.rankingService.processEmotion(emotionId);
  }

  @Process('remove-post')
  async removePost(job: Job<{ postId: string }>): Promise<void> {
    const { postId } = job.data;
    await this.rankingService.removeContent(FeedContentType.POST, postId);
  }

  @Process('remove-emotion')
  async removeEmotion(job: Job<{ emotionId: string }>): Promise<void> {
    const { emotionId } = job.data;
    await this.rankingService.removeContent(
      FeedContentType.USER_EMOTION,
      emotionId,
    );
  }
}

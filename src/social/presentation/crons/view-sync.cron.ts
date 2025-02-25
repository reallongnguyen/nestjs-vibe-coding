import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PostViewRepository } from '../../repositories/post-view.repository';

@Injectable()
export class ViewSyncCron {
  private readonly logger = new Logger(ViewSyncCron.name);
  private readonly batchSize = 100; // Increased batch size since we're using transactions

  constructor(
    private readonly prisma: PrismaService,
    private readonly postViewRepository: PostViewRepository,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncViewCounts() {
    this.logger.log('Starting view count sync');
    try {
      const posts = await this.prisma.publishedPost.findMany({
        select: { id: true },
      });

      for (let i = 0; i < posts.length; i += this.batchSize) {
        const batch = posts.slice(i, i + this.batchSize);
        // eslint-disable-next-line no-await-in-loop
        await this.postViewRepository.syncViewsFromRedis(
          batch.map((p) => p.id),
        );
        this.logger.debug(`Processed batch ${i / this.batchSize + 1}`);
      }

      this.logger.log(`Synced view counts for ${posts.length} posts`);
    } catch (error) {
      this.logger.error('Failed to sync view counts:', error);
    }
  }
}

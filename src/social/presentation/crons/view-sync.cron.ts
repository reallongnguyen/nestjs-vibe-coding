import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { PostViewRepository } from '../../repositories/post-view.repository';

@Injectable()
export class ViewSyncCron {
  private readonly logger = new Logger(ViewSyncCron.name);
  private readonly batchSize = 100; // Increased batch size since we're using transactions
  private readonly redis: Redis;

  constructor(
    private readonly postViewRepository: PostViewRepository,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncViewCounts() {
    this.logger.debug('Starting view count sync');
    try {
      const keys = await this.redis.keys('post:*:views:increment');

      const posts = keys.map((k) => ({
        id: k.split(':')[1],
      }));

      for (let i = 0; i < posts.length; i += this.batchSize) {
        const batch = posts.slice(i, i + this.batchSize);
        // eslint-disable-next-line no-await-in-loop
        await this.postViewRepository.syncViewsFromRedis(
          batch.map((p) => p.id),
        );
        this.logger.debug(
          `syncViewCounts: Processed batch ${i / this.batchSize + 1}`,
        );
      }

      this.logger.log(`Synced view counts for ${posts.length} posts`);
    } catch (error) {
      this.logger.error('Failed to sync view counts:', error);
    }
  }
}

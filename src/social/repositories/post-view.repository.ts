import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import Redis from 'ioredis';
import { IPostViewRepository } from '../services/interfaces/post-view.repository.interface';

interface ViewRecord {
  postId: string;
  viewerId: string | null;
  viewerHash: string;
}

@Injectable()
export class PostViewRepository
  implements IPostViewRepository, OnApplicationShutdown
{
  private readonly logger = new Logger(PostViewRepository.name);
  private readonly redis: Redis;
  private readonly batchProcessor: RedisBatchProcessor<ViewRecord>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
    this.batchProcessor = new RedisBatchProcessor(this.redis, {
      batchKey: 'post-views-batch',
      batchSize: 256,
      batchTimeout: 32000,
      timerInterval: 1000, // Process every 5 seconds
      processBatch: async (views) => {
        await this.prisma.postView.createMany({ data: views });
      },
      logger: this.logger,
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.batchProcessor.onApplicationShutdown();
  }

  async recordView(
    postId: string,
    viewerId: string | null,
    viewerHash: string,
  ): Promise<void> {
    try {
      // Check recent views in Redis
      const recentKey = `post:${postId}:views:recent:${viewerHash}`;
      const isRecent = await this.redis.get(recentKey);

      if (isRecent) {
        this.logger.debug(`Duplicate view detected for post ${postId}`);
        return;
      }

      // Add to HyperLogLog for unique views
      const uniqueKey = `post:${postId}:views:increment`;
      await this.redis.pfadd(uniqueKey, viewerHash);

      // Set TTL for recent views (10 minutes)
      await this.redis.setex(recentKey, 10 * 60, '1');

      // Add to batch processor
      await this.batchProcessor.add({
        postId,
        viewerId,
        viewerHash,
      });
    } catch (error) {
      this.logger.error(`Failed to record view: ${error.message}`);
      throw error;
    }
  }

  async getViewCount(postId: string): Promise<number> {
    const uniqueKey = `post:${postId}:views:increment`;
    const incrementCount = await this.redis.pfcount(uniqueKey);

    const viewCount = await this.prisma.publishedPost.findUnique({
      where: { id: postId },
      select: { viewCount: true },
    });

    return (viewCount?.viewCount ?? 0) + incrementCount;
  }

  async syncViewsFromRedis(postIds: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    const uniqueKeys = postIds.map((id) => `post:${id}:views:increment`);

    // Get all counts in one batch
    uniqueKeys.forEach((key) => pipeline.pfcount(key));
    const counts = await pipeline.exec();

    // Prepare updates
    const updates = postIds.map((id, index) => ({
      where: { id },
      data: { viewCount: { increment: counts[index][1] as number } },
    }));

    // Update all posts in one transaction
    await this.prisma.$transaction(
      updates.map((update) => this.prisma.publishedPost.update(update)),
    );

    // Delete view counts from Redis after syncing
    const deleteKeys = this.redis.pipeline();
    uniqueKeys.forEach((key) => deleteKeys.del(key));
    await deleteKeys.exec();
  }
}

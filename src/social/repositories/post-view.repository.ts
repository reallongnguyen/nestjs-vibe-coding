import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { IPostViewRepository } from '../services/interfaces/post-view.repository.interface';

@Injectable()
export class PostViewRepository implements IPostViewRepository {
  private readonly logger = new Logger(PostViewRepository.name);
  private readonly redis: Redis;
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
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
        return null;
      }

      // Add to HyperLogLog for unique views
      const uniqueKey = `post:${postId}:views:total`;
      await this.redis.pfadd(uniqueKey, viewerHash);

      // Set TTL for recent views (30 minutes)
      await this.redis.setex(recentKey, 30 * 60, '1');

      // Record view in database without updating count
      // Count will be synced periodically from Redis
      // Add to batch
      const batchKey = 'post-views-batch';
      const batchData = JSON.stringify({ postId, viewerId, viewerHash });
      await this.redis.rpush(batchKey, batchData);

      // Get current batch size
      const batchSize = await this.redis.llen(batchKey);
      const batchStartTime = await this.redis.get(`${batchKey}:start`);
      const shouldProcess =
        batchSize >= 100 ||
        (batchStartTime && Date.now() - parseInt(batchStartTime, 10) >= 1000);

      if (shouldProcess) {
        // Get all items
        const items = await this.redis.lrange(batchKey, 0, -1);
        await this.redis.del(batchKey);
        await this.redis.del(`${batchKey}:start`);

        // Process batch
        const views = items.map((item) => JSON.parse(item));
        await this.prisma.postView.createMany({
          data: views,
        });

        return null;
      }

      // Set start time if this is first item
      if (batchSize === 1) {
        await this.redis.set(`${batchKey}:start`, Date.now().toString());
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to record view: ${error.message}`);
      throw error;
    }
  }

  async getViewCount(postId: string): Promise<number> {
    const uniqueKey = `post:${postId}:views:total`;
    return this.redis.pfcount(uniqueKey);
  }

  async syncViewsFromRedis(postIds: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    const uniqueKeys = postIds.map((id) => `post:${id}:views:total`);

    // Get all counts in one batch
    uniqueKeys.forEach((key) => pipeline.pfcount(key));
    const counts = await pipeline.exec();

    // Prepare updates
    const updates = postIds.map((id, index) => ({
      where: { id },
      data: { viewCount: counts[index][1] },
    }));

    // Update all posts in one transaction
    await this.prisma.$transaction(
      updates.map((update) => this.prisma.publishedPost.update(update)),
    );
  }
}

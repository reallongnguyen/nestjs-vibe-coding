import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { IViewable } from '../../entities/interfaces/viewable.interface';

export interface ViewOperation {
  contentId: string;
  contentType: string;
  viewerHash: string;
  viewerId?: string;
}

/**
 * Base handler for view operations
 */
export abstract class BaseViewHandler implements IViewable {
  protected readonly viewProcessor: RedisBatchProcessor<ViewOperation>;
  protected readonly contentType: string;
  protected readonly VIEW_RECENT_TTL = 600; // 10 minutes

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
    protected readonly contentId: string,
    contentType: string,
  ) {
    this.contentType = contentType;
    const redis = this.redisService.getOrThrow();

    this.viewProcessor = new RedisBatchProcessor(redis, {
      batchKey: `${contentType}:views:batch`,
      batchSize: 100,
      batchTimeout: 1000,
      processBatch: this.processBatch.bind(this),
    });
  }

  async view(viewerHash: string, viewerId?: string): Promise<void> {
    const redis = this.redisService.getOrThrow();
    const recentKey = `${this.contentType}:${this.contentId}:views:recent:${viewerHash}`;

    // Check if this viewer has viewed recently
    const recentView = await redis.get(recentKey);
    if (recentView) {
      return;
    }

    // Set recent view flag with TTL
    await redis.setex(recentKey, this.VIEW_RECENT_TTL, '1');

    // Add to HyperLogLog for unique counting
    const hllKey = `${this.contentType}:${this.contentId}:views:hll`;
    await redis.pfadd(hllKey, viewerHash);

    // Add to batch for processing
    await this.viewProcessor.add({
      contentId: this.contentId,
      contentType: this.contentType,
      viewerHash,
      viewerId,
    });
  }

  async getViewCount(): Promise<number> {
    const engageable = await this.prisma.engageable.findUnique({
      where: {
        type_contentId: {
          type: this.contentType,
          contentId: this.contentId,
        },
      },
      select: {
        viewCount: true,
      },
    });

    return engageable?.viewCount || 0;
  }

  protected abstract processBatch(items: ViewOperation[]): Promise<void>;
}

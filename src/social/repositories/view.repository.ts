import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { IViewRepository } from '../services/interfaces/view-repository.interface';

export interface ViewOperation {
  contentId: string;
  contentType: string;
  viewerHash: string;
  viewerId?: string;
}

@Injectable()
export class ViewRepository implements IViewRepository {
  protected readonly VIEW_RECENT_TTL = 600; // 10 minutes
  protected readonly redis: Redis;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Insert a view record
   * @param contentId Content ID
   * @param contentType Content type
   * @param viewerHash Viewer hash
   * @param viewerId Viewer ID
   */
  async insertView(
    contentId: string,
    contentType: string,
    viewerHash: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewerId?: string,
  ): Promise<{ isNewView: boolean }> {
    const recentKey = `${contentType}:${contentId}:views:recent:${viewerHash}`;

    // Check if this viewer has viewed recently
    const recentView = await this.redis.get(recentKey);
    if (recentView) {
      return { isNewView: false };
    }

    // Set recent view flag with TTL
    await this.redis.setex(recentKey, this.VIEW_RECENT_TTL, '1');

    // Add to HyperLogLog for unique counting
    const hllKey = `${contentType}:${contentId}:views:hll`;
    await this.redis.pfadd(hllKey, viewerHash);

    return { isNewView: true };
  }

  /**
   * Batch insert view records
   * @param items View operations
   */
  async batchInsertView(items: ViewOperation[]): Promise<void> {
    if (items.length === 0) return;

    // Group by content ID to avoid duplicate processing
    const contentMap = new Map<string, ViewOperation[]>();

    for (const item of items) {
      const key = `${item.contentType}:${item.contentId}`;
      if (!contentMap.has(key)) {
        contentMap.set(key, []);
      }
      contentMap.get(key).push(item);
    }

    await this.prisma.$transaction(async (tx) => {
      // Process each content item
      for (const [key, operations] of contentMap.entries()) {
        const [type, contentId] = key.split(':');

        // Store view records
        // eslint-disable-next-line no-await-in-loop
        await tx.view.createMany({
          data: operations.map((op) => ({
            type: op.contentType,
            contentId: op.contentId,
            viewerId: op.viewerId,
            viewerHash: op.viewerHash,
          })),
        });

        // Update engageable record
        // eslint-disable-next-line no-await-in-loop
        await tx.engageable.upsert({
          where: {
            type_contentId: {
              type,
              contentId,
            },
          },
          create: {
            type,
            contentId,
            viewCount: operations.length,
          },
          update: {
            viewCount: {
              increment: operations.length,
            },
          },
        });
      }
    });
  }
}

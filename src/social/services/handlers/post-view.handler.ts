import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { BaseViewHandler, ViewOperation } from './base-view.handler';

@Injectable()
export class PostViewHandler extends BaseViewHandler {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
    postId: string,
  ) {
    super(prisma, redisService, postId, 'POST');
  }

  protected async processBatch(items: ViewOperation[]): Promise<void> {
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

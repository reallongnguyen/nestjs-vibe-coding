import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { IEventBus } from 'src/common/event-bus';
import { BaseViewHandler, ViewOperation } from './base-view.handler';
import { EmotionViewedEvent } from '../../entities/events/emotion-viewed.event';

@Injectable()
export class EmotionViewHandler extends BaseViewHandler {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
    private readonly eventBus: IEventBus,
    emotionId: string,
  ) {
    super(prisma, redisService, emotionId, 'EMOTION');
  }

  async view(viewerHash: string, viewerId?: string): Promise<void> {
    await super.view(viewerHash, viewerId);

    // Emit emotion viewed event
    await this.eventBus.publish(
      new EmotionViewedEvent(
        {
          emotionId: this.contentId,
          viewerHash,
          viewerId,
          timestamp: new Date(),
        },
        {
          occurredOn: new Date(),
        },
      ),
    );
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

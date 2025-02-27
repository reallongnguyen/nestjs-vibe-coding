import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { IEventBus } from 'src/common/event-bus';
import { BaseLikeHandler, LikeOperation } from './base-like.handler';
import { EmotionLikedEvent } from '../../entities/events/emotion-liked.event';
import { EmotionUnlikedEvent } from '../../entities/events/emotion-unliked.event';

@Injectable()
export class EmotionLikeHandler extends BaseLikeHandler {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
    private readonly eventBus: IEventBus,
    emotionId: string,
  ) {
    super(prisma, redisService, emotionId, 'EMOTION');
  }

  async like(userId: string): Promise<void> {
    await super.like(userId);

    // Emit emotion liked event
    await this.eventBus.publish(
      new EmotionLikedEvent(
        {
          emotionId: this.contentId,
          userId,
          timestamp: new Date(),
        },
        {
          occurredOn: new Date(),
        },
      ),
    );
  }

  async unlike(userId: string): Promise<void> {
    await super.unlike(userId);

    // Emit emotion unliked event
    await this.eventBus.publish(
      new EmotionUnlikedEvent(
        {
          emotionId: this.contentId,
          userId,
          timestamp: new Date(),
        },
        {
          occurredOn: new Date(),
        },
      ),
    );
  }

  protected async checkLikeExists(userId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        type_contentId_userId: {
          type: this.contentType,
          contentId: this.contentId,
          userId,
        },
      },
    });

    return !!like;
  }

  protected async processBatch(items: LikeOperation[]): Promise<void> {
    const likes = items.filter((item) => item.operation === 'like');
    const unlikes = items.filter((item) => item.operation === 'unlike');
    const batchSize = 32;

    await this.prisma.$transaction(async (tx) => {
      // Process likes
      if (likes.length > 0) {
        // Create likes
        await tx.like.createMany({
          data: likes.map((item) => ({
            type: item.contentType,
            contentId: item.contentId,
            userId: item.userId,
          })),
          skipDuplicates: true,
        });

        // Update engageable records in batches of 32
        for (let i = 0; i < likes.length; i += batchSize) {
          const batch = likes.slice(i, i + batchSize);
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            batch.map((like) =>
              tx.engageable.upsert({
                where: {
                  type_contentId: {
                    type: like.contentType,
                    contentId: like.contentId,
                  },
                },
                create: {
                  type: like.contentType,
                  contentId: like.contentId,
                  likeCount: 1,
                },
                update: {
                  likeCount: {
                    increment: 1,
                  },
                },
              }),
            ),
          );
        }
      }

      // Process unlikes
      if (unlikes.length > 0) {
        // Delete likes
        await tx.like.deleteMany({
          where: {
            OR: unlikes.map((item) => ({
              type: item.contentType,
              contentId: item.contentId,
              userId: item.userId,
            })),
          },
        });

        // Update engageable records in batches of 32
        for (let i = 0; i < unlikes.length; i += batchSize) {
          const batch = unlikes.slice(i, i + batchSize);
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            batch.map((unlike) =>
              tx.engageable.update({
                where: {
                  type_contentId: {
                    type: unlike.contentType,
                    contentId: unlike.contentId,
                  },
                },
                data: {
                  likeCount: {
                    decrement: 1,
                  },
                },
              }),
            ),
          );
        }
      }
    });
  }
}

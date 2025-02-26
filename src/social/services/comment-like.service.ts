import { Injectable } from '@nestjs/common';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CommentAlreadyLikedError,
  CommentNotLikedError,
} from '../entities/comment.error';

interface LikeOperation {
  commentId: string;
  userId: string;
  operation: 'like' | 'unlike';
}

@Injectable()
export class CommentLikeService {
  private readonly likeProcessor: RedisBatchProcessor<LikeOperation>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    const redis = this.redisService.getOrThrow();

    this.likeProcessor = new RedisBatchProcessor(redis, {
      batchKey: 'comment:likes:batch',
      batchSize: 100,
      batchTimeout: 1000,
      processBatch: this.processBatch.bind(this),
    });
  }

  async like(commentId: string, userId: string): Promise<void> {
    const exists = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (exists) {
      throw new CommentAlreadyLikedError(userId, commentId);
    }

    await this.likeProcessor.add({
      commentId,
      userId,
      operation: 'like',
    });
  }

  async unlike(commentId: string, userId: string): Promise<void> {
    const exists = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (!exists) {
      throw new CommentNotLikedError(userId, commentId);
    }

    await this.likeProcessor.add({
      commentId,
      userId,
      operation: 'unlike',
    });
  }

  private async processBatch(items: LikeOperation[]): Promise<void> {
    const likes = items.filter((item) => item.operation === 'like');
    const unlikes = items.filter((item) => item.operation === 'unlike');

    await this.prisma.$transaction(async (tx) => {
      if (likes.length > 0) {
        await tx.commentLike.createMany({
          data: likes.map((item) => ({
            commentId: item.commentId,
            userId: item.userId,
          })),
          skipDuplicates: true,
        });

        await tx.comment.updateMany({
          where: {
            id: {
              in: likes.map((item) => item.commentId),
            },
          },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });
      }

      if (unlikes.length > 0) {
        await tx.commentLike.deleteMany({
          where: {
            OR: unlikes.map((item) => ({
              commentId: item.commentId,
              userId: item.userId,
            })),
          },
        });

        await tx.comment.updateMany({
          where: {
            id: {
              in: unlikes.map((item) => item.commentId),
            },
          },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });
      }
    });
  }
}

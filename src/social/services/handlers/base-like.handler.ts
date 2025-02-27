import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisBatchProcessor } from 'src/common/batch-processor/redis-batch-processor';
import { ILikeable } from '../../entities/interfaces/likeable.interface';
import {
  ContentAlreadyLikedError,
  ContentNotLikedError,
} from '../../entities/social.error';

export interface LikeOperation {
  contentId: string;
  contentType: string;
  userId: string;
  operation: 'like' | 'unlike';
}

/**
 * Base handler for like operations
 */
export abstract class BaseLikeHandler implements ILikeable {
  protected readonly likeProcessor: RedisBatchProcessor<LikeOperation>;
  protected readonly contentType: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redisService: RedisService,
    protected readonly contentId: string,
    contentType: string,
  ) {
    this.contentType = contentType;
    const redis = this.redisService.getOrThrow();

    this.likeProcessor = new RedisBatchProcessor(redis, {
      batchKey: `${contentType}:likes:batch`,
      batchSize: 100,
      batchTimeout: 1000,
      processBatch: this.processBatch.bind(this),
    });
  }

  async like(userId: string): Promise<void> {
    const exists = await this.checkLikeExists(userId);

    if (exists) {
      throw new ContentAlreadyLikedError(
        userId,
        this.contentId,
        this.contentType,
      );
    }

    await this.likeProcessor.add({
      contentId: this.contentId,
      contentType: this.contentType,
      userId,
      operation: 'like',
    });
  }

  async unlike(userId: string): Promise<void> {
    const exists = await this.checkLikeExists(userId);

    if (!exists) {
      throw new ContentNotLikedError(userId, this.contentId, this.contentType);
    }

    await this.likeProcessor.add({
      contentId: this.contentId,
      contentType: this.contentType,
      userId,
      operation: 'unlike',
    });
  }

  async getLikeCount(): Promise<number> {
    const engageable = await this.prisma.engageable.findUnique({
      where: {
        type_contentId: {
          type: this.contentType,
          contentId: this.contentId,
        },
      },
      select: {
        likeCount: true,
      },
    });

    return engageable?.likeCount || 0;
  }

  async isLikedBy(userId: string): Promise<boolean> {
    return this.checkLikeExists(userId);
  }

  protected abstract checkLikeExists(userId: string): Promise<boolean>;
  protected abstract processBatch(items: LikeOperation[]): Promise<void>;
}

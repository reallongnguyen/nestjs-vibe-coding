import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import {
  LikeCreatedEvent,
  LikeDeletedEvent,
  ContentType,
} from '../entities/events/social.events';
import { ContentViewedEvent } from '../entities/events/content-viewed.event';

import { EngagementStatsDto } from '../presentation/dtos/engagement-stats.dto';
import {
  EngageableNotFoundError,
  ContentAlreadyLikedError,
  ContentNotLikedError,
} from '../entities/social.error';
import { SocialEngagementRedisService } from './social-engagement-redis.service';
import { SocialEngagementMetricsService } from './social-engagement-metrics.service';

interface CommentCountUpdate {
  type: string;
  contentId: string;
}

@Injectable()
export class SocialEngagementService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
    private readonly redisService: SocialEngagementRedisService,
    private readonly metricsService: SocialEngagementMetricsService,
  ) {}

  async batchUpdateCommentCount(updates: CommentCountUpdate[]) {
    // Group updates by type and contentId
    const groupedUpdates = updates.reduce(
      (acc, update) => {
        const key = `${update.type}:${update.contentId}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Process each group
    await Promise.all(
      Object.entries(groupedUpdates).map(async ([key, count]) => {
        const [type, contentId] = key.split(':');
        await this.prisma.engageable.upsert({
          where: {
            type_contentId: { type, contentId },
          },
          create: {
            type,
            contentId,
            commentCount: count,
            likeCount: 0,
            viewCount: 0,
          },
          update: {
            commentCount: {
              increment: count,
            },
          },
        });
      }),
    );
  }

  /**
   * Get engagement statistics for content
   * @param contentId Content ID
   * @param type Content type
   */
  async getEngagementStats(
    contentId: string,
    type: string,
  ): Promise<EngagementStatsDto> {
    const engageable = await this.prisma.engageable.findUnique({
      where: {
        type_contentId: {
          type: type.toUpperCase(),
          contentId,
        },
      },
    });

    if (!engageable) {
      return {
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      };
    }

    return {
      likeCount: engageable.likeCount,
      commentCount: engageable.commentCount,
      viewCount: engageable.viewCount,
    };
  }

  /**
   * Like content
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async likeContent(
    type: string,
    contentId: string,
    userId: string,
  ): Promise<void> {
    const upperType = type.toUpperCase() as ContentType;
    const startTime = Date.now();

    try {
      // Validate content exists
      await this.validateContentExists(upperType, contentId);

      // Get distributed lock
      const hasLock = await this.redisService.acquireLikeLock(
        upperType,
        contentId,
        userId,
      );

      if (!hasLock) {
        throw new ContentAlreadyLikedError(userId, contentId, upperType);
      }

      try {
        // Check if already liked
        const isLiked = await this.redisService.isContentLiked(
          upperType,
          contentId,
          userId,
        );

        if (isLiked) {
          throw new ContentAlreadyLikedError(userId, contentId, upperType);
        }

        // Add to Redis set
        await this.redisService.addLike(upperType, contentId, userId);

        // Get target user ID based on content type
        let targetUserId = '';
        if (upperType === ContentType.POST) {
          const post = await this.prisma.publishedPost.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = post?.userId || '';
        } else if (upperType === ContentType.EMOTION) {
          const emotion = await this.prisma.userEmotion.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = emotion?.userId || '';
        } else if (upperType === ContentType.COMMENT) {
          const comment = await this.prisma.comment.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = comment?.userId || '';
        }

        const event = new LikeCreatedEvent({
          actorId: userId,
          contentType: upperType,
          contentId,
          targetUserId,
        });

        await this.eventBus.publish(event);

        this.metricsService.trackLikeOperation(upperType, 'like', 'success');
      } finally {
        // Release lock
        await this.redisService.releaseLikeLock(upperType, contentId, userId);
      }
    } catch (error) {
      this.metricsService.trackLikeOperation(upperType, 'like', 'error');
      throw error;
    } finally {
      this.metricsService.trackLikeOperationDuration(
        upperType,
        'like',
        Date.now() - startTime,
      );
    }
  }

  /**
   * Unlike content
   * @param type Content type
   * @param contentId Content ID
   * @param userId User ID
   */
  async unlikeContent(
    type: string,
    contentId: string,
    userId: string,
  ): Promise<void> {
    const upperType = type.toUpperCase() as ContentType;
    const startTime = Date.now();

    try {
      // Validate content exists
      await this.validateContentExists(upperType, contentId);

      // Get distributed lock
      const hasLock = await this.redisService.acquireLikeLock(
        upperType,
        contentId,
        userId,
      );

      if (!hasLock) {
        throw new ContentNotLikedError(userId, contentId, upperType);
      }

      try {
        // Check if liked
        const isLiked = await this.redisService.isContentLiked(
          upperType,
          contentId,
          userId,
        );

        if (!isLiked) {
          throw new ContentNotLikedError(userId, contentId, upperType);
        }

        // Remove from Redis set
        await this.redisService.removeLike(upperType, contentId, userId);

        // Get target user ID based on content type
        let targetUserId = '';
        if (upperType === ContentType.POST) {
          const post = await this.prisma.publishedPost.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = post?.userId || '';
        } else if (upperType === ContentType.EMOTION) {
          const emotion = await this.prisma.userEmotion.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = emotion?.userId || '';
        } else if (upperType === ContentType.COMMENT) {
          const comment = await this.prisma.comment.findUnique({
            where: { id: contentId },
            select: { userId: true },
          });
          targetUserId = comment?.userId || '';
        }

        const event = new LikeDeletedEvent({
          actorId: userId,
          contentType: upperType,
          contentId,
          targetUserId,
        });

        await this.eventBus.publish(event);

        this.metricsService.trackLikeOperation(upperType, 'unlike', 'success');
      } finally {
        // Release lock
        await this.redisService.releaseLikeLock(upperType, contentId, userId);
      }
    } catch (error) {
      this.metricsService.trackLikeOperation(upperType, 'unlike', 'error');
      throw error;
    } finally {
      this.metricsService.trackLikeOperationDuration(
        upperType,
        'unlike',
        Date.now() - startTime,
      );
    }
  }

  /**
   * Record content view
   * @param type Content type
   * @param contentId Content ID
   * @param viewerHash Viewer hash
   * @param viewerId Optional viewer ID
   */
  async recordView(
    type: string,
    contentId: string,
    viewerHash: string,
    viewerId?: string,
  ): Promise<void> {
    const upperType = type.toUpperCase() as ContentType;
    const startTime = Date.now();

    try {
      // Validate content exists
      await this.validateContentExists(upperType, contentId);

      // Track view in Redis
      const isNewView = await this.redisService.trackView(
        upperType,
        contentId,
        viewerHash,
      );

      // Emit content viewed event if it's a new view
      if (isNewView) {
        const event = new ContentViewedEvent(
          contentId,
          upperType,
          viewerHash,
          viewerId,
        );
        await this.eventBus.publish(event);
      }

      this.metricsService.trackViewOperation(upperType, 'success');
    } catch (error) {
      this.metricsService.trackViewOperation(upperType, 'error');
      throw error;
    } finally {
      this.metricsService.trackViewOperationDuration(
        upperType,
        Date.now() - startTime,
      );
    }
  }

  /**
   * Ensure engageable record exists
   * @param contentId Content ID
   * @param contentType Content type
   */
  async ensureEngageable(
    contentId: string,
    contentType: string,
  ): Promise<void> {
    await this.prisma.engageable.upsert({
      where: {
        type_contentId: {
          type: contentType,
          contentId,
        },
      },
      create: {
        type: contentType,
        contentId,
        likeCount: 0,
        viewCount: 0,
        commentCount: 0,
      },
      update: {},
    });
  }

  /**
   * Validate that content exists
   * @param type Content type
   * @param id Content ID
   */
  private async validateContentExists(type: string, id: string): Promise<void> {
    let exists = false;

    if (type === 'POST') {
      const count = await this.prisma.publishedPost.count({
        where: { id },
      });
      exists = count > 0;
    } else if (type === 'EMOTION') {
      const count = await this.prisma.userEmotion.count({
        where: { id },
      });
      exists = count > 0;
    } else if (type === 'COMMENT') {
      const count = await this.prisma.comment.count({
        where: { id },
      });
      exists = count > 0;
    }

    if (!exists) {
      throw new EngageableNotFoundError(id, type);
    }
  }
}

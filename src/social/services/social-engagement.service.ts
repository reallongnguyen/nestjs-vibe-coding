import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import {
  LikeCreatedEvent,
  LikeDeletedEvent,
  ContentType,
} from '../entities/events/social.events';

import { EngagementStatsDto } from '../presentation/dtos/engagement-stats.dto';
import { EngageableNotFoundError } from '../entities/social.error';
import { IViewRepository } from './interfaces/view-repository.interface';

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
    @Inject('IViewRepository')
    private readonly viewRepository: IViewRepository,
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

    // Validate content exists
    await this.validateContentExists(upperType, contentId);

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

    // Validate content exists
    await this.validateContentExists(upperType, contentId);

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

    // Validate content exists
    await this.validateContentExists(upperType, contentId);

    // Insert view record
    await this.viewRepository.insertView(
      contentId,
      upperType,
      viewerHash,
      viewerId,
    );

    // TODO: Emit content viewed event if it's a new view
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { IEventBus, InjectEventBus } from 'src/common/event-bus';
import { ILikeable } from '../entities/interfaces/likeable.interface';
import { IViewable } from '../entities/interfaces/viewable.interface';
import { PostLikeHandler } from './handlers/post-like.handler';
import { PostViewHandler } from './handlers/post-view.handler';
import { EmotionLikeHandler } from './handlers/emotion-like.handler';
import { EmotionViewHandler } from './handlers/emotion-view.handler';
import { EngagementStatsDto } from '../presentation/dtos/engagement-stats.dto';

@Injectable()
export class SocialEngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Get a likeable handler for a post
   * @param postId Post ID
   */
  getLikeableForPost(postId: string): ILikeable {
    return new PostLikeHandler(
      this.prisma,
      this.redisService,
      this.eventBus,
      postId,
    );
  }

  /**
   * Get a viewable handler for a post
   * @param postId Post ID
   */
  getViewableForPost(postId: string): IViewable {
    return new PostViewHandler(
      this.prisma,
      this.redisService,
      this.eventBus,
      postId,
    );
  }

  getLikeableForEmotion(emotionId: string): ILikeable {
    return new EmotionLikeHandler(
      this.prisma,
      this.redisService,
      this.eventBus,
      emotionId,
    );
  }

  getViewableForEmotion(emotionId: string): IViewable {
    return new EmotionViewHandler(
      this.prisma,
      this.redisService,
      this.eventBus,
      emotionId,
    );
  }

  /**
   * Get engagement statistics for content
   * @param contentId Content ID
   * @param contentType Content type
   */
  async getEngagementStats(
    contentId: string,
    contentType: string,
  ): Promise<EngagementStatsDto> {
    const engageable = await this.prisma.engageable.findUnique({
      where: {
        type_contentId: {
          type: contentType,
          contentId,
        },
      },
    });

    if (!engageable) {
      return {
        likeCount: 0,
        viewCount: 0,
        commentCount: 0,
      };
    }

    let commentCount = 0;
    if (contentType === 'POST') {
      commentCount = await this.prisma.comment.count({
        where: {
          postId: contentId,
        },
      });
    } else if (contentType === 'EMOTION') {
      commentCount = await this.prisma.comment.count({
        where: {
          emotionId: contentId,
        },
      });
    }

    return {
      likeCount: engageable.likeCount,
      viewCount: engageable.viewCount,
      commentCount,
    };
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
}

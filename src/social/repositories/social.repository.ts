import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PrismaService, PaginationQueryDto } from 'src/common';
import { GetFollowingIdsCommand } from 'src/user-follow/presentation/commands/get-following-ids.command';
import { ContentWithMetrics } from '../entities/content-with-metrics.entity';
import { ISocialRepository } from '../services/interfaces/social-repository.interface';
import { FeedContentType } from '../entities/feed.entity';

@Injectable()
export class SocialRepository implements ISocialRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async getContentByAuthors(
    authorIds: string[],
    pagination: PaginationQueryDto,
    sortBy: string = 'recent',
  ): Promise<[ContentWithMetrics[], number]> {
    // Get posts from the authors
    const posts = await this.prisma.publishedPost.findMany({
      where: {
        userAuthor: {
          id: {
            in: authorIds,
          },
        },
      },
      orderBy: sortBy === 'recent' ? { publishedAt: 'desc' } : undefined,
      skip: pagination.offset,
      take: pagination.limit,
      include: {
        userAuthor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Get emotions from the authors
    const emotions = await this.prisma.userEmotion.findMany({
      where: {
        userId: {
          in: authorIds,
        },
      },
      orderBy: sortBy === 'recent' ? { date: 'desc' } : undefined,
      skip: pagination.offset,
      take: pagination.limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Count total posts and emotions
    const [postsCount, emotionsCount] = await Promise.all([
      this.prisma.publishedPost.count({
        where: {
          userAuthor: {
            id: {
              in: authorIds,
            },
          },
        },
      }),
      this.prisma.userEmotion.count({
        where: {
          userId: {
            in: authorIds,
          },
        },
      }),
    ]);

    // Get engagement metrics for posts
    const postIds = posts.map((post) => post.id);
    const postEngagements = await this.prisma.engageable.findMany({
      where: {
        type: 'POST',
        contentId: {
          in: postIds,
        },
      },
      select: {
        contentId: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
      },
    });

    // Get engagement metrics for emotions
    const emotionIds = emotions.map((emotion) => emotion.id);
    const emotionEngagements = await this.prisma.engageable.findMany({
      where: {
        type: 'EMOTION',
        contentId: {
          in: emotionIds,
        },
      },
      select: {
        contentId: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
      },
    });

    // Create lookup maps for quick access to engagement metrics
    const postEngagementMap = new Map(
      postEngagements.map((e) => [e.contentId, e]),
    );

    const emotionEngagementMap = new Map(
      emotionEngagements.map((e) => [e.contentId, e]),
    );

    // Map posts to ContentWithMetrics
    const postContents = posts.map((post) => {
      const engagement = postEngagementMap.get(post.id) || {
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      };

      return {
        id: post.id,
        type: FeedContentType.POST,
        contentId: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.publishedAt,
        authorId: post.userAuthor.id,
        authorFirstName: post.userAuthor.firstName,
        authorLastName: post.userAuthor.lastName,
        authorAvatar: post.userAuthor.avatar,
        likeCount: engagement.likeCount,
        commentCount: engagement.commentCount,
        viewCount: engagement.viewCount,
      };
    });

    // Map emotions to ContentWithMetrics
    const emotionContents = emotions.map((emotion) => {
      const engagement = emotionEngagementMap.get(emotion.id) || {
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      };

      return {
        id: emotion.id,
        type: FeedContentType.USER_EMOTION,
        contentId: emotion.id,
        content: emotion.note || '',
        emotion: emotion.emotion,
        intensity: emotion.intensity,
        createdAt: emotion.date,
        authorId: emotion.user.id,
        authorFirstName: emotion.user.firstName,
        authorLastName: emotion.user.lastName,
        authorAvatar: emotion.user.avatar,
        likeCount: engagement.likeCount,
        commentCount: engagement.commentCount,
        viewCount: engagement.viewCount,
      };
    });

    // Combine and sort all content
    const allContents = [...postContents, ...emotionContents];

    if (sortBy === 'recent') {
      allContents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === 'popular') {
      allContents.sort((a, b) => {
        const aScore = a.likeCount * 3 + a.commentCount * 2 + a.viewCount;
        const bScore = b.likeCount * 3 + b.commentCount * 2 + b.viewCount;
        return bScore - aScore;
      });
    }

    // Apply pagination to the combined results
    const paginatedContents = allContents.slice(0, pagination.limit);

    return [paginatedContents, postsCount + emotionsCount];
  }

  async getContentFromFollowedUsers(
    userId: string,
    pagination: PaginationQueryDto,
    sortBy: string = 'recent',
  ): Promise<[ContentWithMetrics[], number]> {
    // Get the list of users that the current user is following
    const followingUsers = await this.commandBus.execute(
      new GetFollowingIdsCommand(userId),
    );

    // If the user is not following anyone, return an empty collection
    if (followingUsers.length === 0) {
      return [[], 0];
    }

    // Get content from followed users
    return this.getContentByAuthors(followingUsers, pagination, sortBy);
  }
}

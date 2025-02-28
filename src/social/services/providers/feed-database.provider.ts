import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FeedDistributionService } from '../feed-distribution.service';
import { GetFeedInput } from '../dtos/get-feed.input';
import { GetFeedOutput } from '../dtos/get-feed.output';
import { createFeed, Feed, FeedContentType } from '../../entities/feed.entity';
import { FeedProvider } from './feed-provider.interface';
import {
  PostContent,
  EmotionContent,
  FeedItem,
} from '../../entities/feed-content.entity';

@Injectable()
export class FeedDatabaseProvider implements FeedProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly distributionService: FeedDistributionService,
  ) {}

  async getFeed(input: GetFeedInput): Promise<GetFeedOutput> {
    const feedItems = await this.distributionService.getGlobalFeed(
      input.offset,
      input.limit,
    );

    const enrichedItems = await this.enrichFeedItems(feedItems);

    return {
      total: await this.distributionService.getTotalFeedCount(),
      items: enrichedItems,
    };
  }

  private async enrichFeedItems(feedItems: FeedItem[]): Promise<Feed[]> {
    const postIds = feedItems
      .filter((item) => item.type === FeedContentType.POST)
      .map((item) => item.id);

    const emotionIds = feedItems
      .filter((item) => item.type === FeedContentType.USER_EMOTION)
      .map((item) => item.id);

    const [posts, emotions] = await Promise.all([
      this.fetchPosts(postIds),
      this.fetchEmotions(emotionIds),
    ]);

    return feedItems
      .map((item) => {
        const content =
          item.type === FeedContentType.POST
            ? posts.find((p) => p.id === item.id)
            : emotions.find((e) => e.id === item.id);

        if (!content) return null;

        return createFeed({
          id: item.id,
          userId: '',
          type: item.type,
          score: item.score,
          publishedPostId: item.type === FeedContentType.POST ? item.id : null,
          userEmotionId:
            item.type === FeedContentType.USER_EMOTION ? item.id : null,
          publishedPost:
            item.type === FeedContentType.POST
              ? (content as PostContent)
              : null,
          userEmotion:
            item.type === FeedContentType.USER_EMOTION
              ? (content as EmotionContent)
              : null,
          viewedAt: null,
          createdAt: new Date(item.timestamp),
          updatedAt: new Date(),
        });
      })
      .filter(Boolean);
  }

  private async fetchPosts(postIds: string[]): Promise<PostContent[]> {
    if (!postIds.length) return [];

    return this.prisma.publishedPost.findMany({
      where: { id: { in: postIds } },
      select: {
        id: true,
        title: true,
        subtitle: true,
        excerpt: true,
        cover: true,
        readingTime: true,
        likeCount: true,
        replyCount: true,
        viewCount: true,
        publishedAt: true,
        userAuthor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        botAuthor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  private async fetchEmotions(emotionIds: string[]): Promise<EmotionContent[]> {
    if (!emotionIds.length) return [];

    return this.prisma.userEmotion.findMany({
      where: { id: { in: emotionIds } },
      select: {
        id: true,
        emotion: true,
        intensity: true,
        note: true,
        date: true,
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
  }
}

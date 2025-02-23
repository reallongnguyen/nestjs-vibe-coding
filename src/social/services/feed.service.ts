import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { GetFeedInput } from './dto/get-feed.input';
import { GetFeedOutput } from './dto/get-feed.output';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // private calculateScore(intensity: number, createdAt: Date): number {
  //   const timeDiff = (Date.now() - createdAt.getTime()) / 1000 / 60 / 60;
  //   return (intensity * 1000) / (timeDiff + 1);
  // }

  async getFeed(input: GetFeedInput): Promise<GetFeedOutput> {
    const cacheKey = `feed:${input.userId}:${input.offset}:${input.limit}`;
    const cached = await this.cache.get<GetFeedOutput>(cacheKey);
    if (cached) {
      return cached;
    }

    const [total, items] = await Promise.all([
      this.prisma.feed.count({
        where: { userId: input.userId },
      }),
      this.prisma.feed.findMany({
        where: { userId: input.userId },
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip: input.offset,
        take: input.limit,
        include: {
          publishedPost: {
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
          },
          userEmotion: {
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
          },
        },
      }),
    ]);

    const enrichedItems = items.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      publishedPostId: item.publishedPostId,
      userEmotionId: item.userEmotionId,
      userId: item.userId,
      score: item.score,
      viewedAt: item.viewedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedPost: item.publishedPost,
      userEmotion: item.userEmotion,
    }));

    const result = { total, items: enrichedItems };
    await this.cache.set(cacheKey, result, 60); // Cache for 1 minute

    return result;
  }
}

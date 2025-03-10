import { Injectable } from '@nestjs/common';
import { ContentType } from 'src/common/event-manager/entities/events/schemas/social.events';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FeedContent } from 'src/recommendation/entities/feed.types';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get content items by their IDs
   * @param ids Array of content IDs
   * @returns Array of content items
   */
  async getContentByIds(ids: string[]): Promise<FeedContent[]> {
    if (!ids.length) {
      return [];
    }

    const [posts, emotions] = await Promise.all([
      this.prisma.publishedPost.findMany({
        where: {
          id: {
            in: ids,
          },
        },
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
      }),
      this.prisma.userEmotion.findMany({
        where: {
          id: {
            in: ids,
          },
        },
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
      }),
    ]);

    const contents: FeedContent[] = [
      ...posts.map((post) => ({
        id: post.id,
        type: ContentType.POST,
        title: post.title,
        content: post.content as string,
        authorId: post.userId || post.botId || '',
        score: undefined,
        createdAt: post.publishedAt,
        updatedAt: post.updatedAt,
      })),
      ...emotions.map((emotion) => ({
        id: emotion.id,
        type: ContentType.EMOTION,
        content: emotion.note || '',
        authorId: emotion.userId,
        score: undefined,
        createdAt: emotion.createdAt,
        updatedAt: emotion.updatedAt,
      })),
    ];

    return contents;
  }
}

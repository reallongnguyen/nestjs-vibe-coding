import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Collection } from 'src/common/models';
import { Prisma } from '@prisma/client';
import { IPublishedPostRepository } from '../services/interfaces/published-post.repository.interface';
import {
  PublishedPost,
  PublishedPostWithAuthor,
} from '../entities/published-post.entity';
import {
  ListPostsQueryDto,
  PublishedPostSortField,
} from '../presentation/dtos/list-posts.dto';

@Injectable()
export class PublishedPostRepository
  extends BaseRepository
  implements IPublishedPostRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: string): Promise<PublishedPost | null> {
    return this.prisma.publishedPost.findUnique({
      where: { id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.publishedPost.delete({
      where: { id },
    });
  }

  async findAll(
    query: ListPostsQueryDto,
  ): Promise<Collection<PublishedPostWithAuthor>> {
    const {
      offset = 0,
      limit = 10,
      sortBy = PublishedPostSortField.PUBLISHED_AT,
      search,
      topics,
      fromDate,
      toDate,
      userId,
    } = query;
    const skip = offset;

    const where: Prisma.PublishedPostWhereInput = {
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { path: ['text'], string_contains: search } },
        ],
      }),
      ...(topics?.length && {
        topics: { some: { topicId: { in: topics } } },
      }),
      ...(fromDate && { publishedAt: { gte: new Date(fromDate) } }),
      ...(toDate && { publishedAt: { lte: new Date(toDate) } }),
    };

    const [total, items] = await Promise.all([
      this.prisma.publishedPost.count({ where }),
      this.prisma.publishedPost.findMany({
        where,
        orderBy: { [sortBy]: 'desc' },
        skip,
        take: limit,
        include: {
          topics: {
            select: { topicId: true },
          },
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
    ]);

    const edges = items.map((post) => ({
      ...post,
      topics: post.topics.map((t) => t.topicId),
    })) as PublishedPostWithAuthor[];

    return new Collection(edges, {
      total,
      offset,
      limit,
    });
  }
}

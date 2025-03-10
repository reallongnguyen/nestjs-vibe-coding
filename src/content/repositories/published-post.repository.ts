import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { PagedResult } from 'src/common/models';
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
  ): Promise<PagedResult<PublishedPostWithAuthor>> {
    const {
      sortBy = PublishedPostSortField.PUBLISHED_AT,
      search,
      topics,
      fromDate,
      toDate,
      userId,
    } = query;
    const { skip, take } = query.toDatabaseQuery();

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
        take,
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

    const withAuthorItems = items.map((post) => ({
      ...post,
      topics: post.topics.map((t) => t.topicId),
    })) as PublishedPostWithAuthor[];

    return new PagedResult(withAuthorItems, query.toResponseMeta(total));
  }

  /**
   * Update metadata for a post
   * @param id Post ID
   * @param metadata Metadata to update
   */
  async updateMetadata(
    id: string,
    metadata: {
      lastEngagementAt?: Date;
      lastViewedAt?: Date;
    },
  ): Promise<void> {
    const post = await this.prisma.publishedPost.findUnique({
      where: { id },
      select: { metadata: true },
    });

    const currentMetadata = (post?.metadata as Record<string, unknown>) || {};

    await this.prisma.publishedPost.update({
      where: { id },
      data: {
        metadata: {
          ...currentMetadata,
          ...metadata,
        },
      },
    });
  }
}

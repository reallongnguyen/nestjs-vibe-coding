import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PagedResult } from '../../common/models';
import { DraftPost } from '../entities/draft-post.entity';
import { PublishedPost } from '../entities/published-post.entity';
import { IDraftPostRepository } from '../services/interfaces/draft-post.repository.interface';
import { CreateDraftPostData } from '../services/dtos/create-daft-post.dto';
import {
  ListDraftPostsQueryDto,
  DraftPostSortField,
} from '../presentation/dtos/list-posts.dto';

@Injectable()
export class DraftPostRepository
  extends BaseRepository
  implements IDraftPostRepository
{
  private readonly logger = new Logger(DraftPostRepository.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateDraftPostData): Promise<DraftPost> {
    const result = await this.prisma.draftPost.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        cover: data.cover,
        topics: data.topics,
        userId: data.userId,
      },
    });

    return result as DraftPost;
  }

  async findById(id: string): Promise<DraftPost | null> {
    return (await this.prisma.draftPost.findUnique({
      where: { id },
    })) as DraftPost | null;
  }

  async update(
    id: string,
    data: Partial<CreateDraftPostData>,
  ): Promise<DraftPost> {
    const result = await this.prisma.draftPost.update({
      where: { id },
      data,
    });

    return result as DraftPost;
  }

  async publish(
    id: string,
    data: {
      title?: string;
      subtitle?: string;
      excerpt?: string;
      slug: string;
      readingTime: number;
      content: Record<string, any>;
      cover: string;
      userId: string;
      topicIds: string[];
    },
  ): Promise<{ published: PublishedPost }> {
    try {
      const tx = this.prisma as PrismaService;
      const published = await tx.publishedPost.create({
        data: {
          id,
          title: data.title,
          subtitle: data.subtitle,
          slug: data.slug,
          excerpt: data.excerpt,
          readingTime: data.readingTime,
          content: data.content,
          cover: data.cover,
          userId: data.userId,
          publishedAt: new Date(),
        },
      });

      await Promise.all(
        data.topicIds.map((topicId) =>
          tx.postTopic.create({
            data: {
              postId: id,
              topicId,
            },
          }),
        ),
      );

      await tx.draftPost.delete({
        where: { id },
      });

      return { published: published as unknown as PublishedPost };
    } catch (error) {
      this.logger.error(`Failed to publish draft post ${id}: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.draftPost.delete({
      where: { id },
    });
  }

  async findByPublishedId(publishedId: string): Promise<DraftPost | null> {
    return this.prisma.draftPost.findFirst({
      where: { publishedId },
    });
  }

  async findAll(
    userId: string,
    query: ListDraftPostsQueryDto,
  ): Promise<PagedResult<DraftPost>> {
    const {
      sortBy = DraftPostSortField.CREATED_AT,
      search,
      topics,
      published,
    } = query;

    const { skip, take } = query.toDatabaseQuery();

    const where: Prisma.DraftPostWhereInput = {
      userId,
      ...(published !== undefined && {
        publishedId: published ? { not: null } : null,
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { path: ['text'], string_contains: search } },
        ],
      }),
      ...(topics?.length && {
        topics: { hasEvery: topics },
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.draftPost.count({ where }),
      this.prisma.draftPost.findMany({
        where,
        orderBy: { [sortBy]: 'desc' },
        skip,
        take,
      }),
    ]);

    return new PagedResult(items as DraftPost[], query.toResponseMeta(total));
  }

  async applyToPublished(
    id: string,
    publishedId: string,
    data: {
      title?: string;
      subtitle?: string;
      content: Record<string, any>;
      excerpt?: string;
      readingTime: number;
      userId: string;
      cover: string;
      topicIds: string[];
    },
  ): Promise<{ published: PublishedPost }> {
    const published = await this.prisma.publishedPost.update({
      where: { id: publishedId },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        excerpt: data.excerpt,
        readingTime: data.readingTime,
        cover: data.cover,
        updatedAt: new Date(),
      },
    });

    await this.prisma.postTopic.deleteMany({
      where: { postId: publishedId },
    });

    await this.prisma.postTopic.createMany({
      data: data.topicIds.map((topicId) => ({
        postId: publishedId,
        topicId,
      })),
    });

    await this.prisma.draftPost.delete({
      where: { id },
    });

    return { published };
  }
}

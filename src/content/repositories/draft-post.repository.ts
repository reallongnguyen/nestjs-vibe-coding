import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { DraftPost } from '../entities/draft-post.entity';
import { PublishedPost } from '../entities/published-post.entity';
import { IDraftPostRepository } from '../services/interfaces/draft-post.repository.interface';
import { CreateDraftPostData } from '../services/dtos/create-daft-post.dto';
import { DraftCreateError, DraftUpdateError } from '../entities/content.error';

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
    try {
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
    } catch (error) {
      this.logger.error(
        `Failed to create draft post for user ${data.userId}`,
        error,
      );
      throw new DraftCreateError(error);
    }
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
    try {
      const result = await this.prisma.draftPost.update({
        where: { id },
        data,
      });

      return result as DraftPost;
    } catch (error) {
      this.logger.error(`Failed to update draft post ${id}`, error.message);
      throw new DraftCreateError(error.message);
    }
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
  ): Promise<{ draft: DraftPost; published: PublishedPost }> {
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
          likeCount: 0,
          replyCount: 0,
          viewCount: 0,
          publishedAt: new Date(),
        },
      });

      const [draft] = await Promise.all([
        tx.draftPost.update({
          where: { id },
          data: { publishedId: id },
        }),
        tx.postTopic.createMany({
          data: data.topicIds.map((topicId) => ({
            postId: id,
            topicId,
          })),
        }),
      ]);

      return {
        draft: draft as DraftPost,
        published: published as unknown as PublishedPost,
      };
    } catch (error) {
      this.logger.error(`Failed to publish draft post ${id}: ${error.message}`);

      throw new DraftUpdateError(error.message);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.draftPost.delete({
      where: { id },
    });
  }

  async findByPublishedId(publishedId: string): Promise<DraftPost | null> {
    return (await this.prisma.draftPost.findFirst({
      where: { publishedId },
    })) as DraftPost | null;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { DraftPost } from '../entities/draft-post.entity';
import { IDraftPostRepository } from '../services/interfaces/draft-post.repository.interface';
import { CreateDraftPostData } from '../services/dtos/create-daft-post.dto';
import { DraftCreateError } from '../entities/content.error';

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
      this.logger.error(`Failed to update draft post ${id}`, error);
      throw new DraftCreateError(error);
    }
  }
}

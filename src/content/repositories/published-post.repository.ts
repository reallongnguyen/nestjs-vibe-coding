import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { IPublishedPostRepository } from '../services/interfaces/published-post.repository.interface';
import { PublishedPost } from '../entities/published-post.entity';

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
}

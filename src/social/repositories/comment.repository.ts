import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { Comment, CommentWithAuthor } from '../entities/comment.entity';
import { ICommentRepository } from '../services/interfaces/comment-repository.interface';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    content: string;
    postId: string;
    userId: string;
    parentId?: string;
  }): Promise<Comment> {
    return this.prisma.comment.create({
      data: {
        ...data,
        authorType: 'user',
      },
    });
  }

  async findById(id: string): Promise<CommentWithAuthor | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
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
            avatar: true,
          },
        },
      },
    });
  }

  async findByPost(
    postId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[CommentWithAuthor[], number]> {
    const { skip, take } = pageOptions.toDatabaseQuery();

    return Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        include: {
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
              avatar: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({
        where: { postId },
      }),
    ]);
  }

  async update(id: string, data: { content: string }): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }
}

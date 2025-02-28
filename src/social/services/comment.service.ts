import { Inject, Injectable } from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-bus';
import { Collection, AppError } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ICommentRepository } from './interfaces/comment-repository.interface';
import { CreateCommentInput, UpdateCommentInput } from './dtos/comment.input';
import { CommentOutput } from './dtos/comment.output';
import { CommentCreatedEvent } from '../entities/events/comment-created.event';
import {
  CommentNotFoundError,
  NotCommentOwnerError,
  CommentUpdateError,
} from '../entities/comment.error';
import { EngageableNotFoundError } from '../entities/social.error';
import { EmotionPrivacyService } from './emotion-privacy.service';

@Injectable()
export class CommentService {
  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
    private readonly prisma: PrismaService,
    private readonly emotionPrivacyService: EmotionPrivacyService,
    @InjectEventBus() private readonly eventBus: IEventBus,
  ) {}

  async create(
    data: CreateCommentInput,
    userId: string,
  ): Promise<CommentOutput> {
    const comment = await this.commentRepository.create({
      ...data,
      userId,
    });

    await this.eventBus.publish(new CommentCreatedEvent(comment));

    return comment as CommentOutput;
  }

  async findById(id: string): Promise<CommentOutput> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new CommentNotFoundError(id);
    }

    return comment;
  }

  async findByPost(
    postId: string,
    pagination: PaginationQueryDto,
  ): Promise<Collection<CommentOutput>> {
    const [items, total] = await this.commentRepository.findByPost(
      postId,
      pagination,
    );

    return new Collection(items, {
      total,
      offset: pagination.offset,
      limit: pagination.limit,
    });
  }

  async update(
    id: string,
    data: UpdateCommentInput,
    userId: string,
  ): Promise<CommentOutput> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new CommentNotFoundError(id);
    }

    if (comment.userId !== userId) {
      throw new NotCommentOwnerError(userId, id);
    }

    try {
      const updated = await this.commentRepository.update(id, data);
      return updated as CommentOutput;
    } catch (error) {
      throw new CommentUpdateError(error);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new CommentNotFoundError(id);
    }

    if (comment.userId !== userId) {
      throw new NotCommentOwnerError(userId, id);
    }

    await this.commentRepository.delete(id);
  }

  async createComment(
    type: string,
    contentId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<CommentOutput> {
    const upperType = type.toUpperCase();

    // Validate content exists and user has permission
    await this.validateContentAccess(upperType, contentId, userId);

    // Check if parent comment exists if provided
    if (parentId) {
      const parentExists = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw new CommentNotFoundError(parentId);
      }
    }

    // Create comment based on content type
    let comment;
    if (upperType === 'POST') {
      comment = await this.prisma.comment.create({
        data: {
          content,
          postId: contentId,
          userId,
          parentId,
          authorType: 'USER',
        },
      });
    } else if (upperType === 'EMOTION') {
      comment = await this.prisma.comment.create({
        data: {
          content,
          emotionId: contentId,
          userId,
          parentId,
          authorType: 'USER',
        },
      });
    }

    // Publish event
    await this.eventBus.publish(new CommentCreatedEvent(comment));

    return {
      id: comment.id,
      content: comment.content,
      postId: upperType === 'POST' ? contentId : null,
      emotionId: upperType === 'EMOTION' ? contentId : null,
      userId: comment.userId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: null,
      botId: null,
      authorType: 'USER',
    };
  }

  async getCommentsByContent(
    type: string,
    contentId: string,
    pagination: PaginationQueryDto,
    userId?: string,
  ): Promise<Collection<CommentOutput>> {
    const upperType = type.toUpperCase();

    // For emotions, check privacy settings
    if (upperType === 'EMOTION') {
      const canView = await this.emotionPrivacyService.canViewComments(
        contentId,
        userId,
      );
      if (!canView) {
        return Collection.empty();
      }
    }

    // Get comments based on content type
    const skip = pagination.offset || 0;
    const limit = pagination.limit || 10;

    let where = {};
    if (upperType === 'POST') {
      where = { postId: contentId, parentId: null };
    } else if (upperType === 'EMOTION') {
      where = { emotionId: contentId, parentId: null };
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return new Collection(
      comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        postId: comment.postId,
        emotionId: comment.emotionId,
        userId: comment.userId,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        deletedAt: null,
        botId: null,
        authorType: comment.authorType,
      })),
      { offset: pagination.offset, limit, total },
    );
  }

  private async validateContentAccess(
    type: string,
    contentId: string,
    userId: string,
  ): Promise<void> {
    if (type === 'POST') {
      const postExists = await this.prisma.publishedPost.count({
        where: { id: contentId },
      });

      if (!postExists) {
        throw new EngageableNotFoundError(contentId, 'POST');
      }
    } else if (type === 'EMOTION') {
      const canComment = await this.emotionPrivacyService.canComment(
        contentId,
        userId,
      );

      if (!canComment) {
        throw new AppError('common.forbidden', {
          cause: 'Cannot comment on this emotion due to privacy settings',
        });
      }
    } else {
      throw new AppError('common.serverError', {
        cause: `Unsupported content type: ${type}`,
      });
    }
  }
}

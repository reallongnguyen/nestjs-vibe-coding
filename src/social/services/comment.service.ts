import { Inject, Injectable } from '@nestjs/common';
import { PagedResult, PrismaService } from 'src/common';
import { createCommonError } from 'src/common/errors/common.errors';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import {
  CommentRepliedEvent,
  ContentType,
} from '../entities/events/social.events';
import { ICommentRepository } from './interfaces/comment-repository.interface';
import { UpdateCommentInput } from './dtos/comment.input';
import { CommentOutput } from './dtos/comment.output';
import { CommentCreatedEvent } from '../entities/events/comment-created.event';
import { SocialErrorFactory } from '../entities/errors';
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

  async findById(id: string): Promise<CommentOutput> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw SocialErrorFactory.commentNotFound(id);
    }
    return comment;
  }

  async findByPost(
    postId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<CommentOutput>> {
    const [items, total] = await this.commentRepository.findByPost(
      postId,
      pageOptions,
    );

    return new PagedResult(items, pageOptions.toResponseMeta(total));
  }

  async update(
    id: string,
    data: UpdateCommentInput,
    userId: string,
  ): Promise<CommentOutput> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw SocialErrorFactory.commentNotFound(id);
    }

    if (comment.userId !== userId) {
      throw SocialErrorFactory.notCommentOwner(userId, id);
    }

    return this.commentRepository.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw SocialErrorFactory.commentNotFound(id);
    }

    if (comment.userId !== userId) {
      throw SocialErrorFactory.notCommentOwner(userId, id);
    }

    await this.commentRepository.delete(id);
  }

  async create(
    type: ContentType.POST | ContentType.EMOTION,
    contentId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<CommentOutput> {
    // Validate content exists and user has permission
    const { authorId } = await this.validateContentAccess(
      type,
      contentId,
      userId,
    );

    // Check if parent comment exists if provided
    if (parentId) {
      const parentExists = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw SocialErrorFactory.commentNotFound(parentId);
      }
    }

    // Create comment based on content type
    let comment;
    if (type === ContentType.POST) {
      comment = await this.prisma.comment.create({
        data: {
          content,
          postId: contentId,
          userId,
          parentId,
          authorType: 'USER',
        },
      });
    } else if (type === ContentType.EMOTION) {
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
    if (parentId) {
      // Get parent comment's user ID for notification
      const parentComment = await this.prisma.comment.findUnique({
        where: {
          id: parentId,
          ...(type === ContentType.POST && { postId: contentId }),
          ...(type === ContentType.EMOTION && { emotionId: contentId }),
        },
        select: { userId: true },
      });

      if (parentComment) {
        await this.eventBus.publish(
          new CommentRepliedEvent({
            targetUserId: parentComment.userId,
            actorId: userId,
            contentType: type,
            contentId,
            commentId: parentId,
            preview:
              content.length > 100 ? `${content.substring(0, 97)}...` : content,
          }),
        );
      }
    } else {
      await this.eventBus.publish(
        new CommentCreatedEvent(comment, authorId, type),
      );
    }

    return {
      id: comment.id,
      content: comment.content,
      postId: type === ContentType.POST ? contentId : null,
      emotionId: type === ContentType.EMOTION ? contentId : null,
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
    pageOptions: PageOptionsDto,
    userId?: string,
  ): Promise<PagedResult<CommentOutput>> {
    const upperType = type.toUpperCase();

    // For emotions, check privacy settings
    if (upperType === 'EMOTION') {
      const canView = await this.emotionPrivacyService.canViewComments(
        contentId,
        userId,
      );
      if (!canView) {
        return PagedResult.empty();
      }
    }

    const { skip, take } = pageOptions.toDatabaseQuery();

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
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return new PagedResult(comments, pageOptions.toResponseMeta(total));
  }

  private async validateContentAccess(
    type: ContentType.POST | ContentType.EMOTION,
    contentId: string,
    userId: string,
  ): Promise<{ authorId: string; authorType: string }> {
    if (type === ContentType.POST) {
      const post = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
      });

      if (!post) {
        throw SocialErrorFactory.engageableNotFound(contentId, 'POST');
      }

      return {
        authorId: post.userId || post.botId,
        authorType: post.authorType,
      };
    }

    if (type === ContentType.EMOTION) {
      const canComment = await this.emotionPrivacyService.canComment(
        contentId,
        userId,
      );

      if (!canComment) {
        throw createCommonError('auth.forbidden', {
          cause: 'Cannot comment on this emotion due to privacy settings',
        });
      }

      const emotion = await this.prisma.userEmotion.findUnique({
        where: { id: contentId },
      });

      if (!emotion) {
        throw SocialErrorFactory.engageableNotFound(contentId, 'EMOTION');
      }

      return {
        authorId: emotion.userId,
        authorType: 'USER',
      };
    }

    throw createCommonError('server.error', {
      cause: `Unsupported content type: ${type}`,
    });
  }
}

import { PrismaService } from 'src/common/prisma/prisma.service';
import { Collection } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';
import { ICommentable } from '../entities/interfaces/commentable.interface';
import { Comment } from '../entities/comment.entity';
import { EmotionPrivacyService } from './emotion-privacy.service';

export class EmotionCommentableService implements ICommentable {
  private readonly emotionId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly privacyService: EmotionPrivacyService,
    emotionId: string,
  ) {
    this.emotionId = emotionId;
  }

  async comment(
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> {
    // Check privacy settings
    const canComment = await this.privacyService.canComment(
      this.emotionId,
      userId,
    );
    if (!canComment) {
      throw new Error('Cannot comment on this emotion due to privacy settings');
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        emotionId: this.emotionId,
        parentId,
        authorType: 'USER',
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      emotionId: comment.emotionId,
      postId: comment.postId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorType: comment.authorType,
      botId: comment.botId,
      likeCount: 0,
      deletedAt: null,
    };
  }

  async getComments(
    options: PaginationQueryDto,
    userId?: string,
  ): Promise<Collection<Comment>> {
    // Check privacy settings
    const canViewComments = await this.privacyService.canViewComments(
      this.emotionId,
      userId,
    );
    if (!canViewComments) {
      return Collection.empty();
    }

    // Get comments
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          emotionId: this.emotionId,
          parentId: null, // Only top-level comments
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: options.offset || 0,
        take: options.limit || 10,
      }),
      this.prisma.comment.count({
        where: {
          emotionId: this.emotionId,
          parentId: null, // Only top-level comments
        },
      }),
    ]);

    return new Collection(
      comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        emotionId: comment.emotionId,
        postId: comment.postId,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorType: comment.authorType,
        botId: comment.botId,
        likeCount: 0,
        deletedAt: null,
      })),
      {
        limit: options.limit,
        offset: options.offset,
        total,
      },
    );
  }

  async getCommentCount(userId?: string): Promise<number> {
    // Check privacy settings
    const canViewComments = await this.privacyService.canViewComments(
      this.emotionId,
      userId,
    );
    if (!canViewComments) {
      return 0;
    }

    // Get comment count
    return this.prisma.comment.count({
      where: {
        emotionId: this.emotionId,
      },
    });
  }

  async getReplies(
    commentId: string,
    options: PaginationQueryDto,
    userId?: string,
  ): Promise<Collection<Comment>> {
    // Get parent comment to check emotion
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { emotionId: true },
    });

    if (!parentComment?.emotionId) {
      return Collection.empty();
    }

    // Check privacy settings
    const canViewComments = await this.privacyService.canViewComments(
      parentComment.emotionId,
      userId,
    );
    if (!canViewComments) {
      return Collection.empty();
    }

    // Get replies
    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          parentId: commentId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip: options.offset || 0,
        take: options.limit || 10,
      }),
      this.prisma.comment.count({
        where: {
          parentId: commentId,
        },
      }),
    ]);

    return new Collection(
      replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        userId: reply.userId,
        emotionId: reply.emotionId,
        postId: reply.postId,
        parentId: reply.parentId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        authorType: reply.authorType,
        botId: reply.botId,
        likeCount: 0,
        deletedAt: null,
      })),
      {
        limit: options.limit,
        offset: options.offset,
        total,
      },
    );
  }
}

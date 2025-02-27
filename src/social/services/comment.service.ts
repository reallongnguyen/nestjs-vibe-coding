import { Injectable } from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-bus';
import { Collection } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';

import { CommentRepository } from '../repositories/comment.repository';
import { CreateCommentInput, UpdateCommentInput } from './dtos/comment.input';
import { CommentOutput } from './dtos/comment.output';
import { CommentCreatedEvent } from '../entities/events/comment-created.event';
import {
  CommentNotFoundError,
  NotCommentOwnerError,
  CommentUpdateError,
  CommentDeleteError,
} from '../entities/comment.error';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
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

    try {
      await this.commentRepository.delete(id);
    } catch (error) {
      throw new CommentDeleteError(error);
    }
  }
}

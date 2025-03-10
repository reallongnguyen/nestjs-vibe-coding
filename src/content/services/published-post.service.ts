import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-bus';
import { DeleteImageCommand } from 'src/common/event-bus/core/domain/commands/delete-image.command';
import { PagedResult } from 'src/common/models';
import { PrismaService } from 'src/common/prisma/prisma.service';

import { IPublishedPostRepository } from './interfaces/published-post.repository.interface';
import { IDraftPostRepository } from './interfaces/draft-post.repository.interface';
import {
  PublishedPostNotFoundError,
  NotPublishedPostOwnerError,
  PostUpdateError,
} from '../entities/content.error';
import { PublishedPostDeletedEvent } from '../entities/events/post-deleted.event';
import { DraftPostService } from './draft-post.service';
import { ListPostsQueryDto } from '../presentation/dtos/list-posts.dto';
import { PublishedPostWithAuthor } from '../entities/published-post.entity';
import { DraftPost } from '../entities/draft-post.entity';

@Injectable()
export class PublishedPostService {
  private readonly logger = new Logger(PublishedPostService.name);

  constructor(
    @Inject('IPublishedPostRepository')
    private readonly publishedPostRepository: IPublishedPostRepository,
    @Inject('IDraftPostRepository')
    private readonly draftPostRepository: IDraftPostRepository,
    @InjectEventBus() private readonly eventBus: IEventBus,
    private readonly draftPostService: DraftPostService,
    private readonly prisma: PrismaService,
  ) {}

  async deletePublished(id: string, userId: string): Promise<void> {
    const published = await this.publishedPostRepository.findById(id);

    if (!published) {
      throw new PublishedPostNotFoundError(id);
    }

    if (published.userId !== userId) {
      throw new NotPublishedPostOwnerError(userId, id);
    }

    // Find and delete associated draft post
    const draft = await this.draftPostRepository.findByPublishedId(id);
    if (draft) {
      await this.draftPostService.deleteDraft(draft.id, userId);
    }

    // Delete published post
    await this.publishedPostRepository.delete(id);

    // Delete cover image if exists
    if (published.cover) {
      await this.eventBus.publish(new DeleteImageCommand(published.cover));
    }

    // Emit event for tracking/analytics
    await this.eventBus.publish(
      new PublishedPostDeletedEvent({
        postId: id,
        userId,
      }),
    );
  }

  async listPublished(
    query: ListPostsQueryDto,
  ): Promise<PagedResult<PublishedPostWithAuthor>> {
    return this.publishedPostRepository.findAll(query);
  }

  async createDraftFromPublished(
    publishedId: string,
    userId: string,
  ): Promise<DraftPost> {
    const published = await this.publishedPostRepository.findById(publishedId);

    if (!published) {
      throw new PublishedPostNotFoundError(publishedId);
    }

    if (published.userId !== userId) {
      throw new NotPublishedPostOwnerError(userId, publishedId);
    }

    // Check if a draft already exists for this published post
    const existingDraft =
      await this.draftPostRepository.findByPublishedId(publishedId);
    if (existingDraft) {
      this.logger.debug(
        `Draft already exists for published post ${publishedId}`,
      );
      return existingDraft;
    }

    // Get topics for the published post
    const topicIds = await this.prisma.postTopic.findMany({
      where: { postId: publishedId },
      select: { topicId: true },
    });

    // Create a new draft from the published post
    const draftData = {
      title: published.title,
      subtitle: published.subtitle,
      content: published.content,
      cover: published.cover,
      topics: topicIds.map((t) => t.topicId),
      userId,
      publishedId,
    };

    this.logger.debug(`Creating draft from published post ${publishedId}`);
    return this.draftPostRepository.create(draftData);
  }

  /**
   * Update engagement metadata for a post
   * @param id Post ID
   * @param metadata Metadata to update
   */
  async updateEngagementMetadata(
    id: string,
    metadata: {
      lastEngagementAt?: Date;
      lastViewedAt?: Date;
    },
  ): Promise<void> {
    try {
      await this.publishedPostRepository.updateMetadata(id, metadata);
    } catch (error) {
      this.logger.error(
        `Failed to update engagement metadata for post ${id}`,
        error,
      );
      throw new PostUpdateError(error);
    }
  }
}

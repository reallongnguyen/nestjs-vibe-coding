import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import { IEventBus } from 'src/common/event-manager';
import { InjectEventBus } from 'src/common/event-manager/presentation/decorators/inject-event-bus.decorator';
import { PagedResult } from 'src/common/models';

import { IDraftPostRepository } from './interfaces/draft-post.repository.interface';
import { ITopicRepository } from './interfaces/topic.repository.interface';
import { DraftPost } from '../entities/draft-post.entity';
import { PublishedPost } from '../entities/published-post.entity';
import { CreateDraftPostData } from './dtos/create-daft-post.dto';
import { ContentErrorFactory } from '../entities/errors';
import {
  generateSlug,
  calculateReadingTime,
  generateExcerpt,
} from './utils/content.utils';
import { ContentEvents } from './content.events';
import { DraftPostDeletedEvent } from '../entities/events/post-deleted.event';
import { IPublishedPostRepository } from './interfaces/published-post.repository.interface';
import { ListDraftPostsQueryDto } from '../presentation/dtos/list-posts.dto';

@Injectable()
export class DraftPostService {
  private readonly logger = new Logger(DraftPostService.name);

  constructor(
    @Inject('IDraftPostRepository')
    private readonly draftPostRepository: IDraftPostRepository,
    @Inject('ITopicRepository')
    private readonly topicRepository: ITopicRepository,
    @Inject('IPublishedPostRepository')
    private readonly publishedPostRepository: IPublishedPostRepository,
    @InjectEventBus() private readonly eventBus: IEventBus,
    private readonly prisma: PrismaService,
    private readonly events: ContentEvents,
  ) {}

  async createDraft(
    userId: string,
    data: CreateDraftPostData,
  ): Promise<DraftPost> {
    this.logger.debug(
      `Creating draft post for user ${userId} with topics ${data.topics.join(
        ',',
      )}`,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const topicRepo = this.topicRepository.withTransaction(tx as any);
        const draftRepo = this.draftPostRepository.withTransaction(tx as any);

        // Validate topics existence
        const topics = await topicRepo.findManyByIds(data.topics);

        if (topics.length !== data.topics.length) {
          const foundTopicIds = topics.map((t) => t.id);
          const missingTopicIds = data.topics.filter(
            (id) => !foundTopicIds.includes(id),
          );

          this.logger.warn(
            `Topics not found: ${missingTopicIds.join(',')} for user ${userId}`,
          );

          throw ContentErrorFactory.topicNotFound(missingTopicIds);
        }

        const draft = await draftRepo.create({
          ...data,
          userId,
        });

        this.logger.debug(`Created draft post ${draft.id} for user ${userId}`);

        return draft;
      });
    } catch (error) {
      // Check if it's from our factory
      if (error.code && error.code.startsWith('content.')) {
        throw error;
      }

      this.logger.error(
        `Failed to create draft post for user ${userId}`,
        error,
      );

      throw ContentErrorFactory.draftCreateFailed(error);
    }
  }

  async updateDraft(
    userId: string,
    draftId: string,
    data: Partial<CreateDraftPostData>,
  ): Promise<DraftPost> {
    this.logger.debug(`Updating draft post ${draftId} for user ${userId}`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const draftRepo = this.draftPostRepository.withTransaction(tx as any);
        const topicRepo = this.topicRepository.withTransaction(tx as any);

        // Check draft exists and ownership
        const draft = await draftRepo.findById(draftId);
        if (!draft) {
          throw ContentErrorFactory.draftNotFound(draftId);
        }
        if (draft.userId !== userId) {
          throw ContentErrorFactory.notDraftOwner(userId, draftId);
        }

        // Validate topics if provided
        if (data.topics?.length) {
          const topics = await topicRepo.findManyByIds(data.topics);
          if (topics.length !== data.topics.length) {
            const foundTopicIds = topics.map((t) => t.id);
            const missingTopicIds = data.topics.filter(
              (id) => !foundTopicIds.includes(id),
            );
            throw ContentErrorFactory.topicNotFound(missingTopicIds);
          }
        }

        const updated = await draftRepo.update(draftId, data);

        this.logger.debug(`Updated draft post ${draftId}`);

        return updated;
      });
    } catch (error) {
      // Check if it's from our factory
      if (error.code && error.code.startsWith('content.')) {
        throw error;
      }

      this.logger.error(`Failed to update draft post ${draftId}`, error);
      throw ContentErrorFactory.draftUpdateFailed(error);
    }
  }

  async publishDraft(
    userId: string,
    draftId: string,
    data: { slug?: string },
  ): Promise<PublishedPost> {
    this.logger.debug(`Publishing draft post ${draftId} for user ${userId}`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const draftRepo = this.draftPostRepository.withTransaction(tx as any);

        // Check draft exists and ownership
        const draft = await draftRepo.findById(draftId);
        if (!draft) {
          throw ContentErrorFactory.draftNotFound(draftId);
        }
        if (draft.userId !== userId) {
          throw ContentErrorFactory.notDraftOwner(userId, draftId);
        }

        // Generate slug if not provided
        const slug = data.slug || `${generateSlug(draft.title)}-${draftId}`;

        // Check if slug already exists
        const existingPost = await this.prisma.publishedPost.findUnique({
          where: { slug },
        });
        if (existingPost) {
          throw ContentErrorFactory.slugExists(slug);
        }

        // Calculate reading time and excerpt
        const readingTime = calculateReadingTime(draft.content);
        const excerpt = generateExcerpt(draft.content);

        // Publish the draft
        const { published } = await draftRepo.publish(draftId, {
          title: draft.title,
          subtitle: draft.subtitle,
          excerpt,
          slug,
          readingTime,
          content: draft.content,
          userId,
          cover: draft.cover,
          topicIds: draft.topics,
        });

        this.logger.debug(`Published draft post ${draftId} as ${published.id}`);

        // Emit event
        this.events.emitPostPublished(
          published.id,
          draftId,
          userId,
          published.title,
          published.slug,
          draft.topics,
        );

        return published;
      });
    } catch (error) {
      // Check if it's from our factory
      if (error.code && error.code.startsWith('content.')) {
        this.logger.warn('error is instance of AppError');
        throw error;
      }

      this.logger.error(`Failed to publish draft post ${draftId}`, error);
      throw ContentErrorFactory.draftPublishFailed(error);
    }
  }

  async deleteDraft(id: string, userId: string): Promise<void> {
    const draft = await this.draftPostRepository.findById(id);

    if (!draft) {
      throw ContentErrorFactory.draftNotFound(id);
    }

    if (draft.userId !== userId) {
      throw ContentErrorFactory.notDraftOwner(userId, id);
    }

    await this.draftPostRepository.delete(id);

    // If draft has a cover image, delete it
    if (draft.cover) {
      await this.eventBus.publish(new DeleteImageCommand(draft.cover));
    }

    // Emit draft deleted event
    await this.eventBus.publish(
      new DraftPostDeletedEvent({
        postId: id,
        userId,
      }),
    );
  }

  async listDrafts(
    userId: string,
    query: ListDraftPostsQueryDto,
  ): Promise<PagedResult<DraftPost>> {
    return this.draftPostRepository.findAll(userId, query);
  }

  async applyDraft(
    userId: string,
    draftId: string,
    data?: { excerpt?: string },
  ): Promise<PublishedPost> {
    this.logger.debug(
      `Applying draft post ${draftId} to published post for user ${userId}`,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const draftRepo = this.draftPostRepository.withTransaction(tx as any);

        // Check draft exists and ownership
        const draft = await draftRepo.findById(draftId);
        if (!draft) {
          throw ContentErrorFactory.draftNotFound(draftId);
        }
        if (draft.userId !== userId) {
          throw ContentErrorFactory.notDraftOwner(userId, draftId);
        }

        // Check if draft is linked to a published post
        if (!draft.publishedId) {
          throw ContentErrorFactory.draftNotLinkedToPublished(draftId);
        }

        // Calculate reading time
        const readingTime = calculateReadingTime(draft.content);

        // Generate excerpt if not provided
        const excerpt = data?.excerpt || generateExcerpt(draft.content);

        // Apply the draft changes to the published post
        const { published } = await draftRepo.applyToPublished(
          draftId,
          draft.publishedId,
          {
            title: draft.title,
            subtitle: draft.subtitle,
            excerpt,
            readingTime,
            content: draft.content,
            userId,
            cover: draft.cover,
            topicIds: draft.topics,
          },
        );

        // Emit post updated event
        this.events.emitPostUpdated(
          published.id,
          draftId,
          userId,
          published.title,
          published.slug,
          draft.topics,
        );

        this.logger.debug(
          `Applied draft post ${draftId} to published post ${published.id}`,
        );

        return published;
      });
    } catch (error) {
      // Check if it's from our factory
      if (error.code && error.code.startsWith('content.')) {
        this.logger.warn('error is instance of AppError');
        throw error;
      }

      this.logger.error(`Failed to apply draft post ${draftId}`, error);
      throw ContentErrorFactory.draftPublishFailed(error);
    }
  }
}

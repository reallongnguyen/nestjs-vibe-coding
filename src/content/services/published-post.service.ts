import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventBus, InjectEventBus } from 'src/common/event-bus';
import { DeleteImageCommand } from 'src/common/event-bus/core/domain/commands/delete-image.command';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Collection } from 'src/common/models';

import { IPublishedPostRepository } from './interfaces/published-post.repository.interface';
import { IDraftPostRepository } from './interfaces/draft-post.repository.interface';
import {
  PublishedPostNotFoundError,
  NotPublishedPostOwnerError,
} from '../entities/content.error';
import { PublishedPostDeletedEvent } from '../entities/events/post-deleted.event';
import { DraftPostService } from './draft-post.service';
import { ListPostsQueryDto } from '../presentation/dtos/list-posts.dto';
import { PublishedPostWithAuthor } from '../entities/published-post.entity';

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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
  ): Promise<Collection<PublishedPostWithAuthor>> {
    return this.publishedPostRepository.findAll(query);
  }
}

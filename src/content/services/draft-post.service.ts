import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IDraftPostRepository } from './interfaces/draft-post.repository.interface';
import { ITopicRepository } from './interfaces/topic.repository.interface';
import { DraftPost } from '../entities/draft-post.entity';
import { CreateDraftPostData } from './dtos/create-daft-post.dto';
import {
  TopicNotFoundError,
  DraftCreateError,
} from '../entities/content.error';

@Injectable()
export class DraftPostService {
  private readonly logger = new Logger(DraftPostService.name);

  constructor(
    @Inject('IDraftPostRepository')
    private readonly draftPostRepository: IDraftPostRepository,
    @Inject('ITopicRepository')
    private readonly topicRepository: ITopicRepository,
    private readonly prisma: PrismaService,
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

          throw new TopicNotFoundError(missingTopicIds);
        }

        const draft = await draftRepo.create({
          ...data,
          userId,
        });

        this.logger.debug(`Created draft post ${draft.id} for user ${userId}`);

        return draft;
      });
    } catch (error) {
      // If it's our custom error, rethrow it
      if (error instanceof TopicNotFoundError) {
        throw error;
      }

      this.logger.error(
        `Failed to create draft post for user ${userId}`,
        error,
      );

      throw new DraftCreateError(error);
    }
  }
}

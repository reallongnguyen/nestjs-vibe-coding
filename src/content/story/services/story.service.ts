import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { StoryErrorFactory } from '../entities/errors';
import { StoryCreatedEvent } from '../entities/events';
import { Story } from '../entities/story.entity';
import {
  StoryRepository,
  STORY_REPOSITORY,
} from '../repositories/story.repository';

@Injectable()
export class StoryService {
  constructor(
    @Inject(STORY_REPOSITORY)
    private readonly storyRepository: StoryRepository,
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  /**
   * Create a new story
   */
  async createStory(data: {
    content: string;
    images: string[];
    userId: string;
    parentId?: string | null;
  }) {
    const { content, images, userId, parentId } = data;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw StoryErrorFactory.contentEmpty();
    }

    if (content.length > 5000) {
      throw StoryErrorFactory.contentTooLong();
    }

    let rootId: string | null = null;
    let chainPosition = 0;

    // If this is a continuation of an existing story, validate the parent story
    if (parentId) {
      const parentStory = await this.storyRepository.findById(parentId);

      if (!parentStory) {
        throw StoryErrorFactory.parentStoryNotFound(parentId);
      }

      if (parentStory.isArchived) {
        throw StoryErrorFactory.cannotContinueArchivedStory();
      }

      // Continue the chain from parent
      rootId = parentStory.rootId ?? parentStory.id;
      chainPosition = parentStory.chainPosition + 1;
    }

    // Create the story
    const story = await this.storyRepository.create({
      content,
      images: images || [],
      userId,
      parentId: parentId || null,
      rootId,
      chainPosition,
    });

    // Publish event
    try {
      await this.publishStoryCreatedEvent(story);
    } catch (error) {
      this.logger.error(
        `Failed to publish story created event: ${error.message}`,
        error.stack,
      );
    }

    return story;
  }

  /**
   * Publish event when a story is created
   */
  private async publishStoryCreatedEvent(story: Story) {
    const event = new StoryCreatedEvent({
      storyId: story.id,
      userId: story.userId,
      content: story.content,
      images: story.images,
      parentId: story.parentId,
      rootId: story.rootId,
      chainPosition: story.chainPosition,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }
}

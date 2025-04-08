import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { StoryErrorFactory } from '../entities/errors';
import {
  StoryCreatedEvent,
  StoryContinuedEvent,
  StoryForkedEvent,
} from '../entities/events';
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
   * Continue an existing story
   */
  async continueStory(data: {
    content: string;
    images: string[];
    userId: string;
    parentId: string;
  }) {
    const { content, images, userId, parentId } = data;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw StoryErrorFactory.contentEmpty();
    }

    if (content.length > 5000) {
      throw StoryErrorFactory.contentTooLong();
    }

    // Validate parent story
    const parentStory = await this.storyRepository.findById(parentId);

    if (!parentStory) {
      throw StoryErrorFactory.parentStoryNotFound(parentId);
    }

    if (parentStory.isArchived) {
      throw StoryErrorFactory.cannotContinueArchivedStory();
    }

    // Continue the chain from parent
    const rootId = parentStory.rootId ?? parentStory.id;
    const chainPosition = parentStory.chainPosition + 1;

    // Create the continuation story
    const story = await this.storyRepository.create({
      content,
      images: images || [],
      userId,
      parentId,
      rootId,
      chainPosition,
    });

    // Publish event
    try {
      await this.publishStoryContinuedEvent(story);
    } catch (error) {
      this.logger.error(
        `Failed to publish story continued event: ${error.message}`,
        error.stack,
      );
    }

    return story;
  }

  /**
   * Fork a story to create a new chain/branch
   */
  async forkStory(data: {
    content: string;
    images: string[];
    userId: string;
    sourceStoryId: string;
  }) {
    const { content, images, userId, sourceStoryId } = data;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw StoryErrorFactory.contentEmpty();
    }

    if (content.length > 5000) {
      throw StoryErrorFactory.contentTooLong();
    }

    // Validate source story
    const sourceStory = await this.storyRepository.findById(sourceStoryId);

    if (!sourceStory) {
      throw StoryErrorFactory.storyNotFound(sourceStoryId);
    }

    if (sourceStory.isArchived) {
      throw StoryErrorFactory.cannotForkArchivedStory();
    }

    // Create a new story with sourceStory as parent, but start a new chain
    // A forked story is the root of its own chain (chainPosition = 0, rootId = null initially)
    const story = await this.storyRepository.create({
      content,
      images: images || [],
      userId,
      parentId: sourceStoryId, // Link to source story
      rootId: null, // This will be updated to its own ID after creation
      chainPosition: 0, // First story in the new chain
    });

    // Update the story to set its rootId to its own ID (it's the root of a new chain)
    const updatedStory = await this.storyRepository.update(
      Story.create({
        ...story,
        rootId: story.id,
      }),
    );

    // Publish event
    try {
      await this.publishStoryForkedEvent(updatedStory, sourceStoryId);
    } catch (error) {
      this.logger.error(
        `Failed to publish story forked event: ${error.message}`,
        error.stack,
      );
    }

    return updatedStory;
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

  /**
   * Publish event when a story is continued
   */
  private async publishStoryContinuedEvent(story: Story) {
    const event = new StoryContinuedEvent({
      storyId: story.id,
      userId: story.userId,
      parentId: story.parentId!,
      rootId: story.rootId!,
      chainPosition: story.chainPosition,
      content: story.content,
      images: story.images,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }

  /**
   * Publish event when a story is forked
   */
  private async publishStoryForkedEvent(story: Story, sourceStoryId: string) {
    const event = new StoryForkedEvent({
      storyId: story.id,
      userId: story.userId,
      sourceStoryId,
      content: story.content,
      images: story.images,
      timestamp: Date.now(),
    });

    await this.eventBus.publish(event);
  }

  /**
   * Get a story chain by its root ID
   */
  async getStoryChain(rootId: string) {
    // First, validate that the root story exists
    const rootStory = await this.storyRepository.findById(rootId);
    if (!rootStory) {
      throw StoryErrorFactory.storyNotFound(rootId);
    }

    // Verify this is actually a root story
    if (rootStory.rootId !== rootId) {
      throw StoryErrorFactory.notChainRoot(rootId);
    }

    // Get all stories in the chain
    const chainStories = await this.storyRepository.findByRootId(rootId);

    // Build the tree structure
    const storyMap = new Map(
      chainStories.map((story) => [story.id, { ...story, children: [] }]),
    );
    const root = storyMap.get(rootId)!;
    let maxDepth = 0;

    // Organize stories into tree structure
    for (const story of chainStories) {
      if (story.id === rootId) continue; // Skip root
      const parent = storyMap.get(story.parentId!)!;
      parent.children.push(storyMap.get(story.id)!);
      maxDepth = Math.max(maxDepth, story.chainPosition);
    }

    return {
      root,
      totalStories: chainStories.length,
      maxDepth,
    };
  }
}

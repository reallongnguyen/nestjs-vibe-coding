import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common';
import {
  GorseItemType,
  GorseFeedbackType,
  IEventBus,
  InjectEventBus,
} from 'src/common/event-manager';

import { GorseClient } from './gorse.client';
import {
  FeedbackSyncEvent,
  ItemSyncEvent,
  UserSyncEvent,
} from '../entities/events/gorse.events';

/**
 * Service responsible for synchronizing data between the application and Gorse
import { IEventBus } from 'src/common/event-manager';
 */
@Injectable()
export class GorseSyncService {
  private readonly logger = new Logger(GorseSyncService.name);

  constructor(
    private readonly gorseClient: GorseClient,
    private readonly prisma: PrismaService,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Performs initial synchronization of users, items, and feedback
   */
  async performInitialSync(): Promise<void> {
    try {
      this.logger.log('Starting initial Gorse synchronization');

      // Sync users
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          updatedAt: true,
        },
      });

      const userSyncPromises = users.map((user) =>
        this.handleUserSync(
          new UserSyncEvent({
            userId: user.id,
            labels: [],
            lastActiveAt: user.updatedAt,
          }),
        ),
      );
      await Promise.all(userSyncPromises);

      // Sync items (posts)
      const posts = await this.prisma.publishedPost.findMany({
        select: {
          id: true,
          publishedAt: true,
          topics: {
            select: {
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      const itemSyncPromises = posts.map((post) =>
        this.handleItemSync(
          new ItemSyncEvent({
            itemId: post.id,
            itemType: GorseItemType.POST,
            timestamp: post.publishedAt,
            labels: post.topics.map((t) => t.topic.name),
            categories: [],
          }),
        ),
      );
      await Promise.all(itemSyncPromises);

      // Sync feedback
      const likes = await this.prisma.like.findMany({
        where: {
          type: 'POST',
        },
        select: {
          userId: true,
          contentId: true,
          createdAt: true,
        },
      });

      const feedbackSyncPromises = likes.map((fb) =>
        this.handleFeedbackSync(
          new FeedbackSyncEvent({
            userId: fb.userId,
            itemId: fb.contentId,
            feedbackType: GorseFeedbackType.LIKE,
            timestamp: fb.createdAt,
          }),
        ),
      );
      await Promise.all(feedbackSyncPromises);

      this.logger.log('Initial Gorse synchronization completed');
    } catch (error) {
      this.logger.error(
        'Failed to perform initial Gorse synchronization',
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles user synchronization events
   */
  async handleUserSync(event: UserSyncEvent): Promise<void> {
    try {
      await this.gorseClient.insertUser(
        event.payload.userId,
        event.payload.labels,
        [],
      );
      this.logger.debug(`Synchronized user ${event.payload.userId} to Gorse`);
    } catch (error) {
      this.logger.error(
        `Failed to sync user ${event.payload.userId} to Gorse`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles item synchronization events
   */
  async handleItemSync(event: ItemSyncEvent): Promise<void> {
    try {
      await this.gorseClient.insertItem(
        event.payload.itemId,
        event.payload.timestamp,
        event.payload.labels,
        event.payload.categories,
      );
      this.logger.debug(`Synchronized item ${event.payload.itemId} to Gorse`);
    } catch (error) {
      this.logger.error(
        `Failed to sync item ${event.payload.itemId} to Gorse`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles feedback synchronization events
   */
  async handleFeedbackSync(event: FeedbackSyncEvent): Promise<void> {
    try {
      await this.gorseClient.insertFeedback({
        FeedbackType: event.payload.feedbackType,
        UserId: event.payload.userId,
        ItemId: event.payload.itemId,
        Timestamp: event.payload.timestamp.toISOString(),
      });
      this.logger.debug(
        `Synchronized feedback from user ${event.payload.userId} for item ${event.payload.itemId} to Gorse`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync feedback from user ${event.payload.userId} for item ${event.payload.itemId} to Gorse`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles user update events
   */
  async handleUserUpdate(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      await this.handleUserSync(
        new UserSyncEvent({
          userId: user.id,
          labels: [],
          lastActiveAt: user.updatedAt,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle user update for ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles new content events
   */
  async handleNewContent(contentId: string): Promise<void> {
    try {
      const content = await this.prisma.publishedPost.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          publishedAt: true,
          topics: {
            select: {
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      await this.handleItemSync(
        new ItemSyncEvent({
          itemId: content.id,
          itemType: GorseItemType.POST,
          timestamp: content.publishedAt,
          labels: content.topics.map((t) => t.topic.name),
          categories: [],
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle new content for ${contentId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handles feedback events
   */
  async handleFeedback(userId: string, contentId: string): Promise<void> {
    try {
      const feedback = await this.prisma.like.findFirst({
        where: {
          userId,
          contentId,
          type: 'POST',
        },
        select: {
          userId: true,
          contentId: true,
          createdAt: true,
        },
      });

      if (!feedback) {
        throw new Error(
          `Feedback not found for user ${userId} and content ${contentId}`,
        );
      }

      await this.handleFeedbackSync(
        new FeedbackSyncEvent({
          userId: feedback.userId,
          itemId: feedback.contentId,
          feedbackType: GorseFeedbackType.LIKE,
          timestamp: feedback.createdAt,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle feedback for user ${userId} and content ${contentId}`,
        error.stack,
      );
      throw error;
    }
  }
}

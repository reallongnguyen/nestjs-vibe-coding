/* eslint-disable no-await-in-loop */
import { Injectable, Logger } from '@nestjs/common';
import { IEventBus, InjectEventBus } from '../../common/event-manager';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GorseClient } from './gorse.client';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
} from '../entities/events/gorse-sync.events';
import { SyncOperation } from '../../common/event-manager/entities/events/schemas/recommendation.events';

/**
 * Service responsible for synchronizing data between the application and Gorse
 */
@Injectable()
export class GorseSyncService {
  private readonly logger = new Logger(GorseSyncService.name);
  private readonly batchSize = 100;

  constructor(
    @InjectEventBus()
    private readonly eventBus: IEventBus,
    private readonly prisma: PrismaService,
    private readonly gorseClient: GorseClient,
  ) {}

  /**
   * Publish a user sync event
   */
  async publishUserSync(
    userId: string,
    labels: string[],
    operation: SyncOperation,
    subscribe?: string[],
  ): Promise<void> {
    const event = new UserSyncEvent({
      userId,
      labels,
      subscribe,
      timestamp: Date.now(),
      operation,
    });

    await this.eventBus.publish(event);
  }

  /**
   * Publish an item sync event
   */
  async publishItemSync(
    itemId: string,
    labels: string[],
    operation: SyncOperation,
    categories?: string[],
    isHidden?: boolean,
  ): Promise<void> {
    const event = new ItemSyncEvent({
      itemId,
      labels,
      categories,
      isHidden,
      timestamp: Date.now(),
      operation,
    });

    await this.eventBus.publish(event);
  }

  /**
   * Publish a feedback sync event
   */
  async publishFeedbackSync(
    feedbackType: string,
    userId: string,
    itemId: string,
    comment?: string,
  ): Promise<void> {
    const event = new FeedbackSyncEvent({
      feedbackType,
      userId,
      itemId,
      timestamp: Date.now(),
      comment,
    });

    await this.eventBus.publish(event);
  }

  /**
   * Perform initial sync of all data to Gorse
   */
  async performInitialSync(): Promise<void> {
    this.logger.log('Starting initial sync with Gorse');

    try {
      await this.syncUsers();
      await this.syncItems();
      await this.syncFeedback();

      this.logger.log('Initial sync completed successfully');
    } catch (error) {
      this.logger.error('Initial sync failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Sync all users to Gorse
   */
  private async syncUsers(): Promise<void> {
    let cursor: string | undefined;
    let syncCount = 0;

    this.logger.log('Starting user sync');

    try {
      while (true) {
        const users = await this.prisma.user.findMany({
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            roles: true,
          },
        });

        if (users.length === 0) break;

        const events = users.map(
          (user) =>
            new UserSyncEvent({
              userId: user.id,
              labels: user.roles,
              subscribe: [],
              timestamp: Date.now(),
              operation: SyncOperation.CREATE,
            }),
        );

        await Promise.all(events.map((event) => this.eventBus.publish(event)));
        syncCount += events.length;

        cursor = users[users.length - 1].id;
      }

      this.logger.log(`User sync completed`, { syncCount });
    } catch (error) {
      this.logger.error('User sync failed', {
        error: error.message,
        stack: error.stack,
        cursor,
        syncCount,
      });
      throw error;
    }
  }

  /**
   * Sync all items to Gorse
   */
  private async syncItems(): Promise<void> {
    let cursor: string | undefined;
    let syncCount = 0;

    this.logger.log('Starting item sync');

    try {
      // Sync posts
      while (true) {
        const items = await this.prisma.publishedPost.findMany({
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            topics: {
              select: {
                topic: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            isArchived: true,
          },
        });

        if (items.length === 0) break;

        const events = items.map((item) => {
          const topics = item.topics.map((t) => t.topic.name);
          return new ItemSyncEvent({
            itemId: item.id,
            labels: topics,
            categories: topics,
            isHidden: item.isArchived,
            timestamp: Date.now(),
            operation: SyncOperation.CREATE,
          });
        });

        await Promise.all(events.map((event) => this.eventBus.publish(event)));
        syncCount += events.length;

        cursor = items[items.length - 1].id;
      }

      // Reset cursor for emotions
      cursor = undefined;

      // Sync emotions
      while (true) {
        const emotions = await this.prisma.userEmotion.findMany({
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            emotion: true,
            intensity: true,
          },
        });

        if (emotions.length === 0) break;

        const events = emotions.map((emotion) => {
          return new ItemSyncEvent({
            itemId: emotion.id,
            labels: [],
            categories: [],
            isHidden: false,
            timestamp: Date.now(),
            operation: SyncOperation.CREATE,
          });
        });

        await Promise.all(events.map((event) => this.eventBus.publish(event)));
        syncCount += events.length;

        cursor = emotions[emotions.length - 1].id;
      }

      this.logger.log(`Item sync completed`, { syncCount });
    } catch (error) {
      this.logger.error('Item sync failed', {
        error: error.message,
        stack: error.stack,
        cursor,
        syncCount,
      });
      throw error;
    }
  }

  /**
   * Sync all feedback to Gorse
   */
  private async syncFeedback(): Promise<void> {
    let cursor: string | undefined;
    let syncCount = 0;

    this.logger.log('Starting feedback sync');

    try {
      // Sync likes
      while (true) {
        const likes = await this.prisma.like.findMany({
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            type: true,
            userId: true,
            contentId: true,
          },
        });

        if (likes.length === 0) break;

        const events = likes
          .filter(
            (like) => like.type === 'POST' || like.type === 'USER_EMOTION',
          )
          .map(
            (like) =>
              new FeedbackSyncEvent({
                feedbackType: 'like',
                userId: like.userId,
                itemId: like.contentId,
                timestamp: Date.now(),
              }),
          );

        await Promise.all(events.map((event) => this.eventBus.publish(event)));
        syncCount += events.length;

        cursor = likes[likes.length - 1].id;
      }

      // Reset cursor for views
      cursor = undefined;

      // Sync views
      while (true) {
        const views = await this.prisma.view.findMany({
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            type: true,
            contentId: true,
            viewerId: true,
          },
        });

        if (views.length === 0) break;

        const events = views
          .filter(
            (view) => view.type === 'POST' || view.type === 'USER_EMOTION',
          )
          .filter((view) => view.viewerId) // Only sync views with known viewers
          .map(
            (view) =>
              new FeedbackSyncEvent({
                feedbackType: 'read',
                userId: view.viewerId,
                itemId: view.contentId,
                timestamp: Date.now(),
              }),
          );

        await Promise.all(events.map((event) => this.eventBus.publish(event)));
        syncCount += events.length;

        cursor = views[views.length - 1].id;
      }

      this.logger.log(`Feedback sync completed`, { syncCount });
    } catch (error) {
      this.logger.error('Feedback sync failed', {
        error: error.message,
        stack: error.stack,
        cursor,
        syncCount,
      });
      throw error;
    }
  }

  /**
   * Validate sync status with Gorse
   */
  async validateSyncStatus(): Promise<void> {
    this.logger.log('Starting sync validation');

    try {
      const [dbCounts, gorseCounts] = await Promise.all([
        this.getDbCounts(),
        this.getGorseCounts(),
      ]);

      const discrepancies = this.findDiscrepancies(dbCounts, gorseCounts);

      if (Object.keys(discrepancies).length > 0) {
        this.logger.warn('Sync validation found discrepancies', {
          discrepancies,
        });
        await this.handleDiscrepancies(discrepancies);
      } else {
        this.logger.log('Sync validation completed successfully');
      }
    } catch (error) {
      this.logger.error('Sync validation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private async getDbCounts() {
    const [users, items, feedback] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.publishedPost.count(),
      this.prisma.like.count({
        where: {
          type: 'POST',
        },
      }),
    ]);

    return { users, items, feedback };
  }

  private async getGorseCounts() {
    const [users, items, feedback] = await Promise.all([
      this.gorseClient.getUserCount(),
      this.gorseClient.getItemCount(),
      this.gorseClient.getFeedbackCount(),
    ]);

    return { users, items, feedback };
  }

  private findDiscrepancies(dbCounts: any, gorseCounts: any) {
    const discrepancies: Record<string, { db: number; gorse: number }> = {};

    for (const key of Object.keys(dbCounts)) {
      if (dbCounts[key] !== gorseCounts[key]) {
        discrepancies[key] = {
          db: dbCounts[key],
          gorse: gorseCounts[key],
        };
      }
    }

    return discrepancies;
  }

  private async handleDiscrepancies(
    discrepancies: Record<string, { db: number; gorse: number }>,
  ) {
    // Log discrepancies and trigger re-sync if needed
    for (const [type, counts] of Object.entries(discrepancies)) {
      this.logger.warn(`Found ${type} count mismatch`, counts);
    }

    // Could trigger selective re-sync based on discrepancy type
    await this.performInitialSync();
  }
}

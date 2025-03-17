import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentEventSchemas } from 'src/common/event-manager/entities/events/schemas/content.events';
import { SyncOperation } from 'src/common/event-manager/entities/events/schemas/recommendation.events';
import { GorseSyncService } from '../../services/gorse-sync.service';

/**
 * Handler for content events to sync with Gorse
 */
@Injectable()
export class ContentSyncHandler {
  private readonly logger = new Logger(ContentSyncHandler.name);

  constructor(private readonly gorseSyncService: GorseSyncService) {}

  /**
   * Handle tweet created events
   */
  @OnEvent(ContentEventSchemas.TWEET_CREATED.eventName)
  async handleTweetCreated(
    payload: typeof ContentEventSchemas.TWEET_CREATED.schema,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Handling tweet created event for tweet ${payload.tweetId}`,
      );

      // We don't have specific labels for tweets yet, so using an empty array
      // In a real application, you might extract hashtags or categories from the tweet content
      const labels: string[] = [];

      // Sync the tweet to Gorse
      await this.gorseSyncService.publishItemSync(
        payload.tweetId,
        labels,
        SyncOperation.CREATE,
        ['tweet'], // Category
        false, // Is hidden (not archived when created)
      );

      this.logger.debug(
        `Successfully synced tweet ${payload.tweetId} to Gorse`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync tweet ${payload.tweetId} to Gorse: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle tweet updated events
   */
  @OnEvent(ContentEventSchemas.TWEET_UPDATED.eventName)
  async handleTweetUpdated(
    payload: typeof ContentEventSchemas.TWEET_UPDATED.schema,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Handling tweet updated event for tweet ${payload.tweetId}`,
      );

      // Sync the updated tweet to Gorse
      await this.gorseSyncService.publishItemSync(
        payload.tweetId,
        [], // Labels - we don't have specific labels in the update event
        SyncOperation.UPDATE,
        ['tweet'], // Category
      );

      this.logger.debug(
        `Successfully synced updated tweet ${payload.tweetId} to Gorse`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync updated tweet ${payload.tweetId} to Gorse: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle tweet deleted events
   */
  @OnEvent(ContentEventSchemas.TWEET_DELETED.eventName)
  async handleTweetDeleted(
    payload: typeof ContentEventSchemas.TWEET_DELETED.schema,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Handling tweet deleted event for tweet ${payload.tweetId}`,
      );

      // Delete the tweet from Gorse
      await this.gorseSyncService.publishItemSync(
        payload.tweetId,
        [],
        SyncOperation.DELETE,
      );

      this.logger.debug(
        `Successfully deleted tweet ${payload.tweetId} from Gorse`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete tweet ${payload.tweetId} from Gorse: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle tweet viewed events
   */
  @OnEvent(ContentEventSchemas.TWEET_VIEWED.eventName)
  async handleTweetViewed(
    payload: typeof ContentEventSchemas.TWEET_VIEWED.schema,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Handling tweet viewed event for tweet ${payload.tweetId} by user ${payload.userId}`,
      );

      // Record the view feedback in Gorse
      await this.gorseSyncService.publishFeedbackSync(
        'view', // feedback type
        payload.userId,
        payload.tweetId,
      );

      this.logger.debug(
        `Successfully recorded view of tweet ${payload.tweetId} by user ${payload.userId} in Gorse`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record view of tweet ${payload.tweetId} in Gorse: ${error.message}`,
        error.stack,
      );
    }
  }
}

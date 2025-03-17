import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { ContentEventSchemas } from 'src/common/event-manager/entities/events/schemas';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import {
  TweetRepository,
  TWEET_REPOSITORY,
} from '../repositories/tweet.repository';

/**
 * Handles tweet image cleanup when tweets are edited or deleted
 * Listens for tweet update and delete events and removes any orphaned images
 */
@Injectable()
export class TweetImageCleanupHandler {
  private readonly logger = new Logger(TweetImageCleanupHandler.name);

  constructor(
    @InjectEventBus() private readonly eventBus: IEventBus,
    @Inject(TWEET_REPOSITORY) private readonly tweetRepository: TweetRepository,
  ) {}

  /**
   * Handle tweet update events to clean up any removed images
   * @param payload - The tweet update event payload
   */
  @OnEvent(ContentEventSchemas.TWEET_UPDATED.eventName)
  async handleTweetUpdated(payload: any): Promise<void> {
    try {
      const { tweetId, images: newImages = [] } = payload;

      this.logger.debug(
        `Processing tweet update for image cleanup: ${tweetId}`,
      );

      // Get the tweet from database to compare old and new images
      const tweet = await this.tweetRepository.findById(tweetId);
      if (!tweet) {
        this.logger.warn(`Tweet not found for cleanup: ${tweetId}`);
        return;
      }

      const oldImages = tweet.images || [];
      const imagesToDelete = oldImages.filter(
        (image) => !newImages.includes(image),
      );

      if (imagesToDelete.length > 0) {
        this.logger.log(
          `Tweet ${tweetId} update: found ${imagesToDelete.length} images to delete`,
        );
        await this.deleteImages(imagesToDelete);
      } else {
        this.logger.debug(`No images to delete for tweet update: ${tweetId}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling tweet update for image cleanup: ${error.message}`,
        error.stack,
      );
      // Don't rethrow to avoid affecting the main tweet update flow
    }
  }

  /**
   * Handle tweet deletion events to clean up all associated images
   * @param payload - The tweet deletion event payload
   */
  @OnEvent(ContentEventSchemas.TWEET_DELETED.eventName)
  async handleTweetDeleted(payload: any): Promise<void> {
    try {
      const { tweetId, images = [] } = payload;

      this.logger.debug(
        `Processing tweet deletion for image cleanup: ${tweetId}`,
      );

      if (images.length > 0) {
        this.logger.log(
          `Tweet ${tweetId} deleted: cleaning up ${images.length} images`,
        );
        await this.deleteImages(images);
      } else {
        this.logger.debug(`No images to delete for deleted tweet: ${tweetId}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling tweet deletion for image cleanup: ${error.message}`,
        error.stack,
      );
      // Don't rethrow to avoid affecting the main tweet deletion flow
    }
  }

  /**
   * Queue image deletions by publishing DeleteImageCommand events
   * @param images - Array of image URLs to delete
   */
  private async deleteImages(images: string[]): Promise<void> {
    if (!images.length) return;

    this.logger.log(`Queueing ${images.length} images for deletion`);

    // Process deletions in parallel with Promise.all
    await Promise.all(
      images.map(async (imageUrl) => {
        try {
          const command = new DeleteImageCommand(imageUrl);
          await this.eventBus.publish(command);
          this.logger.debug(`Queued image for deletion: ${imageUrl}`);
        } catch (error) {
          this.logger.error(
            `Failed to queue image deletion for ${imageUrl}: ${error.message}`,
            error.stack,
          );
          // Continue with other images even if one fails
        }
      }),
    );
  }
}

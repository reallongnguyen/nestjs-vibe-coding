import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GorseClient } from '../../services/gorse.client';
import {
  UserSyncEvent,
  ItemSyncEvent,
  FeedbackSyncEvent,
  GORSE_EVENTS,
} from '../../entities/events/gorse-sync.events';
import { SyncOperation } from '../../../common/event-manager/entities/events/schemas/recommendation.events';

@Injectable()
export class GorseSyncHandler {
  private readonly logger = new Logger(GorseSyncHandler.name);

  constructor(private readonly gorseClient: GorseClient) {}

  @OnEvent(GORSE_EVENTS.USER_SYNC.eventName)
  async handleUserSync(event: UserSyncEvent): Promise<void> {
    try {
      const { userId, labels, subscribe, operation } = event.payload;

      switch (operation) {
        case SyncOperation.CREATE:
        case SyncOperation.UPDATE:
          await this.gorseClient.insertUser(userId, labels, subscribe);
          this.logger.debug(`User ${userId} synced to Gorse`, {
            eventId: event.eventId,
            operation,
          });
          break;

        case SyncOperation.DELETE:
          await this.gorseClient.deleteUser(userId);
          this.logger.debug(`User ${userId} deleted from Gorse`, {
            eventId: event.eventId,
          });
          break;

        default:
          this.logger.warn(`Unsupported operation ${operation} for user sync`, {
            eventId: event.eventId,
            userId,
          });
      }
    } catch (error) {
      this.logger.error(`Failed to sync user to Gorse`, {
        eventId: event.eventId,
        userId: event.payload.userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  @OnEvent(GORSE_EVENTS.ITEM_SYNC.eventName)
  async handleItemSync(event: ItemSyncEvent): Promise<void> {
    try {
      const { itemId, labels, categories, isHidden, operation, timestamp } =
        event.payload;

      switch (operation) {
        case SyncOperation.CREATE:
        case SyncOperation.UPDATE:
          await this.gorseClient.insertItem(
            itemId,
            new Date(timestamp),
            labels,
            categories,
            isHidden,
          );
          this.logger.debug(`Item ${itemId} synced to Gorse`, {
            eventId: event.eventId,
            operation,
          });
          break;

        case SyncOperation.DELETE:
          await this.gorseClient.deleteItem(itemId);
          this.logger.debug(`Item ${itemId} deleted from Gorse`, {
            eventId: event.eventId,
          });
          break;

        default:
          this.logger.warn(`Unsupported operation ${operation} for item sync`, {
            eventId: event.eventId,
            itemId,
          });
      }
    } catch (error) {
      this.logger.error(`Failed to sync item to Gorse`, {
        eventId: event.eventId,
        itemId: event.payload.itemId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  @OnEvent(GORSE_EVENTS.FEEDBACK_SYNC.eventName)
  async handleFeedbackSync(event: FeedbackSyncEvent): Promise<void> {
    try {
      const { feedbackType, userId, itemId, timestamp, comment } =
        event.payload;

      await this.gorseClient.insertFeedback({
        FeedbackType: feedbackType,
        UserId: userId,
        ItemId: itemId,
        Timestamp: new Date(timestamp).toISOString(),
        Comment: comment,
      });

      this.logger.debug(`Feedback synced to Gorse`, {
        eventId: event.eventId,
        userId,
        itemId,
        feedbackType,
      });
    } catch (error) {
      this.logger.error(`Failed to sync feedback to Gorse`, {
        eventId: event.eventId,
        userId: event.payload.userId,
        itemId: event.payload.itemId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

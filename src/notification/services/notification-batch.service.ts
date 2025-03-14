import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from 'nestjs-pino';

import { NotificationConsumerService } from './notification-consumer.service';
import { NotificationMetricsService } from './notification-metrics.service';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';

/**
 * Configuration for notification batching
 */
export interface BatchConfiguration {
  maxBatchSize: number; // Maximum number of notifications in a batch
  batchTimeoutMs: number; // Maximum time to wait before processing a batch
  maxRetries: number; // Maximum number of retries for failed batches
  retryDelayMs: number; // Delay between retries
}

/**
 * Service for handling notification batching
 * Improves performance by processing notifications in batches
 */
@Injectable()
export class NotificationBatchService {
  private readonly config: BatchConfiguration;
  private readonly batchMap: Map<string, NotificationCreateInput[]> = new Map();
  private readonly batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly consumerService: NotificationConsumerService,
    private readonly metricsService: NotificationMetricsService,
    @InjectQueue('notification-batch') private readonly batchQueue: Queue,
  ) {
    // Load configuration from config service
    this.config = {
      maxBatchSize: this.configService.get<number>(
        'notification.batch.maxSize',
        50,
      ),
      batchTimeoutMs: this.configService.get<number>(
        'notification.batch.timeoutMs',
        5000,
      ),
      maxRetries: this.configService.get<number>(
        'notification.batch.maxRetries',
        3,
      ),
      retryDelayMs: this.configService.get<number>(
        'notification.batch.retryDelayMs',
        1000,
      ),
    };

    this.logger.debug(
      `NotificationBatchService initialized with config: ${JSON.stringify(this.config)}`,
    );
  }

  /**
   * Add a notification to a batch for processing
   * @param notification Notification to add to batch
   * @param batchKey Key to identify the batch (usually userId or type)
   */
  async addToBatch(
    notification: NotificationCreateInput,
    batchKey?: string,
  ): Promise<void> {
    // Use notification type + userId as default batch key if not provided
    const key = batchKey || `${notification.type}:${notification.userId}`;

    // Start timer to track processing time
    const timer = this.metricsService.startTimer(
      notification.type,
      'batch_add',
    );

    try {
      // Get or create batch for this key
      if (!this.batchMap.has(key)) {
        this.batchMap.set(key, []);

        // Set timeout to process batch if it doesn't reach max size
        this.setBatchTimeout(key);
      }

      // Add notification to batch
      const batch = this.batchMap.get(key);
      batch.push(notification);

      // Update metrics
      this.metricsService.setQueueLength(
        'batch',
        this.getTotalQueuedNotifications(),
      );

      // Process batch immediately if it reaches max size
      if (batch.length >= this.config.maxBatchSize) {
        this.logger.debug(
          `Batch ${key} reached max size (${batch.length}), processing immediately`,
        );
        await this.processBatch(key);
      }
    } catch (error) {
      this.logger.error(
        `Error adding notification to batch: ${error.message}`,
        error.stack,
      );
      this.metricsService.incrementCounter(notification.type, 'batch_error');

      // Fall back to direct processing if batching fails
      await this.consumerService.upsertNotificationSerialByKey(notification);
    } finally {
      timer.end();
    }
  }

  /**
   * Process a batch of notifications
   * @param batchKey Key identifying the batch to process
   */
  async processBatch(batchKey: string): Promise<void> {
    // Clear any pending timeout
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey));
      this.batchTimers.delete(batchKey);
    }

    // Get batch
    const batch = this.batchMap.get(batchKey) || [];
    if (batch.length === 0) {
      return;
    }

    // Remove batch from map
    this.batchMap.delete(batchKey);

    // Start timer for batch processing
    const timer = this.metricsService.startTimer(
      batch[0]?.type || 'unknown',
      'batch_process',
    );

    try {
      this.logger.debug(
        `Processing batch ${batchKey} with ${batch.length} notifications`,
      );

      // Record batch size metric
      this.metricsService.recordBatchSize(batch.length);

      // Add batch to queue for processing
      await this.batchQueue.add(
        'process',
        { batchKey, notifications: batch },
        {
          attempts: this.config.maxRetries,
          backoff: { type: 'exponential', delay: this.config.retryDelayMs },
        },
      );

      this.metricsService.incrementCounter(
        batch[0]?.type || 'unknown',
        'batch_queued',
      );
    } catch (error) {
      this.logger.error(
        `Error processing batch ${batchKey}: ${error.message}`,
        error.stack,
      );
      this.metricsService.incrementCounter(
        batch[0]?.type || 'unknown',
        'batch_error',
      );

      // Fall back to individual processing if batch queue fails
      await this.processNotificationsIndividually(batch);
    } finally {
      timer.end();

      // Update queue length metric
      this.metricsService.setQueueLength(
        'batch',
        this.getTotalQueuedNotifications(),
      );
    }
  }

  /**
   * Process notifications from a batch individually
   * Used as fallback if batch processing fails
   * @param notifications Array of notifications to process
   */
  private async processNotificationsIndividually(
    notifications: NotificationCreateInput[],
  ): Promise<void> {
    this.logger.debug(
      `Processing ${notifications.length} notifications individually (fallback)`,
    );

    const processPromises = notifications.map(async (notification) => {
      try {
        await this.consumerService.upsertNotificationSerialByKey(notification);
        this.metricsService.incrementCounter(
          notification.type,
          'individual_success',
        );
        return true;
      } catch (error) {
        this.logger.error(
          `Error processing individual notification: ${error.message}`,
          error.stack,
        );
        this.metricsService.incrementCounter(
          notification.type,
          'individual_error',
        );
        return false;
      }
    });

    await Promise.all(processPromises);
  }

  /**
   * Set a timeout to process a batch if it doesn't reach max size
   * @param batchKey Key identifying the batch
   */
  private setBatchTimeout(batchKey: string): void {
    const timeout = setTimeout(async () => {
      this.logger.debug(`Batch ${batchKey} timeout reached, processing batch`);
      await this.processBatch(batchKey);
    }, this.config.batchTimeoutMs);

    // Store timeout reference for cancellation if needed
    this.batchTimers.set(batchKey, timeout);
  }

  /**
   * Get total number of notifications queued across all batches
   * @returns Total number of queued notifications
   */
  private getTotalQueuedNotifications(): number {
    let total = 0;
    for (const batch of this.batchMap.values()) {
      total += batch.length;
    }
    return total;
  }
}

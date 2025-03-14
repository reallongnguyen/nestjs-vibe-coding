import { Process, Processor } from '@nestjs/bull';
import { Logger } from 'nestjs-pino';
import { Job } from 'bull';

import { NotificationConsumerService } from '../services/notification-consumer.service';
import { NotificationMetricsService } from '../services/notification-metrics.service';
import { NotificationCreateInput } from './dtos/notification.dto';

interface BatchProcessJob {
  batchKey: string;
  notifications: NotificationCreateInput[];
}

/**
 * Processor for handling notification batches
 * Processes batches of notifications from the queue
 */
@Processor('notification-batch')
export class NotificationBatchProcessor {
  // Default concurrency limit for processing notifications
  private readonly DEFAULT_CONCURRENCY_LIMIT = 5;

  // Maximum number of retries for failed notifications
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly logger: Logger,
    private readonly consumerService: NotificationConsumerService,
    private readonly metricsService: NotificationMetricsService,
  ) {}

  /**
   * Process a batch of notifications
   * @param job Bull job containing batch data
   */
  @Process('process')
  async processBatch(job: Job<BatchProcessJob>): Promise<void> {
    const { batchKey, notifications } = job.data;
    const batchSize = notifications.length;
    const batchId = job.id.toString();

    this.logger.debug(
      `Processing notification batch ${batchKey} (ID: ${batchId}) with ${batchSize} notifications`,
    );

    // Start timer for batch processing
    const startTime = Date.now();
    const timer = this.metricsService.startTimer(
      notifications[0]?.type || 'unknown',
      'batch_process',
    );

    try {
      // Record batch size metric
      this.metricsService.recordBatchSize(batchSize);

      // Group notifications by type for better metrics
      const notificationsByType = this.groupNotificationsByType(notifications);

      // Log notification distribution by type
      Object.entries(notificationsByType).forEach(([type, count]) => {
        this.logger.debug(
          `Batch ${batchId} contains ${count} notifications of type ${type}`,
        );
      });

      // Process all notifications with throttling
      const results = await this.processAllNotifications(notifications);

      // Analyze results
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      // Group results by type and status for metrics
      const resultsByTypeAndStatus = this.groupResultsByTypeAndStatus(results);

      // Record metrics for each type
      Object.entries(resultsByTypeAndStatus).forEach(([type, statuses]) => {
        const { success, error } = statuses;
        if (success > 0) {
          this.metricsService.incrementCounter(type, 'success');
        }
        if (error > 0) {
          this.metricsService.incrementCounter(type, 'error');
        }
      });

      // Log detailed results
      this.logger.debug(
        `Batch ${batchKey} (ID: ${batchId}) processed: ${successCount}/${batchSize} succeeded, ${errorCount}/${batchSize} failed`,
      );

      // If there are failures, log more details
      if (errorCount > 0) {
        const failedTypes = results
          .filter((r) => !r.success)
          .map((r) => r.notification.type)
          .reduce(
            (acc, type) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

        this.logger.warn(
          `Batch ${batchId} had failures: ${Object.entries(failedTypes)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ')}`,
        );
      }

      // Calculate processing time and throughput
      const processingTimeMs = Date.now() - startTime;
      this.metricsService.recordDbQueryDuration(
        'batch_process',
        processingTimeMs,
      );

      // Calculate and log throughput
      const throughput = batchSize / (processingTimeMs / 1000);
      this.logger.debug(
        `Batch ${batchId} throughput: ${throughput.toFixed(2)} notifications/second`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing batch ${batchKey} (ID: ${batchId}): ${error.message}`,
        error.stack,
      );

      // Record batch error
      this.metricsService.incrementCounter('batch', 'process_error');

      // Rethrow to trigger Bull retry mechanism
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Group notifications by type for metrics
   * @param notifications Array of notifications
   * @returns Record of counts by type
   */
  private groupNotificationsByType(
    notifications: NotificationCreateInput[],
  ): Record<string, number> {
    return notifications.reduce(
      (acc, { type }) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Group results by type and status for metrics
   * @param results Array of processing results
   * @returns Record of counts by type and status
   */
  private groupResultsByTypeAndStatus(
    results: Array<{ notification: NotificationCreateInput; success: boolean }>,
  ): Record<string, { success: number; error: number }> {
    return results.reduce(
      (acc, { notification, success }) => {
        const { type } = notification;

        if (!acc[type]) {
          acc[type] = { success: 0, error: 0 };
        }

        if (success) {
          acc[type].success += 1;
        } else {
          acc[type].error += 1;
        }

        return acc;
      },
      {} as Record<string, { success: number; error: number }>,
    );
  }

  /**
   * Process all notifications with throttling to prevent too many concurrent operations
   * @param notifications Array of notifications to process
   * @returns Array of processing results
   */
  private async processAllNotifications(
    notifications: NotificationCreateInput[],
  ): Promise<
    Array<{ notification: NotificationCreateInput; success: boolean }>
  > {
    // Create a throttled version of processNotification with adaptive concurrency
    const concurrencyLimit = this.calculateOptimalConcurrency(
      notifications.length,
    );
    const throttle = this.createThrottle(concurrencyLimit);

    this.logger.debug(
      `Processing batch with concurrency limit of ${concurrencyLimit}`,
    );

    // Process all notifications with throttling
    const promises = notifications.map((notification) =>
      throttle(() => this.processNotification(notification)).then(
        (success) => ({ notification, success: success as boolean }),
      ),
    );

    return Promise.all(promises);
  }

  /**
   * Calculate optimal concurrency based on batch size and system load
   * @param batchSize Size of the batch
   * @returns Optimal concurrency limit
   */
  private calculateOptimalConcurrency(batchSize: number): number {
    // Simple adaptive concurrency based on batch size
    // For larger batches, increase concurrency to improve throughput
    if (batchSize <= 10) {
      return 3; // Small batches
    }

    if (batchSize <= 50) {
      return 5; // Medium batches
    }

    if (batchSize <= 100) {
      return 8; // Large batches
    }

    return 10; // Very large batches

    // TODO: In the future, this could be enhanced to consider:
    // - Current system load
    // - Historical performance data
    // - Time of day patterns
  }

  /**
   * Create a throttle function that limits concurrent operations
   * @param limit Maximum number of concurrent operations
   * @returns Throttled function
   */
  private createThrottle<T>(
    limit: number,
  ): (fn: () => Promise<T>) => Promise<T> {
    const queue: Array<{
      fn: () => Promise<T>;
      resolve: (value: T) => void;
      reject: (error: Error) => void;
    }> = [];
    let activeCount = 0;

    const processQueue = () => {
      if (queue.length === 0) return;
      if (activeCount >= limit) return;

      // Get the next item from the queue
      const item = queue.shift();
      activeCount += 1;

      // Execute the function
      item
        .fn()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          activeCount -= 1;
          processQueue();
        });
    };

    return (fn) =>
      new Promise<T>((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        processQueue();
      });
  }

  /**
   * Process a single notification with retry logic
   * @param notification Notification to process
   * @returns True if successful, false otherwise
   */
  private async processNotification(
    notification: NotificationCreateInput,
  ): Promise<boolean> {
    // Start timer for individual notification processing
    const timer = this.metricsService.startTimer(
      notification.type,
      'notification_process',
    );

    // Use retry pattern without await in loop
    return this.retryOperation(
      async () =>
        this.consumerService.upsertNotificationSerialByKey(notification),
      this.MAX_RETRIES,
      notification.type,
      timer,
    );
  }

  /**
   * Retry an operation with exponential backoff
   * @param operation Function to retry
   * @param maxRetries Maximum number of retries
   * @param notificationType Type of notification for metrics
   * @param timer Timer for measuring duration
   * @returns True if successful, false otherwise
   */
  private async retryOperation(
    operation: () => Promise<void>,
    maxRetries: number,
    notificationType: string,
    timer: any,
  ): Promise<boolean> {
    let attempt = 0;

    // Use a non-loop approach to avoid linter issues
    const attemptOperation = async (): Promise<boolean> => {
      if (attempt > maxRetries) {
        // Max retries exceeded
        timer.end();
        return false;
      }

      try {
        await operation();

        // Record success metric
        if (attempt > 0) {
          this.metricsService.incrementCounter(
            notificationType,
            'retry_success',
          );
        } else {
          this.metricsService.incrementCounter(notificationType, 'success');
        }

        timer.end();
        return true;
      } catch (error) {
        if (attempt < maxRetries) {
          this.logger.warn(
            `Retrying notification processing (attempt ${attempt + 1}/${maxRetries}): ${error.message}`,
          );

          // Exponential backoff for retries
          const backoffMs = 100 * 2 ** attempt;

          // Increment attempt before next try
          attempt += 1;

          // Wait and then retry
          await this.delay(backoffMs);
          return attemptOperation();
        }

        this.logger.error(
          `Error processing notification after ${maxRetries} retries: ${error.message}`,
          error.stack,
        );

        // Record error metric
        this.metricsService.incrementCounter(notificationType, 'error');

        timer.end();
        return false;
      }
    };

    return attemptOperation();
  }

  /**
   * Delay execution for a specified time
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { MetricsService } from 'src/common/monitoring';

/**
 * Timer interface for tracking metric durations
 */
export interface Timer {
  end(): void;
  getElapsedMs?(): number;
}

/**
 * Service for tracking notification metrics with Prometheus
 * Provides standardized metrics for the notification pipeline stages
 */
@Injectable()
export class NotificationMetricsService implements OnModuleInit {
  // Store start times for calculating elapsed time
  private readonly timers: Map<string, number> = new Map();

  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: Logger,
  ) {
    // Logger context is set automatically by NestJS
  }

  /**
   * Initialize metrics on module initialization
   */
  async onModuleInit(): Promise<void> {
    this.logger.debug('Registering notification metrics with Prometheus');

    // Register histogram for timing measurements
    this.metricsService.registerHistogram({
      name: 'notification_processing_duration',
      help: 'Notification processing duration in seconds',
      labelNames: ['type', 'stage'], // producer, consumer, delivery
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Register counter for event counts
    this.metricsService.registerCounter({
      name: 'notification_processed',
      help: 'Total notifications processed',
      labelNames: ['type', 'status'], // success, error
    });

    // Register gauge for queue lengths
    this.metricsService.registerGauge({
      name: 'notification_queue_length',
      help: 'Current notification queue length',
      labelNames: ['queue'], // producer, consumer, delivery
    });

    // Register counter for delivery attempts
    this.metricsService.registerCounter({
      name: 'notification_delivery_attempts',
      help: 'Total notification delivery attempts',
      labelNames: ['channel', 'status'], // in_app, email, push, mqtt
    });

    // Register histogram for batch sizes
    this.metricsService.registerHistogram({
      name: 'notification_batch_size',
      help: 'Size of notification batches',
      labelNames: ['type'],
      buckets: [1, 5, 10, 20, 50, 100],
    });

    // Register counter for rate limiting
    this.metricsService.registerCounter({
      name: 'notification_rate_limited',
      help: 'Total notifications rate limited',
      labelNames: ['type', 'user_id'],
    });

    // Register histogram for database query performance
    this.metricsService.registerHistogram({
      name: 'notification_db_query_duration',
      help: 'Database query duration in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    });

    // Register counter for notification retries
    this.metricsService.registerCounter({
      name: 'notification_retries',
      help: 'Total notification retry attempts',
      labelNames: ['type', 'status'], // success, error
    });

    // Register histogram for batch processing time
    this.metricsService.registerHistogram({
      name: 'notification_batch_processing_duration',
      help: 'Batch processing duration in seconds',
      labelNames: ['size_range'], // small, medium, large
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    // Register counter for notification throughput
    this.metricsService.registerCounter({
      name: 'notification_throughput',
      help: 'Notification processing throughput',
      labelNames: ['type', 'stage'], // producer, consumer, delivery
    });

    // Register gauge for rate limit status
    this.metricsService.registerGauge({
      name: 'notification_rate_limit_remaining',
      help: 'Remaining rate limit capacity',
      labelNames: ['user_id', 'type', 'window'], // minute, hour, day
    });

    // Register histogram for template rendering time
    this.metricsService.registerHistogram({
      name: 'notification_template_render_duration',
      help: 'Template rendering duration in seconds',
      labelNames: ['template_id', 'template_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    });

    // Register counter for notification preferences
    this.metricsService.registerCounter({
      name: 'notification_preference_updates',
      help: 'Notification preference updates',
      labelNames: ['type', 'action'], // create, update, disable
    });

    this.logger.debug('Notification metrics registered successfully');
  }

  /**
   * Start a timer for measuring operation duration
   * @param type Notification type (like, comment, follow)
   * @param stage Pipeline stage (producer, consumer, delivery)
   * @returns Timer object with end() method
   */
  startTimer(type: string, stage: string): Timer {
    const histogram = this.metricsService.getMetric(
      'notification_processing_duration',
    ) as any;

    if (!histogram) {
      this.logger.warn(
        'Histogram metric not found: notification_processing_duration',
      );
      return { end: () => {} };
    }

    const timerId = `${type}:${stage}:${Date.now()}:${Math.random()}`;
    const startTime = Date.now();
    this.timers.set(timerId, startTime);

    return {
      end: () => {
        const [seconds, nanoseconds] = process.hrtime();
        const duration = seconds + nanoseconds / 1e9;
        histogram.observe({ type, stage }, duration);
        this.timers.delete(timerId);
      },
      getElapsedMs: () => {
        const start = this.timers.get(timerId);
        if (!start) return 0;
        return Date.now() - start;
      },
    };
  }

  /**
   * Increment counter for notification processing
   * @param type Notification type (like, comment, follow)
   * @param status Processing status (success, error)
   * @param count Number to increment by (default: 1)
   */
  incrementCounter(type: string, status: string, count: number = 1): void {
    const counter = this.metricsService.getMetric(
      'notification_processed',
    ) as any;

    if (!counter) {
      this.logger.warn('Counter metric not found: notification_processed');
      return;
    }

    counter.inc({ type, status }, count);
  }

  /**
   * Set gauge for queue length
   * @param queue Queue name (producer, consumer, delivery)
   * @param length Current queue length
   */
  setQueueLength(queue: string, length: number): void {
    const gauge = this.metricsService.getMetric(
      'notification_queue_length',
    ) as any;

    if (!gauge) {
      this.logger.warn('Gauge metric not found: notification_queue_length');
      return;
    }

    gauge.set({ queue }, length);
  }

  /**
   * Increment counter for delivery attempts
   * @param channel Delivery channel (in_app, email, push, mqtt)
   * @param status Delivery status (success, error)
   * @param count Number to increment by (default: 1)
   */
  incrementDeliveryCounter(
    channel: string,
    status: string,
    count: number = 1,
  ): void {
    const counter = this.metricsService.getMetric(
      'notification_delivery_attempts',
    ) as any;

    if (!counter) {
      this.logger.warn(
        'Counter metric not found: notification_delivery_attempts',
      );
      return;
    }

    counter.inc({ channel, status }, count);
  }

  /**
   * Record batch size for notifications
   * @param size Batch size
   * @param type Notification type (optional)
   */
  recordBatchSize(size: number, type: string = 'all'): void {
    const histogram = this.metricsService.getMetric(
      'notification_batch_size',
    ) as any;

    if (!histogram) {
      this.logger.warn('Histogram metric not found: notification_batch_size');
      return;
    }

    histogram.observe({ type }, size);

    // Also record batch processing duration by size range
    const batchHistogram = this.metricsService.getMetric(
      'notification_batch_processing_duration',
    ) as any;

    if (batchHistogram) {
      let sizeRange = 'small';
      if (size > 50) {
        sizeRange = 'large';
      } else if (size > 10) {
        sizeRange = 'medium';
      }

      // Start a timer for this batch size
      const timer = this.startTimer(type, `batch_${sizeRange}`);

      // Schedule the timer to end after processing (approximate)
      // This is a rough estimate and should be replaced with actual measurements
      setTimeout(() => timer.end(), 100 + size * 10);
    }
  }

  /**
   * Record rate limited notification
   * @param type Notification type
   * @param userId User ID (optional)
   */
  recordRateLimited(type: string, userId: string = 'unknown'): void {
    const counter = this.metricsService.getMetric(
      'notification_rate_limited',
    ) as any;

    if (!counter) {
      this.logger.warn('Counter metric not found: notification_rate_limited');
      return;
    }

    counter.inc({ type, user_id: userId });
  }

  /**
   * Record database query duration
   * @param operation Database operation name
   * @param durationMs Duration in milliseconds
   */
  recordDbQueryDuration(operation: string, durationMs: number): void {
    const histogram = this.metricsService.getMetric(
      'notification_db_query_duration',
    ) as any;

    if (!histogram) {
      this.logger.warn(
        'Histogram metric not found: notification_db_query_duration',
      );
      return;
    }

    histogram.observe({ operation }, durationMs / 1000); // Convert to seconds
  }

  /**
   * Record notification retry
   * @param type Notification type
   * @param status Retry status (success, error)
   */
  recordRetry(type: string, status: string): void {
    const counter = this.metricsService.getMetric(
      'notification_retries',
    ) as any;

    if (!counter) {
      this.logger.warn('Counter metric not found: notification_retries');
      return;
    }

    counter.inc({ type, status });
  }

  /**
   * Record notification throughput
   * @param type Notification type
   * @param stage Pipeline stage
   * @param count Number of notifications processed
   */
  recordThroughput(type: string, stage: string, count: number): void {
    const counter = this.metricsService.getMetric(
      'notification_throughput',
    ) as any;

    if (!counter) {
      this.logger.warn('Counter metric not found: notification_throughput');
      return;
    }

    counter.inc({ type, stage }, count);
  }

  /**
   * Update rate limit remaining gauge
   * @param userId User ID
   * @param type Notification type
   * @param window Time window (minute, hour, day)
   * @param remaining Remaining capacity
   */
  updateRateLimitRemaining(
    userId: string,
    type: string,
    window: 'minute' | 'hour' | 'day',
    remaining: number,
  ): void {
    const gauge = this.metricsService.getMetric(
      'notification_rate_limit_remaining',
    ) as any;

    if (!gauge) {
      this.logger.warn(
        'Gauge metric not found: notification_rate_limit_remaining',
      );
      return;
    }

    gauge.set({ user_id: userId, type, window }, remaining);
  }

  /**
   * Record template rendering duration
   * @param templateId Template ID
   * @param templateType Template type
   * @param durationMs Duration in milliseconds
   */
  recordTemplateRenderDuration(
    templateId: string,
    templateType: string,
    durationMs: number,
  ): void {
    const histogram = this.metricsService.getMetric(
      'notification_template_render_duration',
    ) as any;

    if (!histogram) {
      this.logger.warn(
        'Histogram metric not found: notification_template_render_duration',
      );
      return;
    }

    histogram.observe(
      { template_id: templateId, template_type: templateType },
      durationMs / 1000,
    );
  }

  /**
   * Record notification preference update
   * @param type Notification type
   * @param action Update action (create, update, disable)
   */
  recordPreferenceUpdate(
    type: string,
    action: 'create' | 'update' | 'disable',
  ): void {
    const counter = this.metricsService.getMetric(
      'notification_preference_updates',
    ) as any;

    if (!counter) {
      this.logger.warn(
        'Counter metric not found: notification_preference_updates',
      );
      return;
    }

    counter.inc({ type, action });
  }
}

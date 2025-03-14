import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { MetricsService } from 'src/common/monitoring/metrics.service';

/**
 * Timer interface for tracking metric durations
 */
export interface Timer {
  end(): void;
}

/**
 * Service for tracking notification metrics with Prometheus
 * Provides standardized metrics for the notification pipeline stages
 */
@Injectable()
export class NotificationMetricsService implements OnModuleInit {
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

    const startTime = process.hrtime();

    return {
      end: () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9;
        histogram.observe({ type, stage }, duration);
      },
    };
  }

  /**
   * Increment counter for notification processing
   * @param type Notification type (like, comment, follow)
   * @param status Processing status (success, error)
   */
  incrementCounter(type: string, status: string): void {
    const counter = this.metricsService.getMetric(
      'notification_processed',
    ) as any;
    if (!counter) {
      this.logger.warn('Counter metric not found: notification_processed');
      return;
    }

    counter.inc({ type, status });
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
   */
  incrementDeliveryCounter(channel: string, status: string): void {
    const counter = this.metricsService.getMetric(
      'notification_delivery_attempts',
    ) as any;
    if (!counter) {
      this.logger.warn(
        'Counter metric not found: notification_delivery_attempts',
      );
      return;
    }

    counter.inc({ channel, status });
  }
}

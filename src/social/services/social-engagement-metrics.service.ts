import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { MetricsService } from 'src/common/monitoring/metrics.service';

@Injectable()
export class SocialEngagementMetricsService {
  private readonly likeOperations: Counter<string>;
  private readonly likeOperationDuration: Histogram<string>;
  private readonly viewOperations: Counter<string>;
  private readonly viewOperationDuration: Histogram<string>;
  private readonly batchProcessing: Counter<string>;
  private readonly batchProcessingDuration: Histogram<string>;

  constructor(private readonly metricsService: MetricsService) {
    this.likeOperations = this.metricsService.registerCounter({
      name: 'social_like_operations_total',
      help: 'Total number of like operations',
      labelNames: ['type', 'operation', 'status'],
    });

    this.likeOperationDuration = this.metricsService.registerHistogram({
      name: 'social_like_operation_duration_seconds',
      help: 'Duration of like operations in seconds',
      labelNames: ['type', 'operation'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.viewOperations = this.metricsService.registerCounter({
      name: 'social_view_operations_total',
      help: 'Total number of view operations',
      labelNames: ['type', 'status'],
    });

    this.viewOperationDuration = this.metricsService.registerHistogram({
      name: 'social_view_operation_duration_seconds',
      help: 'Duration of view operations in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.batchProcessing = this.metricsService.registerCounter({
      name: 'social_batch_processing_total',
      help: 'Total number of batch processing operations',
      labelNames: ['type', 'status', 'size'],
    });

    this.batchProcessingDuration = this.metricsService.registerHistogram({
      name: 'social_batch_processing_duration_seconds',
      help: 'Duration of batch processing operations in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
  }

  /**
   * Track like operation
   * @param type Content type
   * @param operation Operation type
   * @param status Operation status
   */
  trackLikeOperation(
    type: string,
    operation: 'like' | 'unlike',
    status: 'success' | 'error',
  ): void {
    this.likeOperations.inc({ type, operation, status });
  }

  /**
   * Track like operation duration
   * @param type Content type
   * @param operation Operation type
   * @param durationMs Duration in milliseconds
   */
  trackLikeOperationDuration(
    type: string,
    operation: 'like' | 'unlike',
    durationMs: number,
  ): void {
    this.likeOperationDuration.observe({ type, operation }, durationMs / 1000);
  }

  /**
   * Track view operation
   * @param type Content type
   * @param status Operation status
   */
  trackViewOperation(type: string, status: 'success' | 'error'): void {
    this.viewOperations.inc({ type, status });
  }

  /**
   * Track view operation duration
   * @param type Content type
   * @param durationMs Duration in milliseconds
   */
  trackViewOperationDuration(type: string, durationMs: number): void {
    this.viewOperationDuration.observe({ type }, durationMs / 1000);
  }

  /**
   * Track batch processing
   * @param type Content type
   * @param status Operation status
   * @param size Batch size
   */
  trackBatchProcessing(
    type: string,
    status: 'success' | 'error',
    size: number,
  ): void {
    this.batchProcessing.inc({ type, status, size: size.toString() });
  }

  /**
   * Track batch processing duration
   * @param type Content type
   * @param durationMs Duration in milliseconds
   */
  trackBatchProcessingDuration(type: string, durationMs: number): void {
    this.batchProcessingDuration.observe({ type }, durationMs / 1000);
  }
}

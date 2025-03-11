import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { MetricsService } from 'src/common/monitoring';

@Injectable()
export class SocialEngagementMetricsService {
  private readonly metrics = {
    likeOperations: new Counter({
      name: 'social_like_operations_total',
      help: 'Total number of like operations',
      labelNames: ['type', 'operation', 'status'] as const,
    }),
    likeOperationDuration: new Histogram({
      name: 'social_like_operation_duration_seconds',
      help: 'Duration of like operations',
      labelNames: ['type', 'operation'] as const,
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    }),
    viewOperations: new Counter({
      name: 'social_view_operations_total',
      help: 'Total number of view operations',
      labelNames: ['type', 'status'] as const,
    }),
    viewOperationDuration: new Histogram({
      name: 'social_view_operation_duration_seconds',
      help: 'Duration of view operations',
      labelNames: ['type'] as const,
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    }),
    redisErrors: new Counter({
      name: 'social_redis_errors_total',
      help: 'Total number of Redis errors',
      labelNames: ['operation', 'error_type'] as const,
    }),
  };

  constructor(private readonly metricsService: MetricsService) {
    this.registerMetrics();
  }

  private registerMetrics(): void {
    Object.values(this.metrics).forEach((metric) => {
      this.metricsService.registerMetric(metric);
    });
  }

  trackLikeOperation(
    type: string,
    operation: 'like' | 'unlike',
    status: 'success' | 'error',
  ): void {
    this.metrics.likeOperations.inc({ type, operation, status });
  }

  trackLikeOperationDuration(
    type: string,
    operation: 'like' | 'unlike',
    durationMs: number,
  ): void {
    this.metrics.likeOperationDuration.observe(
      { type, operation },
      durationMs / 1000,
    );
  }

  trackViewOperation(type: string, status: 'success' | 'error'): void {
    this.metrics.viewOperations.inc({ type, status });
  }

  trackViewOperationDuration(type: string, durationMs: number): void {
    this.metrics.viewOperationDuration.observe({ type }, durationMs / 1000);
  }

  trackRedisError(operation: string, errorType: string): void {
    this.metrics.redisErrors.inc({ operation, error_type: errorType });
  }
}

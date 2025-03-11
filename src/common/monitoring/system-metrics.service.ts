import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gauge } from 'prom-client';
import { MetricsService } from './metrics.service';

@Injectable()
export class SystemMetricsService implements OnModuleInit {
  private readonly processMetrics: {
    heapUsed: Gauge<string>;
    heapTotal: Gauge<string>;
    rss: Gauge<string>;
    eventLoopLag: Gauge<string>;
    activeHandles: Gauge<string>;
    activeRequests: Gauge<string>;
  };

  constructor(private readonly metricsService: MetricsService) {
    this.processMetrics = {
      heapUsed: this.metricsService.registerGauge({
        name: 'nodejs_heap_used_bytes',
        help: 'Node.js heap used in bytes',
        labelNames: ['app'],
      }),
      heapTotal: this.metricsService.registerGauge({
        name: 'nodejs_heap_total_bytes',
        help: 'Node.js heap total in bytes',
        labelNames: ['app'],
      }),
      rss: this.metricsService.registerGauge({
        name: 'nodejs_rss_bytes',
        help: 'Node.js RSS memory usage in bytes',
        labelNames: ['app'],
      }),
      eventLoopLag: this.metricsService.registerGauge({
        name: 'nodejs_eventloop_lag_seconds',
        help: 'Node.js event loop lag in seconds',
        labelNames: ['app'],
      }),
      activeHandles: this.metricsService.registerGauge({
        name: 'nodejs_active_handles',
        help: 'Number of active handles',
        labelNames: ['app'],
      }),
      activeRequests: this.metricsService.registerGauge({
        name: 'nodejs_active_requests',
        help: 'Number of active requests',
        labelNames: ['app'],
      }),
    };
  }

  onModuleInit() {
    // Start collecting metrics
    this.startCollectingMetrics();
  }

  private startCollectingMetrics(): void {
    // Collect metrics every 5 seconds
    setInterval(() => {
      this.collectProcessMetrics();
    }, 5000);
  }

  private collectProcessMetrics(): void {
    const labels = { app: 'social-service' };
    const memoryUsage = process.memoryUsage();

    // Update memory metrics
    this.processMetrics.heapUsed.set(labels, memoryUsage.heapUsed);
    this.processMetrics.heapTotal.set(labels, memoryUsage.heapTotal);
    this.processMetrics.rss.set(labels, memoryUsage.rss);

    // Update event loop lag
    this.measureEventLoopLag().then((lag) => {
      this.processMetrics.eventLoopLag.set(labels, lag);
    });

    // Update active handles and requests
    // Note: These are internal Node.js metrics and might not be available in all environments
    this.processMetrics.activeHandles.set(labels, 0);
    this.processMetrics.activeRequests.set(labels, 0);
  }

  private async measureEventLoopLag(): Promise<number> {
    const start = process.hrtime();

    return new Promise<number>((resolve) => {
      setImmediate(() => {
        const [seconds, nanoseconds] = process.hrtime(start);
        resolve(seconds + nanoseconds / 1e9);
      });
    });
  }
}

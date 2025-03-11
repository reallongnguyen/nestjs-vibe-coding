import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  constructor() {
    this.registry = new Registry();
  }

  onModuleInit() {
    // Clear default metrics and register custom ones
    this.registry.clear();
    this.registerDefaultMetrics();
  }

  private registerDefaultMetrics(): void {
    // Register Node.js specific metrics
    this.registry.setDefaultLabels({
      app: 'social-service',
      env: process.env.NODE_ENV || 'development',
    });
  }

  registerMetric(metric: Counter | Histogram | Gauge): void {
    this.registry.registerMetric(metric);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

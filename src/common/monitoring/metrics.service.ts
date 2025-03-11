import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, Metric } from 'prom-client';

interface CounterConfig {
  name: string;
  help: string;
  labelNames: string[];
}

interface HistogramConfig {
  name: string;
  help: string;
  labelNames: string[];
  buckets: number[];
}

interface GaugeConfig {
  name: string;
  help: string;
  labelNames: string[];
}

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly metrics: Map<string, Metric>;

  constructor() {
    this.registry = new Registry();
    this.metrics = new Map();
  }

  /**
   * Register a counter metric
   * @param config Counter configuration
   * @returns Counter instance
   */
  registerCounter<T extends string>(config: CounterConfig): Counter<T> {
    const counter = new Counter({
      ...config,
      registers: [this.registry],
    });
    this.metrics.set(config.name, counter);
    return counter;
  }

  /**
   * Register a histogram metric
   * @param config Histogram configuration
   * @returns Histogram instance
   */
  registerHistogram<T extends string>(config: HistogramConfig): Histogram<T> {
    const histogram = new Histogram({
      ...config,
      registers: [this.registry],
    });
    this.metrics.set(config.name, histogram);
    return histogram;
  }

  /**
   * Register a gauge metric
   * @param config Gauge configuration
   * @returns Gauge instance
   */
  registerGauge<T extends string>(config: GaugeConfig): Gauge<T> {
    const gauge = new Gauge({
      ...config,
      registers: [this.registry],
    });
    this.metrics.set(config.name, gauge);
    return gauge;
  }

  /**
   * Get all registered metrics
   * @returns Array of metrics
   */
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metric by name
   * @param name Metric name
   * @returns Metric instance or undefined
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get metrics registry
   * @returns Registry instance
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

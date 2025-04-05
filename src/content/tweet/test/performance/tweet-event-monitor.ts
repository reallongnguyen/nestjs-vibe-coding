import { Injectable, Logger } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';

interface EventMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  retryAttempts: number;
  totalLatency: number;
  maxLatency: number;
  minLatency: number;
}

@Injectable()
export class TweetEventMonitor {
  private readonly logger = new Logger(TweetEventMonitor.name);
  private metrics: EventMetrics = {
    totalEvents: 0,
    successfulEvents: 0,
    failedEvents: 0,
    retryAttempts: 0,
    totalLatency: 0,
    maxLatency: 0,
    minLatency: Number.MAX_VALUE,
  };

  private eventStartTimes = new Map<string, number>();

  constructor(private readonly eventBus: EventBus) {
    this.setupEventMonitoring();
  }

  private setupEventMonitoring() {
    // Intercept event publishing
    const originalPublish = this.eventBus.publish.bind(this.eventBus);
    this.eventBus.publish = async (event: IEvent) => {
      const eventId = this.getEventId(event);
      this.eventStartTimes.set(eventId, Date.now());
      this.metrics.totalEvents += 1;

      try {
        await originalPublish(event);
        this.recordSuccess(eventId);
      } catch (error) {
        this.metrics.failedEvents += 1;
        this.metrics.retryAttempts += 1;
        throw error;
      }
    };
  }

  private getEventId(event: IEvent): string {
    return `${event.constructor.name}-${Date.now()}-${Math.random()}`;
  }

  private recordSuccess(eventId: string) {
    const startTime = this.eventStartTimes.get(eventId);
    if (startTime) {
      const latency = Date.now() - startTime;
      this.metrics.successfulEvents += 1;
      this.metrics.totalLatency += latency;
      this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
      this.metrics.minLatency = Math.min(this.metrics.minLatency, latency);
      this.eventStartTimes.delete(eventId);
    }
  }

  getMetrics(): EventMetrics & {
    averageLatency: number;
    successRate: number;
    retryRate: number;
  } {
    return {
      ...this.metrics,
      averageLatency:
        this.metrics.successfulEvents > 0
          ? this.metrics.totalLatency / this.metrics.successfulEvents
          : 0,
      successRate:
        this.metrics.totalEvents > 0
          ? (this.metrics.successfulEvents / this.metrics.totalEvents) * 100
          : 0,
      retryRate:
        this.metrics.totalEvents > 0
          ? (this.metrics.retryAttempts / this.metrics.totalEvents) * 100
          : 0,
    };
  }

  reset() {
    this.metrics = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      retryAttempts: 0,
      totalLatency: 0,
      maxLatency: 0,
      minLatency: Number.MAX_VALUE,
    };
    this.eventStartTimes.clear();
  }

  logMetrics() {
    const metrics = this.getMetrics();
    this.logger.log('Event Publishing Metrics:');
    this.logger.log(`Total Events: ${metrics.totalEvents}`);
    this.logger.log(`Successful Events: ${metrics.successfulEvents}`);
    this.logger.log(`Failed Events: ${metrics.failedEvents}`);
    this.logger.log(`Retry Attempts: ${metrics.retryAttempts}`);
    this.logger.log(`Average Latency: ${metrics.averageLatency.toFixed(2)}ms`);
    this.logger.log(`Max Latency: ${metrics.maxLatency}ms`);
    this.logger.log(`Min Latency: ${metrics.minLatency}ms`);
    this.logger.log(`Success Rate: ${metrics.successRate.toFixed(2)}%`);
    this.logger.log(`Retry Rate: ${metrics.retryRate.toFixed(2)}%`);
  }
}

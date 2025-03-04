import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  NotificationMetricsDto,
  TimeWindowMetricsDto,
} from '../presentation/dtos/metrics.dto';
import {
  NotificationDeliveryAttemptEvent,
  NotificationDeliverySuccessEvent,
  NotificationDeliveryFailureEvent,
} from '../entities/events';
import { NotificationChannel } from '../entities/notification-preference.entity';

/**
 * Service for monitoring notification delivery metrics
 * Uses Redis for distributed metrics storage to support scaling
 */
@Injectable()
export class NotificationMonitoringService {
  private readonly redis: Redis;

  // Redis key prefixes
  private readonly METRICS_PREFIX = 'notification:metrics:';
  private readonly ATTEMPTS_KEY = `${this.METRICS_PREFIX}attempts`;
  private readonly SUCCESSES_KEY = `${this.METRICS_PREFIX}successes`;
  private readonly FAILURES_KEY = `${this.METRICS_PREFIX}failures`;
  private readonly LATENCIES_KEY = `${this.METRICS_PREFIX}latencies`;
  private readonly TIMESTAMPS_KEY = `${this.METRICS_PREFIX}timestamps`;
  private readonly CHANNEL_METRICS_PREFIX = `${this.METRICS_PREFIX}channel:`;

  // Time window for metrics (last hour)
  private readonly metricsWindow = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {
    // Schedule periodic cleanup of old metrics
    setInterval(() => this.cleanupOldMetrics(), this.metricsWindow / 4);
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Reset channel metrics
   */
  private async resetChannelMetrics(): Promise<void> {
    const channels = ['in_app', 'email', 'push', 'mqtt'];
    const deletePromises = [];

    for (const channel of channels) {
      deletePromises.push(
        this.redis.del(`${this.CHANNEL_METRICS_PREFIX}${channel}:attempts`),
      );
      deletePromises.push(
        this.redis.del(`${this.CHANNEL_METRICS_PREFIX}${channel}:successes`),
      );
      deletePromises.push(
        this.redis.del(`${this.CHANNEL_METRICS_PREFIX}${channel}:failures`),
      );
    }

    await Promise.all(deletePromises);
  }

  /**
   * Clean up metrics older than the metrics window
   */
  private async cleanupOldMetrics(): Promise<void> {
    const now = Date.now();
    const cutoff = now - this.metricsWindow;

    // Remove old timestamps
    const count = await this.redis.zremrangebyscore(
      this.TIMESTAMPS_KEY,
      0,
      cutoff,
    );

    if (count > 0) {
      this.logger.debug(
        `notification: monitoring: cleaned up ${count} old metrics`,
      );
    }
  }

  /**
   * Track a delivery attempt
   *
   * @param event The delivery attempt event
   */
  @OnEvent(NotificationDeliveryAttemptEvent.EVENT_NAME)
  async trackDeliveryAttempt(
    event: NotificationDeliveryAttemptEvent,
  ): Promise<void> {
    try {
      const timestamp = event.timestamp || Date.now();
      await this.redis.hincrby(this.ATTEMPTS_KEY, event.channel, 1);
      await this.redis.hincrby(
        `${this.CHANNEL_METRICS_PREFIX}${event.channel}:attempts`,
        'count',
        1,
      );
      await this.redis.zadd(
        this.TIMESTAMPS_KEY,
        timestamp,
        `attempt:${event.channel}:${timestamp}`,
      );

      this.logger.debug(
        `notification: monitoring: tracked delivery attempt for ${event.notificationId} to user ${event.userId} via ${event.channel}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track delivery attempt: ${error.message}`);
    }
  }

  /**
   * Track a successful delivery
   *
   * @param event The delivery success event
   */
  @OnEvent(NotificationDeliverySuccessEvent.EVENT_NAME)
  async trackDeliverySuccess(
    event: NotificationDeliverySuccessEvent,
  ): Promise<void> {
    try {
      const timestamp = event.timestamp || Date.now();
      await this.redis.hincrby(this.SUCCESSES_KEY, event.channel, 1);
      await this.redis.hincrby(
        `${this.CHANNEL_METRICS_PREFIX}${event.channel}:successes`,
        'count',
        1,
      );
      await this.redis.zadd(
        this.LATENCIES_KEY,
        timestamp,
        `${event.channel}:${event.latencyMs}:${timestamp}`,
      );
      await this.redis.zadd(
        this.TIMESTAMPS_KEY,
        timestamp,
        `success:${event.channel}:${timestamp}`,
      );

      this.logger.debug(
        `notification: monitoring: tracked delivery success for ${event.notificationId} to user ${event.userId} via ${event.channel} in ${event.latencyMs}ms`,
      );
    } catch (error) {
      this.logger.error(`Failed to track delivery success: ${error.message}`);
    }
  }

  /**
   * Track a failed delivery
   *
   * @param event The delivery failure event
   */
  @OnEvent(NotificationDeliveryFailureEvent.EVENT_NAME)
  async trackDeliveryFailure(
    event: NotificationDeliveryFailureEvent,
  ): Promise<void> {
    try {
      const timestamp = event.timestamp || Date.now();
      await this.redis.hincrby(this.FAILURES_KEY, event.channel, 1);
      await this.redis.hincrby(
        `${this.CHANNEL_METRICS_PREFIX}${event.channel}:failures`,
        'count',
        1,
      );
      await this.redis.zadd(
        this.TIMESTAMPS_KEY,
        timestamp,
        `failure:${event.channel}:${timestamp}`,
      );

      this.logger.warn(
        `notification: monitoring: tracked delivery failure for ${event.notificationId} to user ${event.userId} via ${event.channel}: ${event.error.message}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track delivery failure: ${error.message}`);
    }
  }

  /**
   * Gets all channels that have metrics
   * @returns Array of channel names
   */
  private async getChannels(): Promise<string[]> {
    try {
      // Get all keys matching the channel metrics pattern
      const keys = await this.redis.keys(`${this.CHANNEL_METRICS_PREFIX}*`);

      // Extract channel names from keys
      const channelSet = new Set<string>();
      for (const key of keys) {
        const match = RegExp(`${this.CHANNEL_METRICS_PREFIX}([^:]+):`).exec(
          key,
        );

        if (match && match[1]) {
          channelSet.add(match[1]);
        }
      }

      return Array.from(channelSet);
    } catch (error) {
      this.logger.error(`Failed to get channels: ${error.message}`);
      return Object.values(NotificationChannel);
    }
  }

  /**
   * Gets metrics for a specific channel
   * @param channel The channel name
   * @returns Channel metrics
   */
  private async getChannelMetrics(channel: string): Promise<{
    attempts: number;
    successes: number;
    failures: number;
    successRate: string;
  }> {
    try {
      const attemptsStr = await this.redis.hget(this.ATTEMPTS_KEY, channel);
      const successesStr = await this.redis.hget(this.SUCCESSES_KEY, channel);
      const failuresStr = await this.redis.hget(this.FAILURES_KEY, channel);

      const attempts = parseInt(attemptsStr || '0', 10);
      const successes = parseInt(successesStr || '0', 10);
      const failures = parseInt(failuresStr || '0', 10);

      const successRate = attempts > 0 ? (successes / attempts) * 100 : 0;

      return {
        attempts,
        successes,
        failures,
        successRate: `${successRate.toFixed(2)}%`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get metrics for channel ${channel}: ${error.message}`,
      );
      return { attempts: 0, successes: 0, failures: 0, successRate: '0.00%' };
    }
  }

  /**
   * Gets the total number of delivery attempts, successes, and failures
   * for all channels within the metrics window
   */
  async getMetrics(): Promise<NotificationMetricsDto> {
    try {
      const metrics = new NotificationMetricsDto();
      metrics.channels = {};

      // Initialize total metrics
      metrics.total = {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: '0.00%',
        avgLatencyMs: 0,
      };

      // Initialize last hour metrics
      metrics.lastHour = {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: '0.00%',
      };

      // Get all channel metrics
      const channels = await this.getChannels();
      const channelMetricsPromises = channels.map((channel) =>
        this.getChannelMetrics(channel),
      );
      const channelMetricsResults = await Promise.all(channelMetricsPromises);

      // Process channel metrics
      channels.forEach((channel, index) => {
        const channelMetrics = channelMetricsResults[index];

        // Add to total metrics
        metrics.total.attempts += channelMetrics.attempts;
        metrics.total.successes += channelMetrics.successes;
        metrics.total.failures += channelMetrics.failures;

        // Add channel-specific metrics
        metrics.channels[channel] = {
          attempts: channelMetrics.attempts,
          successes: channelMetrics.successes,
          failures: channelMetrics.failures,
        };
      });

      // Calculate overall success rate
      if (metrics.total.attempts > 0) {
        const successRate =
          (metrics.total.successes / metrics.total.attempts) * 100;
        metrics.total.successRate = `${successRate.toFixed(2)}%`;
      }

      // Calculate average latency
      const latencies = await this.getLatencies();
      if (latencies.length > 0) {
        const sum = latencies.reduce((acc, val) => acc + val, 0);
        metrics.total.avgLatencyMs = Math.round(sum / latencies.length);
      }

      // Calculate last hour metrics
      const lastHourMetrics = await this.getLastHourMetrics();
      metrics.lastHour = lastHourMetrics;

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`);
      return new NotificationMetricsDto();
    }
  }

  /**
   * Gets metrics for the last hour
   */
  private async getLastHourMetrics(): Promise<TimeWindowMetricsDto> {
    try {
      const now = Date.now();
      const cutoff = now - this.metricsWindow;

      // Get all timestamps from the last hour
      const recentTimestamps = await this.redis.zrangebyscore(
        this.TIMESTAMPS_KEY,
        cutoff,
        '+inf',
      );

      // Count attempts, successes, and failures
      const attempts = recentTimestamps.filter((t) =>
        t.startsWith('attempt:'),
      ).length;
      const successes = recentTimestamps.filter((t) =>
        t.startsWith('success:'),
      ).length;
      const failures = recentTimestamps.filter((t) =>
        t.startsWith('failure:'),
      ).length;

      const successRate = attempts > 0 ? (successes / attempts) * 100 : 0;

      return {
        attempts,
        successes,
        failures,
        successRate: `${successRate.toFixed(2)}%`,
      };
    } catch (error) {
      this.logger.error(`Failed to get last hour metrics: ${error.message}`);
      return { attempts: 0, successes: 0, failures: 0, successRate: '0.00%' };
    }
  }

  /**
   * Gets all latency values stored in Redis
   */
  private async getLatencies(): Promise<number[]> {
    try {
      const now = Date.now();
      const cutoff = now - this.metricsWindow;

      // Get all latency entries from the last hour
      const latencyEntries = await this.redis.zrangebyscore(
        this.LATENCIES_KEY,
        cutoff,
        '+inf',
      );

      // Extract latency values from entries (format: channel:latencyMs:timestamp)
      return latencyEntries
        .map((entry) => {
          const parts = entry.split(':');
          return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
        })
        .filter((latency) => !Number.isNaN(latency) && latency > 0);
    } catch (error) {
      this.logger.error(`Failed to get latencies: ${error.message}`);
      return [];
    }
  }

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    // Delete all metrics keys
    const keys = [
      this.ATTEMPTS_KEY,
      this.SUCCESSES_KEY,
      this.FAILURES_KEY,
      this.LATENCIES_KEY,
      this.TIMESTAMPS_KEY,
    ];

    await this.redis.del(...keys);
    await this.resetChannelMetrics();

    this.logger.debug('notification: monitoring: metrics reset');
  }
}

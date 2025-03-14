import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { NotificationMetricsService } from './notification-metrics.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationType } from '../entities/notification-preference.entity';

/**
 * Configuration for notification rate limiting
 */
export interface RateLimitConfiguration {
  maxNotificationsPerMinute: number; // Default max notifications per minute
  maxNotificationsPerHour: number; // Default max notifications per hour
  maxNotificationsPerDay: number; // Default max notifications per day
  overrideEnabled: boolean; // Whether overrides are enabled
}

/**
 * Status of rate limits for a user
 */
export interface RateLimitStatus {
  limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  current: {
    minute: number;
    hour: number;
    day: number;
  };
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  isRateLimited: boolean;
}

/**
 * Extended notification preference with metadata
 */
interface NotificationPreferenceWithMetadata {
  id: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
  channels: string[];
  metadata?: {
    rateLimits?: {
      perMinute?: number;
      perHour?: number;
      perDay?: number;
    };
    [key: string]: any;
  };
}

/**
 * Service for handling notification rate limiting
 * Prevents notification spam and ensures fair resource usage
 */
@Injectable()
export class NotificationRateLimitService {
  private readonly config: RateLimitConfiguration;
  private readonly redisKeyPrefix = 'notification:rate-limit';
  private readonly redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly metricsService: NotificationMetricsService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {
    // Initialize Redis client
    this.redis = this.redisService.getOrThrow();

    // Load configuration from config service
    this.config = {
      maxNotificationsPerMinute: this.configService.get<number>(
        'notification.rateLimit.perMinute',
        10,
      ),
      maxNotificationsPerHour: this.configService.get<number>(
        'notification.rateLimit.perHour',
        50,
      ),
      maxNotificationsPerDay: this.configService.get<number>(
        'notification.rateLimit.perDay',
        200,
      ),
      overrideEnabled: this.configService.get<boolean>(
        'notification.rateLimit.overrideEnabled',
        true,
      ),
    };

    this.logger.debug(
      `NotificationRateLimitService initialized with config: ${JSON.stringify(this.config)}`,
    );
  }

  /**
   * Check if a user has exceeded rate limits for a notification type
   * @param userId User ID to check
   * @param notificationType Type of notification
   * @returns True if rate limited, false otherwise
   */
  async checkRateLimit(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const timer = this.metricsService.startTimer(
      notificationType,
      'rate_limit_check',
    );

    try {
      // Check user preferences for custom rate limits
      let minuteLimit = this.config.maxNotificationsPerMinute;
      let hourLimit = this.config.maxNotificationsPerHour;
      let dayLimit = this.config.maxNotificationsPerDay;

      try {
        const preference = (await this.preferenceService.getPreferenceByType(
          userId,
          notificationType as NotificationType,
        )) as NotificationPreferenceWithMetadata;

        // Apply custom limits if available in preferences
        if (preference.metadata?.rateLimits) {
          const customLimits = preference.metadata.rateLimits;
          minuteLimit = customLimits.perMinute || minuteLimit;
          hourLimit = customLimits.perHour || hourLimit;
          dayLimit = customLimits.perDay || dayLimit;
        }
      } catch {
        // If preference not found, use default limits
        this.logger.debug(
          `No custom rate limits found for user ${userId}, using defaults`,
        );
      }

      // Get current counts
      const minuteKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:minute`;
      const hourKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:hour`;
      const dayKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:day`;

      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.redis.get(minuteKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(hourKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(dayKey).then((val) => parseInt(val || '0', 10)),
      ]);

      // Calculate remaining counts for metrics
      const minuteRemaining = Math.max(0, minuteLimit - minuteCount);
      const hourRemaining = Math.max(0, hourLimit - hourCount);
      const dayRemaining = Math.max(0, dayLimit - dayCount);

      // Update rate limit metrics
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'minute',
        minuteRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'hour',
        hourRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'day',
        dayRemaining,
      );

      // Check if any limit is exceeded
      const isRateLimited =
        minuteCount >= minuteLimit ||
        hourCount >= hourLimit ||
        dayCount >= dayLimit;

      if (isRateLimited) {
        this.logger.debug(
          `User ${userId} rate limited for ${notificationType}: ` +
            `minute=${minuteCount}/${minuteLimit}, ` +
            `hour=${hourCount}/${hourLimit}, ` +
            `day=${dayCount}/${dayLimit}`,
        );

        // Record metric for rate limiting
        this.metricsService.recordRateLimited(notificationType, userId);
      }

      return isRateLimited;
    } catch (error: any) {
      this.logger.error(
        `Error checking rate limit for user ${userId}: ${error.message}`,
        error.stack,
      );

      // If there's an error checking rate limits, default to not rate limiting
      return false;
    } finally {
      timer.end();
    }
  }

  /**
   * Increment rate limit counters for a user and notification type
   * @param userId User ID
   * @param notificationType Type of notification
   */
  async incrementRateLimitCounters(
    userId: string,
    notificationType: string,
  ): Promise<void> {
    const timer = this.metricsService.startTimer(
      notificationType,
      'rate_limit_increment',
    );

    try {
      const minuteKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:minute`;
      const hourKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:hour`;
      const dayKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:day`;

      const pipeline = this.redis.pipeline();

      // Increment counters
      pipeline.incr(minuteKey);
      pipeline.incr(hourKey);
      pipeline.incr(dayKey);

      // Set expiration if not already set
      pipeline.expire(minuteKey, 60); // 1 minute
      pipeline.expire(hourKey, 3600); // 1 hour
      pipeline.expire(dayKey, 86400); // 1 day

      await pipeline.exec();

      // Get updated counts for metrics
      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.redis.get(minuteKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(hourKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(dayKey).then((val) => parseInt(val || '0', 10)),
      ]);

      // Get limits
      let minuteLimit = this.config.maxNotificationsPerMinute;
      let hourLimit = this.config.maxNotificationsPerHour;
      let dayLimit = this.config.maxNotificationsPerDay;

      try {
        const preference = (await this.preferenceService.getPreferenceByType(
          userId,
          notificationType as NotificationType,
        )) as NotificationPreferenceWithMetadata;

        // Apply custom limits if available in preferences
        if (preference.metadata?.rateLimits) {
          const customLimits = preference.metadata.rateLimits;
          minuteLimit = customLimits.perMinute || minuteLimit;
          hourLimit = customLimits.perHour || hourLimit;
          dayLimit = customLimits.perDay || dayLimit;
        }
      } catch {
        // If preference not found, use default limits
      }

      // Calculate remaining counts for metrics
      const minuteRemaining = Math.max(0, minuteLimit - minuteCount);
      const hourRemaining = Math.max(0, hourLimit - hourCount);
      const dayRemaining = Math.max(0, dayLimit - dayCount);

      // Update rate limit metrics
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'minute',
        minuteRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'hour',
        hourRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'day',
        dayRemaining,
      );

      // Check if any limit is now exceeded
      const isRateLimited =
        minuteCount >= minuteLimit ||
        hourCount >= hourLimit ||
        dayCount >= dayLimit;

      if (isRateLimited) {
        this.metricsService.recordRateLimited(notificationType, userId);
      }
    } catch (error: any) {
      this.logger.error(
        `Error incrementing rate limit counters for user ${userId}: ${error.message}`,
        error.stack,
      );
    } finally {
      timer.end();
    }
  }

  /**
   * Get current rate limit status for a user and notification type
   * @param userId User ID
   * @param notificationType Type of notification
   * @returns Rate limit status
   */
  async getRateLimitStatus(
    userId: string,
    notificationType: string,
  ): Promise<RateLimitStatus> {
    const timer = this.metricsService.startTimer(
      notificationType,
      'rate_limit_status',
    );

    try {
      // Get user preferences for custom rate limits
      let minuteLimit = this.config.maxNotificationsPerMinute;
      let hourLimit = this.config.maxNotificationsPerHour;
      let dayLimit = this.config.maxNotificationsPerDay;

      try {
        const preference = (await this.preferenceService.getPreferenceByType(
          userId,
          notificationType as NotificationType,
        )) as NotificationPreferenceWithMetadata;

        // Apply custom limits if available in preferences
        if (preference.metadata?.rateLimits) {
          const customLimits = preference.metadata.rateLimits;
          minuteLimit = customLimits.perMinute || minuteLimit;
          hourLimit = customLimits.perHour || hourLimit;
          dayLimit = customLimits.perDay || dayLimit;
        }
      } catch {
        // If preference not found, use default limits
        this.logger.debug(
          `No custom rate limits found for user ${userId}, using defaults`,
        );
      }

      // Get current counts
      const minuteKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:minute`;
      const hourKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:hour`;
      const dayKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:day`;

      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.redis.get(minuteKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(hourKey).then((val) => parseInt(val || '0', 10)),
        this.redis.get(dayKey).then((val) => parseInt(val || '0', 10)),
      ]);

      // Calculate remaining counts
      const minuteRemaining = Math.max(0, minuteLimit - minuteCount);
      const hourRemaining = Math.max(0, hourLimit - hourCount);
      const dayRemaining = Math.max(0, dayLimit - dayCount);

      // Update rate limit metrics
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'minute',
        minuteRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'hour',
        hourRemaining,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'day',
        dayRemaining,
      );

      // Check if any limit is exceeded
      const isRateLimited =
        minuteCount >= minuteLimit ||
        hourCount >= hourLimit ||
        dayCount >= dayLimit;

      // Record metrics for API call
      this.metricsService.incrementCounter(
        notificationType,
        'rate_limit_check',
      );

      // Record if rate limited
      if (isRateLimited) {
        this.metricsService.recordRateLimited(notificationType, userId);
      }

      const status: RateLimitStatus = {
        limits: {
          perMinute: minuteLimit,
          perHour: hourLimit,
          perDay: dayLimit,
        },
        current: {
          minute: minuteCount,
          hour: hourCount,
          day: dayCount,
        },
        remaining: {
          minute: minuteRemaining,
          hour: hourRemaining,
          day: dayRemaining,
        },
        isRateLimited,
      };

      return status;
    } catch (error: any) {
      this.logger.error(
        `Error getting rate limit status for user ${userId}: ${error.message}`,
        error.stack,
      );

      // Return default status if there's an error
      return {
        limits: {
          perMinute: this.config.maxNotificationsPerMinute,
          perHour: this.config.maxNotificationsPerHour,
          perDay: this.config.maxNotificationsPerDay,
        },
        current: {
          minute: 0,
          hour: 0,
          day: 0,
        },
        remaining: {
          minute: this.config.maxNotificationsPerMinute,
          hour: this.config.maxNotificationsPerHour,
          day: this.config.maxNotificationsPerDay,
        },
        isRateLimited: false,
      };
    } finally {
      timer.end();
    }
  }

  /**
   * Override rate limits for a user and notification type
   * Only works if overrides are enabled in configuration
   * @param userId User ID
   * @param notificationType Type of notification
   * @returns True if override successful, false otherwise
   */
  async overrideRateLimit(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const timer = this.metricsService.startTimer(
      notificationType,
      'rate_limit_override',
    );

    try {
      if (!this.config.overrideEnabled) {
        this.logger.warn(
          `Rate limit override attempted for user ${userId} but overrides are disabled`,
        );
        return false;
      }

      const minuteKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:minute`;
      const hourKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:hour`;
      const dayKey = `${this.redisKeyPrefix}:${userId}:${notificationType}:day`;

      // Reset counters
      await Promise.all([
        this.redis.del(minuteKey),
        this.redis.del(hourKey),
        this.redis.del(dayKey),
      ]);

      this.logger.debug(
        `Rate limit override successful for user ${userId} and type ${notificationType}`,
      );

      // Update rate limit metrics to show full capacity
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'minute',
        this.config.maxNotificationsPerMinute,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'hour',
        this.config.maxNotificationsPerHour,
      );
      this.metricsService.updateRateLimitRemaining(
        userId,
        notificationType,
        'day',
        this.config.maxNotificationsPerDay,
      );

      // Record metric for override
      this.metricsService.incrementCounter(
        notificationType,
        'rate_limit_override',
      );

      return true;
    } catch (error: any) {
      this.logger.error(
        `Error overriding rate limit for user ${userId}: ${error.message}`,
        error.stack,
      );
      return false;
    } finally {
      timer.end();
    }
  }
}

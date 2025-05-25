import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from 'src/generated/client';
import { Logger } from 'nestjs-pino';
import { INotificationRepository } from '../services/interfaces/notification-repository.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationMetricsService } from '../services/notification-metrics.service';
import { NotificationCacheService } from '../services/notification-cache.service';

/**
 * Repository for notification data access with optimized queries and caching
 */
@Injectable()
export class NotificationRepository implements INotificationRepository {
  // Cache TTL in seconds
  private readonly CACHE_TTL = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly metricsService: NotificationMetricsService,
    private readonly cacheService: NotificationCacheService,
  ) {}

  /**
   * Find multiple notifications with optimized query and metrics tracking
   * @param args Prisma find many arguments
   * @returns Array of notifications
   */
  async findMany(
    args: Prisma.NotificationFindManyArgs,
  ): Promise<Notification[]> {
    const timer = this.metricsService.startTimer('repository', 'find_many');

    try {
      // Generate cache key based on query arguments
      const cacheKey = this.generateCacheKey(args.where);

      // Check cache first
      const cachedResult = await this.cacheService.getNotifications(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Ensure proper ordering for performance
      const optimizedArgs = this.optimizeQueryArgs(args);

      // Execute query with metrics
      const result = await this.prisma.notification.findMany(optimizedArgs);

      // Cache the result
      await this.cacheService.setNotifications(
        cacheKey,
        result,
        this.CACHE_TTL,
      );

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'find_many',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.findMany: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Count notifications with caching for frequent queries
   * @param args Prisma count arguments
   * @returns Count of notifications
   */
  async count(args: Prisma.NotificationCountArgs): Promise<number> {
    const timer = this.metricsService.startTimer('repository', 'count');

    try {
      // Generate cache key based on where conditions
      const cacheKey = this.generateCacheKey(args.where);

      // Check cache first
      const cachedResult = await this.cacheService.getCount(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute query with metrics if not in cache
      const count = await this.prisma.notification.count(args);

      // Cache the result
      await this.cacheService.setCount(cacheKey, count, this.CACHE_TTL);

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'count',
        timer.getElapsedMs?.() || 0,
      );

      return count;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.count: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Create a notification with metrics tracking
   * @param data Notification data
   * @returns Created notification
   */
  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    const timer = this.metricsService.startTimer('repository', 'create');

    try {
      // Execute query with metrics
      const result = await this.prisma.notification.create({ data });

      // Invalidate cache for this user
      await this.cacheService.invalidateUserCache(data.userId as string);

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'create',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.create: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Update a notification with metrics tracking
   * @param id Notification ID
   * @param data Update data
   * @returns Updated notification
   */
  async update(
    id: string,
    data: Prisma.NotificationUpdateInput,
  ): Promise<Notification> {
    const timer = this.metricsService.startTimer('repository', 'update');

    try {
      // Execute query with metrics
      const result = await this.prisma.notification.update({
        where: { id },
        data,
      });

      // Invalidate cache for this user
      if (result.userId) {
        await this.cacheService.invalidateUserCache(result.userId);
      }

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'update',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.update: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Update multiple notifications with metrics tracking
   * @param args Update many arguments
   * @returns Batch payload
   */
  async updateMany(
    args: Prisma.NotificationUpdateManyArgs,
  ): Promise<Prisma.BatchPayload> {
    const timer = this.metricsService.startTimer('repository', 'update_many');

    try {
      // Execute query with metrics
      const result = await this.prisma.notification.updateMany(args);

      // Invalidate cache for affected users
      if (args.where?.userId) {
        await this.cacheService.invalidateUserCache(
          args.where.userId as string,
        );
      }

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'update_many',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.updateMany: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Find first notification with metrics tracking
   * @param args Find first arguments
   * @returns First matching notification or null
   */
  async findFirst(
    args: Prisma.NotificationFindFirstArgs,
  ): Promise<Notification | null> {
    const timer = this.metricsService.startTimer('repository', 'find_first');

    try {
      // Generate cache key based on query arguments
      const cacheKey = `first:${this.generateCacheKey(args.where)}`;

      // Check cache first
      const cachedResults = await this.cacheService.getNotifications(cacheKey);
      if (cachedResults !== null && cachedResults.length > 0) {
        return cachedResults[0];
      }

      // Ensure proper ordering for performance
      const optimizedArgs = this.optimizeQueryArgs(args);

      // Execute query with metrics
      const result = await this.prisma.notification.findFirst(optimizedArgs);

      // Cache the result if found
      if (result) {
        await this.cacheService.setNotifications(
          cacheKey,
          [result],
          this.CACHE_TTL,
        );
      }

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'find_first',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.findFirst: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Find notifications by user ID with optimized query
   * @param userId User ID
   * @param limit Maximum number of notifications to return
   * @param offset Number of notifications to skip
   * @param includeViewed Whether to include viewed notifications
   * @returns Array of notifications
   */
  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    includeViewed: boolean = false,
  ): Promise<Notification[]> {
    const timer = this.metricsService.startTimer(
      'repository',
      'find_by_user_id',
    );

    try {
      // Generate cache key
      const viewedPart = includeViewed ? ':all' : ':unread';
      const cacheKey = `user:${userId}${viewedPart}:limit:${limit}:offset:${offset}`;

      // Check cache first
      const cachedResult = await this.cacheService.getNotifications(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Build optimized query
      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(includeViewed ? {} : { viewedAt: null }),
      };

      // Execute query with metrics
      const result = await this.prisma.notification.findMany({
        where,
        orderBy: { notificationTime: 'desc' },
        take: limit,
        skip: offset,
        // Include all fields required by the Notification type
        select: {
          id: true,
          key: true,
          type: true,
          userId: true,
          subjects: true,
          subjectCount: true,
          diObject: true,
          inObject: true,
          prObject: true,
          text: true,
          decorators: true,
          link: true,
          metadata: true,
          notificationTime: true,
          viewedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Cache the result
      await this.cacheService.setNotifications(
        cacheKey,
        result,
        this.CACHE_TTL,
      );

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'find_by_user_id',
        timer.getElapsedMs?.() || 0,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.findByUserId: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Count unread notifications for a user with caching
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async countUnreadByUserId(userId: string): Promise<number> {
    const timer = this.metricsService.startTimer('repository', 'count_unread');

    try {
      // Generate cache key
      const cacheKey = `unread:${userId}`;

      // Check cache first
      const cachedResult = await this.cacheService.getCount(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute query with metrics if not in cache
      const count = await this.prisma.notification.count({
        where: {
          userId,
          viewedAt: null,
        },
      });

      // Cache the result
      await this.cacheService.setCount(cacheKey, count, this.CACHE_TTL);

      // Record query metrics
      this.metricsService.recordDbQueryDuration(
        'count_unread',
        timer.getElapsedMs?.() || 0,
      );

      return count;
    } catch (error) {
      this.logger.error(
        `Error in NotificationRepository.countUnreadByUserId: ${error.message}`,
        error.stack,
      );

      // Record error metric
      this.metricsService.incrementCounter('repository', 'error');
      throw error;
    } finally {
      timer.end();
    }
  }

  /**
   * Optimize query arguments for better performance
   * @param args Original query arguments
   * @returns Optimized query arguments
   */
  private optimizeQueryArgs<
    T extends
      | Prisma.NotificationFindManyArgs
      | Prisma.NotificationFindFirstArgs,
  >(args: T): T {
    // Create a copy of the args to avoid modifying the original
    const optimizedArgs = { ...args };

    // Ensure proper ordering for index usage
    if (!optimizedArgs.orderBy) {
      optimizedArgs.orderBy = { notificationTime: 'desc' };
    }

    // Add select clause if not present to only fetch needed fields
    if (!optimizedArgs.select) {
      optimizedArgs.select = {
        id: true,
        key: true,
        type: true,
        userId: true,
        subjects: true,
        subjectCount: true,
        diObject: true,
        inObject: true,
        prObject: true,
        text: true,
        decorators: true,
        link: true,
        metadata: true,
        notificationTime: true,
        viewedAt: true,
        createdAt: true,
        updatedAt: true,
      };
    }

    return optimizedArgs;
  }

  /**
   * Generate a cache key based on where conditions
   * @param where Where conditions
   * @returns Cache key
   */
  private generateCacheKey(where?: Prisma.NotificationWhereInput): string {
    if (!where) return 'all';

    // For user-specific queries, use userId as part of the key
    if (where.userId) {
      const viewedPart = where.viewedAt === null ? ':unread' : '';
      return `user:${where.userId}${viewedPart}`;
    }

    // For type-specific queries
    if (where.type) {
      return `type:${where.type}`;
    }

    // Default key based on JSON stringified where clause
    return `query:${JSON.stringify(where)}`;
  }
}

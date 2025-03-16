import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from 'nestjs-pino';
import { FeedItem } from '../entities/feed.entity';
import { GetContentsCommand } from '../entities/commands/get-contents.command';
import { GetUsersCommand } from '../entities/commands/get-users.command';
import { GetEngagementMetricsCommand } from '../entities/commands/get-engagement-metrics.command';
import { GetUserLikesStatusCommand } from '../entities/commands/get-user-likes-status.command';
import { GetUserFollowStatusCommand } from '../entities/commands/get-user-follow-status.command';
import { FeedErrorFactory } from '../errors/feed.error-factory';
import {
  EngagementMetrics,
  FeedContent,
  UserFollowStatus,
  UserInfo,
  UserLikeStatus,
} from '../entities/feed.types';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class FeedEnrichmentService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: Logger,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Enrich feed items with content
   * @param contentIds Array of content IDs to enrich
   * @param userId Optional user ID for personalized data
   * @returns Array of enriched feed items
   */
  async enrichFeedItems(
    contentIds: string[],
    userId?: string | null,
  ): Promise<FeedItem[]> {
    try {
      if (!contentIds.length) {
        return [];
      }

      // Get content data
      const contents = await this.getContents(contentIds);
      if (!contents.length) {
        return [];
      }

      // Extract author IDs from content
      const authorIds = contents.map((content) => content.authorId);

      // Get author information
      const authors = await this.getAuthors(authorIds);

      // Get engagement metrics
      const engagementMetrics = await this.getEngagementMetrics(contentIds);

      // Get user-specific data if user is logged in
      let userLikeStatus: UserLikeStatus[] = [];
      let userFollowStatus: UserFollowStatus[] = [];

      if (userId) {
        // Get like status for the current user
        userLikeStatus = await this.getUserLikeStatus(userId, contentIds);

        // Get follow status for the current user
        userFollowStatus = await this.getUserFollowStatus(userId, authorIds);
      }

      // Map all data to feed items
      return contents.map((content): FeedItem => {
        // Find author data
        const author = authors.find((a) => a.id === content.authorId);

        // Find engagement metrics
        const metrics = engagementMetrics.find(
          (m) => m.contentId === content.id,
        );

        // Find user-specific data
        const likeStatus = userLikeStatus.find(
          (l) => l.contentId === content.id,
        );
        const followStatus = userFollowStatus.find(
          (f) => f.targetUserId === content.authorId,
        );

        // Create the feed item with all available data
        return {
          id: content.id,
          type: content.type,
          score: content.score ?? 0,
          content,
          author: author
            ? {
                id: author.id,
                firstName: author.firstName,
                lastName: author.lastName,
                avatarUrl: author.avatarUrl,
              }
            : undefined,
          engagement: metrics
            ? {
                likeCount: metrics.likeCount,
                commentCount: metrics.commentCount,
                viewCount: metrics.viewCount,
              }
            : undefined,
          userSpecific: userId
            ? {
                liked: likeStatus?.liked ?? false,
                following: followStatus?.following ?? false,
              }
            : undefined,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        };
      });
    } catch (error) {
      this.logger.error('Failed to enrich feed items', { error, contentIds });
      if (error instanceof Error) {
        throw FeedErrorFactory.feedEnrichmentFailed(error);
      }
      throw FeedErrorFactory.feedEnrichmentFailed();
    }
  }

  /**
   * Get content data for the given content IDs
   * @param contentIds Array of content IDs
   * @returns Array of content data
   */
  private async getContents(contentIds: string[]): Promise<FeedContent[]> {
    try {
      return await this.commandBus.execute(new GetContentsCommand(contentIds));
    } catch (error) {
      this.logger.error('Failed to get contents', { error, contentIds });
      if (error instanceof Error) {
        throw FeedErrorFactory.feedEnrichmentFailed(error);
      }
      throw FeedErrorFactory.feedEnrichmentFailed();
    }
  }

  /**
   * Get author information for the given user IDs
   * @param userIds Array of user IDs
   * @returns Array of user information
   */
  private async getAuthors(userIds: string[]): Promise<UserInfo[]> {
    try {
      // Check cache first
      const cachePromises = userIds.map((userId) => {
        const cacheKey = `feed:author:${userId}`;
        return this.cacheService
          .get<UserInfo>(cacheKey)
          .then((cachedAuthor) => ({ userId, cachedAuthor }));
      });

      const cacheResults = await Promise.all(cachePromises);

      const cachedAuthors: UserInfo[] = [];
      const authorIdsToFetch: string[] = [];

      // Process cache results
      cacheResults.forEach(({ userId, cachedAuthor }) => {
        if (cachedAuthor) {
          cachedAuthors.push(cachedAuthor);
        } else {
          authorIdsToFetch.push(userId);
        }
      });

      // If all authors were in cache, return them
      if (authorIdsToFetch.length === 0) {
        return cachedAuthors;
      }

      // Otherwise, fetch missing authors
      const fetchedAuthors = await this.commandBus.execute(
        new GetUsersCommand(authorIdsToFetch),
      );

      // Cache fetched authors
      const setCachePromises = fetchedAuthors.map((author) => {
        const cacheKey = `feed:author:${author.id}`;
        return this.cacheService.set(cacheKey, author, 15 * 60); // 15 minutes TTL
      });

      await Promise.all(setCachePromises);

      // Combine cached and fetched authors
      return [...cachedAuthors, ...fetchedAuthors];
    } catch (error) {
      this.logger.error('Failed to get author information', { error, userIds });
      // Return empty array to allow graceful degradation
      return [];
    }
  }

  /**
   * Get engagement metrics for the given content IDs
   * @param contentIds Array of content IDs
   * @returns Array of engagement metrics
   */
  private async getEngagementMetrics(
    contentIds: string[],
  ): Promise<EngagementMetrics[]> {
    try {
      // Check cache first
      const cachePromises = contentIds.map((contentId) => {
        const cacheKey = `feed:engagement:${contentId}`;
        return this.cacheService
          .get<EngagementMetrics>(cacheKey)
          .then((cachedMetric) => ({ contentId, cachedMetric }));
      });

      const cacheResults = await Promise.all(cachePromises);

      const cachedMetrics: EngagementMetrics[] = [];
      const contentIdsToFetch: string[] = [];

      // Process cache results
      cacheResults.forEach(({ contentId, cachedMetric }) => {
        if (cachedMetric) {
          cachedMetrics.push(cachedMetric);
        } else {
          contentIdsToFetch.push(contentId);
        }
      });

      // If all metrics were in cache, return them
      if (contentIdsToFetch.length === 0) {
        return cachedMetrics;
      }

      // Otherwise, fetch missing metrics
      const fetchedMetrics = await this.commandBus.execute(
        new GetEngagementMetricsCommand(contentIdsToFetch),
      );

      // Cache fetched metrics
      const setCachePromises = fetchedMetrics.map((metric) => {
        const cacheKey = `feed:engagement:${metric.contentId}`;
        return this.cacheService.set(cacheKey, metric, 5 * 60); // 5 minutes TTL
      });

      await Promise.all(setCachePromises);

      // Combine cached and fetched metrics
      return [...cachedMetrics, ...fetchedMetrics];
    } catch (error) {
      this.logger.error('Failed to get engagement metrics', {
        error,
        contentIds,
      });
      // Return empty array to allow graceful degradation
      return [];
    }
  }

  /**
   * Get like status for the given user and content IDs
   * @param userId User ID
   * @param contentIds Array of content IDs
   * @returns Array of like status
   */
  private async getUserLikeStatus(
    userId: string,
    contentIds: string[],
  ): Promise<UserLikeStatus[]> {
    try {
      // Check cache first
      const cachePromises = contentIds.map((contentId) => {
        const cacheKey = `feed:like:${userId}:${contentId}`;
        return this.cacheService
          .get<UserLikeStatus>(cacheKey)
          .then((cachedStatus) => ({ contentId, cachedStatus }));
      });

      const cacheResults = await Promise.all(cachePromises);

      const cachedStatuses: UserLikeStatus[] = [];
      const contentIdsToFetch: string[] = [];

      // Process cache results
      cacheResults.forEach(({ contentId, cachedStatus }) => {
        if (cachedStatus) {
          cachedStatuses.push(cachedStatus);
        } else {
          contentIdsToFetch.push(contentId);
        }
      });

      // If all statuses were in cache, return them
      if (contentIdsToFetch.length === 0) {
        return cachedStatuses;
      }

      // Otherwise, fetch missing statuses
      const fetchedStatuses = await this.commandBus.execute(
        new GetUserLikesStatusCommand(userId, contentIdsToFetch),
      );

      // Cache fetched statuses
      const setCachePromises = fetchedStatuses.map((status) => {
        const cacheKey = `feed:like:${userId}:${status.contentId}`;
        return this.cacheService.set(cacheKey, status, 2 * 60); // 2 minutes TTL
      });

      await Promise.all(setCachePromises);

      // Combine cached and fetched statuses
      return [...cachedStatuses, ...fetchedStatuses];
    } catch (error) {
      this.logger.error('Failed to get like status', {
        error,
        userId,
        contentIds,
      });
      // Return empty array to allow graceful degradation
      return [];
    }
  }

  /**
   * Get follow status for the given user and target user IDs
   * @param userId User ID
   * @param targetUserIds Array of target user IDs
   * @returns Array of follow status
   */
  private async getUserFollowStatus(
    userId: string,
    targetUserIds: string[],
  ): Promise<UserFollowStatus[]> {
    try {
      // Check cache first
      const cachePromises = targetUserIds.map((targetUserId) => {
        const cacheKey = `feed:follow:${userId}:${targetUserId}`;
        return this.cacheService
          .get<UserFollowStatus>(cacheKey)
          .then((cachedStatus) => ({ targetUserId, cachedStatus }));
      });

      const cacheResults = await Promise.all(cachePromises);

      const cachedStatuses: UserFollowStatus[] = [];
      const userIdsToFetch: string[] = [];

      // Process cache results
      cacheResults.forEach(({ targetUserId, cachedStatus }) => {
        if (cachedStatus) {
          cachedStatuses.push(cachedStatus);
        } else {
          userIdsToFetch.push(targetUserId);
        }
      });

      // If all statuses were in cache, return them
      if (userIdsToFetch.length === 0) {
        return cachedStatuses;
      }

      // Otherwise, fetch missing statuses
      const fetchedStatuses = await this.commandBus.execute(
        new GetUserFollowStatusCommand(userId, userIdsToFetch),
      );

      // Cache fetched statuses
      const setCachePromises = fetchedStatuses.map((status) => {
        const cacheKey = `feed:follow:${userId}:${status.targetUserId}`;
        return this.cacheService.set(cacheKey, status, 5 * 60); // 5 minutes TTL
      });

      await Promise.all(setCachePromises);

      // Combine cached and fetched statuses
      return [...cachedStatuses, ...fetchedStatuses];
    } catch (error) {
      this.logger.error('Failed to get follow status', {
        error,
        userId,
        targetUserIds,
      });
      // Return empty array to allow graceful degradation
      return [];
    }
  }
}

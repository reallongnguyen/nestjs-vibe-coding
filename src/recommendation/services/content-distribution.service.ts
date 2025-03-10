import { Injectable, Logger } from '@nestjs/common';
import { FeedType } from '../../feed/entities/feed.types';
import { GorseClient } from './gorse.client';

@Injectable()
export class ContentDistributionService {
  private readonly logger = new Logger(ContentDistributionService.name);
  private readonly GUEST_FEED_MIX_RATIO = 0.7; // 70% popular, 30% latest
  private readonly PERSONALIZED_MIX_RATIO = {
    RECOMMENDED: 0.3, // 30% personalized recommendations
    POPULAR: 0.6, // 60% popular content
    LATEST: 0.1, // 10% latest content
  };

  constructor(private readonly gorseClient: GorseClient) {}

  /**
   * Get content recommendations based on feed type and user preferences
   * @param userId - The ID of the user requesting recommendations (undefined for guests)
   * @param feedType - The type of feed (PERSONALIZED, FOLLOWING, TRENDING, LATEST)
   * @param offset - Pagination offset
   * @param limit - Number of items to return
   * @returns Array of content IDs
   */
  public async getRecommendations(
    userId: string | undefined,
    feedType: FeedType,
    offset: number,
    limit: number,
  ): Promise<string[]> {
    try {
      // For guest users, redirect to guest feed
      if (!userId) {
        return this.getGuestFeed(offset, limit);
      }

      switch (feedType) {
        case FeedType.PERSONALIZED:
          return await this.getPersonalizedRecommendations(
            userId,
            offset,
            limit,
          );
        case FeedType.FOLLOWING:
          return await this.getFollowingRecommendations(userId, offset, limit);
        case FeedType.TRENDING:
          return await this.getTrendingRecommendations(userId, offset, limit);
        case FeedType.LATEST:
          return await this.getLatestRecommendations(limit);
        default:
          throw new Error(`Unsupported feed type: ${feedType}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get feed for guest users
   * Mixes popular and latest content in the user's preferred language
   */
  private async getGuestFeed(offset: number, limit: number): Promise<string[]> {
    // Note: Currently Gorse doesn't support language filtering directly
    // We'll need to implement this at the content service level

    // Calculate limits for popular and latest content
    const popularLimit = Math.ceil(limit * this.GUEST_FEED_MIX_RATIO);
    const latestLimit = limit - popularLimit;

    // Get popular and latest content
    const popularContent = await this.gorseClient.getPopular(
      undefined,
      popularLimit,
      offset,
    );

    const latestContent = await this.gorseClient.getLatest(latestLimit);

    // Combine and shuffle results
    const combined = [
      ...popularContent.map((item) => item.Id),
      ...latestContent,
    ];

    // Fisher-Yates shuffle using a for loop with positive increment
    for (let i = 0; i < combined.length; i += 1) {
      const j = i + Math.floor(Math.random() * (combined.length - i));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined;
  }

  private async getPersonalizedRecommendations(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<string[]> {
    // Calculate limits for each content type
    const recommendedLimit = Math.ceil(
      limit * this.PERSONALIZED_MIX_RATIO.RECOMMENDED,
    );
    const popularLimit = Math.ceil(limit * this.PERSONALIZED_MIX_RATIO.POPULAR);
    const latestLimit = limit - recommendedLimit - popularLimit; // Remaining items

    // Get content from all sources
    const [recommended, popular, latest] = await Promise.all([
      this.gorseClient.getRecommend(
        userId,
        undefined,
        undefined,
        recommendedLimit,
        offset,
      ),
      this.gorseClient
        .getPopular(userId, popularLimit, offset)
        .then((items) => items.map((item) => item.Id)),
      this.gorseClient.getLatest(latestLimit),
    ]);

    // Combine all content
    const combined = [...recommended, ...popular, ...latest];

    // Fisher-Yates shuffle for better content mixing
    for (let i = 0; i < combined.length; i += 1) {
      const j = i + Math.floor(Math.random() * (combined.length - i));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined;
  }

  private async getFollowingRecommendations(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<string[]> {
    const recommendations = await this.gorseClient.getUserNeighbors(
      userId,
      limit,
      offset,
    );
    return recommendations.map((item) => item.Id);
  }

  private async getTrendingRecommendations(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<string[]> {
    const recommendations = await this.gorseClient.getPopular(
      userId,
      limit,
      offset,
    );
    return recommendations.map((item) => item.Id);
  }

  private async getLatestRecommendations(limit: number): Promise<string[]> {
    return this.gorseClient.getLatest(limit);
  }
}

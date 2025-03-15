import {
  PersonalizedFeedError,
  FollowingFeedError,
  TrendingFeedError,
  LatestFeedError,
  FeedGenerationError,
  FeedEnrichmentError,
  FeedCacheError,
} from './feed.error-classes';

/**
 * Factory for creating Feed module errors
 */
export class FeedErrorFactory {
  /**
   * Creates an error for when personalized feed generation fails
   * @param cause - The original error
   * @returns PersonalizedFeedError
   */
  static personalizedFeedFailed(cause?: Error): PersonalizedFeedError {
    return new PersonalizedFeedError(cause);
  }

  /**
   * Creates an error for when following feed generation fails
   * @param cause - The original error
   * @returns FollowingFeedError
   */
  static followingFeedFailed(cause?: Error): FollowingFeedError {
    return new FollowingFeedError(cause);
  }

  /**
   * Creates an error for when trending feed generation fails
   * @param cause - The original error
   * @returns TrendingFeedError
   */
  static trendingFeedFailed(cause?: Error): TrendingFeedError {
    return new TrendingFeedError(cause);
  }

  /**
   * Creates an error for when latest feed generation fails
   * @param cause - The original error
   * @returns LatestFeedError
   */
  static latestFeedFailed(cause?: Error): LatestFeedError {
    return new LatestFeedError(cause);
  }

  /**
   * Creates an error for when general feed generation fails
   * @param cause - The original error
   * @returns FeedGenerationError
   */
  static feedGenerationFailed(cause?: Error): FeedGenerationError {
    return new FeedGenerationError(cause);
  }

  /**
   * Creates an error for when feed enrichment fails
   * @param cause - The original error
   * @returns FeedEnrichmentError
   */
  static feedEnrichmentFailed(cause?: Error): FeedEnrichmentError {
    return new FeedEnrichmentError(cause);
  }

  /**
   * Creates an error for when feed caching fails
   * @param cause - The original error
   * @returns FeedCacheError
   */
  static feedCacheFailed(cause?: Error): FeedCacheError {
    return new FeedCacheError(cause);
  }
}

import {
  PersonalizedFeedError,
  FollowingFeedError,
  TrendingFeedError,
  LatestFeedError,
  FeedGenerationError,
  FeedEnrichmentError,
  FeedCacheError,
  IdentityFetchError,
  SocialMetricsFetchError,
  LikeStatusFetchError,
  FollowStatusFetchError,
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
   * Creates an error for when user information fetching fails
   * @param cause - The original error
   * @returns IdentityFetchError
   */
  static identityFetchFailed(cause?: Error): IdentityFetchError {
    return new IdentityFetchError(cause);
  }

  /**
   * Creates an error for when engagement metrics fetching fails
   * @param cause - The original error
   * @returns SocialMetricsFetchError
   */
  static socialMetricsFetchFailed(cause?: Error): SocialMetricsFetchError {
    return new SocialMetricsFetchError(cause);
  }

  /**
   * Creates an error for when like status fetching fails
   * @param cause - The original error
   * @returns LikeStatusFetchError
   */
  static likeStatusFetchFailed(cause?: Error): LikeStatusFetchError {
    return new LikeStatusFetchError(cause);
  }

  /**
   * Creates an error for when follow status fetching fails
   * @param cause - The original error
   * @returns FollowStatusFetchError
   */
  static followStatusFetchFailed(cause?: Error): FollowStatusFetchError {
    return new FollowStatusFetchError(cause);
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

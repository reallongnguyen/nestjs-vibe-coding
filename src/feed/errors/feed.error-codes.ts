/**
 * Standardized error codes for the Feed module
 * These codes are used by the error factory to create specific error instances
 */
export enum FeedErrorCode {
  // Feed generation errors
  PERSONALIZED_FEED_FAILED = 'PERSONALIZED_FEED_FAILED',
  FOLLOWING_FEED_FAILED = 'FOLLOWING_FEED_FAILED',
  TRENDING_FEED_FAILED = 'TRENDING_FEED_FAILED',
  LATEST_FEED_FAILED = 'LATEST_FEED_FAILED',
  FEED_GENERATION_FAILED = 'FEED_GENERATION_FAILED',

  // Feed enrichment errors
  FEED_ENRICHMENT_FAILED = 'FEED_ENRICHMENT_FAILED',

  // Feed cache errors
  FEED_CACHE_FAILED = 'FEED_CACHE_FAILED',
}

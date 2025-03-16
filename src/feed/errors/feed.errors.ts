import { HttpStatus } from '@nestjs/common';
import { FeedErrorCode } from './feed.error-codes';

/**
 * Error definition interface
 */
export interface ErrorDefinition {
  message: string;
  status: HttpStatus;
}

/**
 * Error definitions for Feed module
 * Each error code maps to a message template and HTTP status code
 */
export const FEED_ERRORS: Record<FeedErrorCode, ErrorDefinition> = {
  [FeedErrorCode.PERSONALIZED_FEED_FAILED]: {
    message: 'Failed to generate personalized feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.FOLLOWING_FEED_FAILED]: {
    message: 'Failed to generate following feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.TRENDING_FEED_FAILED]: {
    message: 'Failed to generate trending feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.LATEST_FEED_FAILED]: {
    message: 'Failed to generate latest feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.FEED_GENERATION_FAILED]: {
    message: 'Failed to generate feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.FEED_ENRICHMENT_FAILED]: {
    message: 'Failed to enrich feed items: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.IDENTITY_FETCH_FAILED]: {
    message: 'Failed to fetch user information: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED]: {
    message: 'Failed to fetch engagement metrics: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.LIKE_STATUS_FETCH_FAILED]: {
    message: 'Failed to fetch like status: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.FOLLOW_STATUS_FETCH_FAILED]: {
    message: 'Failed to fetch follow status: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [FeedErrorCode.FEED_CACHE_FAILED]: {
    message: 'Failed to cache feed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};

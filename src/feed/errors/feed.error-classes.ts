import { AppError } from '../../common/errors/app.error';
import { FeedErrorCode } from './feed.error-codes';
import { FEED_ERRORS } from './feed.errors';

/**
 * Base error class for Feed module errors
 */
export class FeedError extends AppError {
  constructor(code: FeedErrorCode, params?: Record<string, any>) {
    const errorCode = `feed.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * Feed-related error classes
 */
export class PersonalizedFeedError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.PERSONALIZED_FEED_FAILED,
      FEED_ERRORS[FeedErrorCode.PERSONALIZED_FEED_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FollowingFeedError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.FOLLOWING_FEED_FAILED,
      FEED_ERRORS[FeedErrorCode.FOLLOWING_FEED_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class TrendingFeedError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.TRENDING_FEED_FAILED,
      FEED_ERRORS[FeedErrorCode.TRENDING_FEED_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class LatestFeedError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.LATEST_FEED_FAILED,
      FEED_ERRORS[FeedErrorCode.LATEST_FEED_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FeedGenerationError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.FEED_GENERATION_FAILED,
      FEED_ERRORS[FeedErrorCode.FEED_GENERATION_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FeedEnrichmentError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.FEED_ENRICHMENT_FAILED,
      FEED_ERRORS[FeedErrorCode.FEED_ENRICHMENT_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FeedCacheError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.FEED_CACHE_FAILED,
      FEED_ERRORS[FeedErrorCode.FEED_CACHE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Feed enrichment-related error classes
 */
export class IdentityFetchError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.IDENTITY_FETCH_FAILED,
      FEED_ERRORS[FeedErrorCode.IDENTITY_FETCH_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class SocialMetricsFetchError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED,
      FEED_ERRORS[FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class LikeStatusFetchError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.LIKE_STATUS_FETCH_FAILED,
      FEED_ERRORS[FeedErrorCode.LIKE_STATUS_FETCH_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FollowStatusFetchError extends AppError {
  constructor(cause?: Error) {
    super(
      FeedErrorCode.FOLLOW_STATUS_FETCH_FAILED,
      FEED_ERRORS[FeedErrorCode.FOLLOW_STATUS_FETCH_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

import { HttpStatus } from '@nestjs/common';
import { AppError, commonErrorMap, ErrorMap } from 'src/common/models';

export class FeedError extends AppError {
  constructor(
    code: string,
    metadata?: Record<string, string | number | boolean>,
  ) {
    super(code, metadata);
    this.name = 'FeedError';
  }
}

export class FeedGenerationError extends FeedError {
  constructor(metadata?: Record<string, string | number | boolean>) {
    super('feed.generation.failed', metadata);
    this.name = 'FeedGenerationError';
  }
}

export class FeedEnrichmentError extends FeedError {
  constructor(metadata?: Record<string, string | number | boolean>) {
    super('feed.enrichment.failed', metadata);
    this.name = 'FeedEnrichmentError';
  }
}

export class FeedCacheError extends FeedError {
  constructor(metadata?: Record<string, string | number | boolean>) {
    super('feed.cache.failed', metadata);
    this.name = 'FeedCacheError';
  }
}

export const feedErrorMap: ErrorMap = {
  ...commonErrorMap,
  feed: {
    personalized: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate personalized feed',
      },
    },
    following: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate following feed',
      },
    },
    trending: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate trending feed',
      },
    },
    latest: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate latest feed',
      },
    },
    generation: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate feed',
      },
    },
    enrichment: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to enrich feed items',
      },
    },
    cache: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to cache feed',
      },
    },
  },
};

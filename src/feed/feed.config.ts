import { registerAs } from '@nestjs/config';

export default registerAs('feed', () => ({
  cache: {
    disabled: process.env.FEED_CACHE_DISABLED === 'true',
    ttl: parseInt(process.env.FEED_CACHE_TTL || '16', 10), // seconds
    prefix: 'feed:',
  },
  pagination: {
    defaultLimit: parseInt(process.env.FEED_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.FEED_MAX_LIMIT || '100', 10),
  },
  enrichment: {
    batchSize: parseInt(process.env.FEED_ENRICHMENT_BATCH_SIZE || '50', 10),
  },
}));

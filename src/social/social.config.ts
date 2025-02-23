import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export interface SocialModuleConfig {
  redis: RedisOptions;
}

export default registerAs('social', (): SocialModuleConfig => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/1';
  const url = new URL(redisUrl);

  // Extract database number from pathname (remove leading '/')
  const db = url.pathname ? parseInt(url.pathname.substring(1), 10) : 0;

  // Extract credentials if present
  const password = url.password || undefined;
  const username = url.username || undefined;

  return {
    redis: {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      username,
      password,
      db,
    },
  };
});

import { version } from '../../../package.json';

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    name: process.env.APP_NAME || 'App',
    port: parseInt(process.env.APP_PORT, 10) || 8000,
    url: process.env.APP_URL || 'https://example.com',
    version,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  security: {
    shouldVerifyToken:
      String(process.env.VERIFY_TOKEN).toLowerCase() === 'true',
    jwtSecret: process.env.JWT_SECRET || '',
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL, 10) || 1,
      limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10000,
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  imageProxy: {
    url: process.env.IMGPROXY_URL || '',
    key: process.env.IMGPROXY_KEY || '',
    salt: process.env.IMGPROXY_SALT || '',
  },
});

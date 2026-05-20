import Redis from 'ioredis';
import { createLogger } from '@aicr/shared';

const logger = createLogger('repository-service:redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error in repository-service');
});

redis.on('connect', () => {
  logger.info('Connected to Redis for caching in repository-service');
});

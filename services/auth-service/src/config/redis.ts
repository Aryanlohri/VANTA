// ============================================
// Auth Service — Redis Client
// ============================================
//
// Single shared Redis connection for:
//  - OAuth state storage (replaces in-memory Map)
//  - One-time auth code storage (JWT exchange tokens)
//
// Using enableOfflineQueue: false so failures are surfaced immediately
// rather than silently queued and executed after reconnection.

import IORedis from 'ioredis';
import { createLogger } from '@aicr/shared';

const logger = createLogger('auth-service:redis');

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new IORedis(url, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));
    redis.on('close', () => logger.warn('Redis connection closed'));
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

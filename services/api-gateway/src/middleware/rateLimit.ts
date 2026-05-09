// ============================================
// API Gateway — Rate Limiter
// ============================================

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import IORedis from 'ioredis';
import { createLogger, RateLimitError } from '@aicr/shared';

const logger = createLogger('api-gateway:rate-limit');

// Use a shared Redis instance for distributed rate limiting
const redisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false, // Return error immediately if redis is down
  maxRetriesPerRequest: 1,
});

redisClient.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis connection error in rate limiter');
});

// General API rate limit: 100 requests per minute
const generalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100,
  duration: 60,
  keyPrefix: 'rate:general',
});

// Auth rate limit: 20 requests per minute (more lenient for OAuth flows)
const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 20,
  duration: 60,
  keyPrefix: 'rate:auth',
});

// AI review rate limit: 10 requests per minute (expensive operations)
const aiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 10,
  duration: 60,
  keyPrefix: 'rate:ai',
});

/**
 * Select the appropriate rate limiter based on the route and method.
 */
function getLimiter(req: { path: string; method: string }): RateLimiterRedis {
  if (req.path.startsWith('/api/auth')) return authLimiter;
  // IMPORTANT: Check req.method, NOT req.path.includes('POST').
  // The HTTP method is never part of the URL path — that check always returns false.
  if (req.method === 'POST' && req.path.startsWith('/api/reviews')) return aiLimiter;
  return generalLimiter;
}

/**
 * Rate limiting middleware.
 */
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const limiter = getLimiter(req);
  const key = (req as any).userId || req.ip || 'anonymous';

  try {
    const result = await limiter.consume(key);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': String(limiter.points),
      'X-RateLimit-Remaining': String(result.remainingPoints),
      'X-RateLimit-Reset': String(Math.ceil(result.msBeforeNext / 1000)),
    });

    next();
  } catch (rejRes: any) {
    // If rejRes is an Error, Redis failed. Fail open to avoid breaking API if Redis crashes.
    if (rejRes instanceof Error) {
      logger.error({ err: rejRes.message }, 'Rate limiter Redis failure — failing open');
      return next();
    }

    logger.warn({ key, path: req.path }, 'Rate limit exceeded');

    res.set({
      'Retry-After': String(Math.ceil(rejRes.msBeforeNext / 1000)),
      'X-RateLimit-Limit': String(limiter.points),
      'X-RateLimit-Remaining': '0',
    });

    const error = new RateLimitError();
    res.status(429).json(error.toJSON());
  }
}

// ============================================
// API Gateway — Rate Limiter
// ============================================

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger, RateLimitError } from '@aicr/shared';

const logger = createLogger('api-gateway:rate-limit');

// General API rate limit: 100 requests per minute
const generalLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
  keyPrefix: 'general',
});

// Auth rate limit: 20 requests per minute (more lenient for OAuth flows)
const authLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
  keyPrefix: 'auth',
});

// AI review rate limit: 10 requests per minute (expensive operations)
const aiLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  keyPrefix: 'ai',
});

/**
 * Select the appropriate rate limiter based on the route.
 */
function getLimiter(path: string): RateLimiterMemory {
  if (path.startsWith('/api/auth')) return authLimiter;
  if (path.startsWith('/api/reviews') && path.includes('POST')) return aiLimiter;
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
  const limiter = getLimiter(req.path);
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

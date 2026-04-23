// ============================================
// API Gateway — Auth Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { createLogger, AuthError, ERROR_CODES, SERVICE_PORTS } from '@aicr/shared';

const logger = createLogger('api-gateway:auth');

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

/** Routes that don't require authentication (matched against req.originalUrl) */
const PUBLIC_ROUTES = [
  '/api/auth/github',
  '/api/auth/github/callback',
  '/health',
];

/**
 * Gateway auth middleware.
 * Verifies JWT tokens by calling the auth service.
 * Note: This is mounted at /api, so req.path strips the /api prefix.
 * We use req.originalUrl to match the full path.
 */
export async function gatewayAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip auth for public routes — use originalUrl since Express strips mount path from req.path
  if (PUBLIC_ROUTES.some((route) => req.originalUrl.startsWith(route))) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with auth service
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify`, { token }, {
      timeout: 5000,
    });

    if (response.data.success) {
      // Forward user info to downstream services
      req.headers['x-user-id'] = response.data.data.userId;
      req.headers['x-username'] = response.data.data.username;
      next();
    } else {
      throw new AuthError('Invalid token', ERROR_CODES.INVALID_TOKEN);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    // Auth service might be down or token invalid
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || 'Authentication failed';
      return res.status(status).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message },
      });
    }

    logger.error({ err: error }, 'Auth middleware error');
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication check failed' },
    });
  }
}

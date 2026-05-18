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
  '/api/auth/exchange',   // one-time code exchange — public by design
  '/api/v1/webhooks',
  '/health',
];

/**
 * Headers that an external client MUST NOT be allowed to inject.
 *
 * x-user-id and x-username are set exclusively by this middleware after a
 * successful JWT verification. Allowing clients to pre-set them would let
 * any anonymous caller impersonate any user.
 *
 * We strip these BEFORE auth runs — even on public routes — so that no
 * downstream service can be tricked by a client-supplied value.
 */
const PROTECTED_HEADERS = ['x-user-id', 'x-username', 'x-user-role', 'x-internal-secret'];

/**
 * Lazily load and cache the INTERNAL_SERVICE_SECRET.
 * Called on the first authenticated request rather than at module load time,
 * so that dotenv has definitely run before we read process.env.
 *
 * If the secret is missing or is a placeholder the process exits — this is
 * intentional. We just defer the check to request-time rather than import-time
 * so the dotenv loading order doesn't matter.
 */
let _internalSecret: string | null = null;

function getInternalSecret(): string {
  if (_internalSecret) return _internalSecret;

  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!secret || secret.trim().length === 0) {
    logger.fatal(
      'INTERNAL_SERVICE_SECRET is not set. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
    process.exit(1);
  }

  if (secret === 'REPLACE_WITH_GENERATED_SECRET_BEFORE_PRODUCTION') {
    logger.fatal('INTERNAL_SERVICE_SECRET is still a placeholder. Set a real value.');
    process.exit(1);
  }

  _internalSecret = secret;
  return secret;
}

/**
 * Gateway auth middleware.
 *
 * Execution order:
 *   1. Strip any client-injected protected headers (prevents impersonation)
 *   2. Skip auth for public routes
 *   3. Extract and validate the Bearer token with the auth service
 *   4. Forward verified user identity to downstream services
 */
export async function gatewayAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Step 1: Always strip protected headers regardless of route.
  // This must happen before the public-route check so that even
  // unauthenticated webhook requests cannot carry spoofed user IDs downstream.
  for (const header of PROTECTED_HEADERS) {
    delete req.headers[header];
  }

  // Step 2: Skip JWT verification for public routes
  if (PUBLIC_ROUTES.some((route) => req.originalUrl.startsWith(route))) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with auth service, presenting our internal secret
    // so the auth service knows this is a legitimate inter-service call.
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/verify`,
      { token },
      {
        timeout: 5000,
        headers: {
          'x-internal-secret': getInternalSecret(),
        },
      }
    );

    if (response.data.success) {
      // Set verified user identity for downstream services.
      // These headers were stripped in Step 1, so the only source of truth
      // is this line — not the client.
      req.headers['x-user-id'] = response.data.data.userId;
      req.headers['x-username'] = response.data.data.username;
      req.headers['x-user-role'] = response.data.data.role;
      next();
    } else {
      throw new AuthError('Invalid token', ERROR_CODES.INVALID_TOKEN);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

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

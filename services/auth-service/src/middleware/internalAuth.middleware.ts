// ============================================
// Auth Service — Internal Service Auth Middleware
// ============================================
//
// PURPOSE: Protects endpoints that are ONLY meant to be called by other
// internal microservices (e.g., /auth/verify, /auth/token/:userId).
// External callers — including authenticated users — MUST NOT reach these.
//
// HOW IT WORKS:
//   Caller sends:  X-Internal-Secret: <INTERNAL_SERVICE_SECRET from env>
//   This middleware verifies using timingSafeEqual to prevent timing attacks.
//
// ANY CHANGE TO THIS FILE must be reviewed carefully. Do NOT weaken this check.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '@aicr/shared';

const logger = createLogger('auth-service:internal-auth');

let _internalSecretBuf: Buffer | null = null;

function getInternalSecretBuf(): Buffer {
  if (_internalSecretBuf) return _internalSecretBuf;

  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!secret || secret.trim().length === 0) {
    logger.fatal(
      'INTERNAL_SERVICE_SECRET is not set. ' +
      'This secret is MANDATORY for inter-service communication security. ' +
      'Set it in your environment and restart.'
    );
    process.exit(1);
  }

  if (
    secret === 'change_me_to_a_random_32_byte_hex_string' ||
    secret === 'REPLACE_WITH_GENERATED_SECRET_BEFORE_PRODUCTION'
  ) {
    logger.fatal(
      'INTERNAL_SERVICE_SECRET is still set to a placeholder value. ' +
      'Generate a real secret with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
    process.exit(1);
  }

  _internalSecretBuf = Buffer.from(secret);
  return _internalSecretBuf;
}

/**
 * Middleware that enforces the X-Internal-Secret header.
 * Returns 403 Forbidden for any request that does not carry the correct secret.
 * Uses crypto.timingSafeEqual to prevent timing-based side-channel attacks.
 */
export function requireInternalSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const provided = req.headers['x-internal-secret'];

  if (typeof provided !== 'string' || provided.trim().length === 0) {
    logger.warn(
      { path: req.path, ip: req.ip },
      'Internal endpoint accessed without X-Internal-Secret header — rejecting'
    );
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    });
    return;
  }

  const providedBuf = Buffer.from(provided);
  const secretBuf = getInternalSecretBuf();

  // Buffer lengths MUST match before calling timingSafeEqual, otherwise it throws.
  if (
    providedBuf.length !== secretBuf.length ||
    !crypto.timingSafeEqual(providedBuf, secretBuf)
  ) {
    logger.warn(
      { path: req.path, ip: req.ip },
      'Internal endpoint accessed with invalid X-Internal-Secret — rejecting'
    );
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    });
    return;
  }

  next();
}

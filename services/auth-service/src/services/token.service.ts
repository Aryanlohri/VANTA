// ============================================
// Auth Service — JWT Token Service
// ============================================

import jwt from 'jsonwebtoken';
import { createLogger, AuthError, ERROR_CODES } from '@aicr/shared';
import type { JwtPayload, AuthTokens } from '@aicr/shared';

const logger = createLogger('auth-service:jwt');

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change_me_to_a_random_64_char_hex_string') {
    logger.warn('Using default JWT secret — NOT SAFE FOR PRODUCTION');
    return 'dev-jwt-secret-not-for-production';
  }
  return secret;
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export const TokenService = {
  /**
   * Generate a JWT access token for a user.
   */
  generateTokens(userId: string, username: string): AuthTokens {
    const secret = getJwtSecret();
    const expiresInString = getExpiresIn();
    const expiresInSeconds = parseExpiresIn(expiresInString);

    const payload: JwtPayload = { userId, username };

    const accessToken = jwt.sign(payload, secret, {
      expiresIn: expiresInSeconds,
      issuer: 'aicr-auth-service',
      audience: 'aicr-platform',
    });

    return {
      accessToken,
      expiresIn: expiresInSeconds,
    };
  },

  /**
   * Verify and decode a JWT token.
   */
  verifyToken(token: string): JwtPayload {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret, {
        issuer: 'aicr-auth-service',
        audience: 'aicr-platform',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token has expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', ERROR_CODES.INVALID_TOKEN);
      }
      throw new AuthError('Token verification failed', ERROR_CODES.INVALID_TOKEN);
    }
  },
};

/**
 * Parse time string (e.g., '7d', '24h', '30m') to seconds.
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 604800; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 604800;
  }
}

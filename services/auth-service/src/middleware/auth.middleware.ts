// ============================================
// Auth Service — Auth Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AuthError, ERROR_CODES } from '@aicr/shared';
import { TokenService } from '../services/token.service';

/**
 * Middleware to verify JWT tokens on protected routes.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const payload = TokenService.verifyToken(token);

    // Attach user info to request
    (req as any).userId = payload.userId;
    (req as any).username = payload.username;

    next();
  } catch (error) {
    next(error);
  }
}

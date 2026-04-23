// ============================================
// API Gateway — Error Handler
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createLogger, AppError } from '@aicr/shared';

const logger = createLogger('api-gateway:error');

/**
 * Global error handler for the API gateway.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, status: err.statusCode }, err.message);
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Log unexpected errors with full stack trace
  logger.error({ err }, 'Unhandled error in API gateway');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

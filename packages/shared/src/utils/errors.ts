// ============================================
// Custom Error Classes
// AI Code Review Platform
// ============================================

import { ERROR_CODES } from '../constants';

/**
 * Base application error.
 * All custom errors extend this class.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize the error for API responses.
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/** 401 — Not authenticated */
export class AuthError extends AppError {
  constructor(message = 'Authentication required', code: string = ERROR_CODES.UNAUTHORIZED) {
    super(message, 401, code);
  }
}

/** 403 — Forbidden */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
}

/** 409 — Conflict / already exists */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, ERROR_CODES.ALREADY_EXISTS);
  }
}

/** 422 — Validation error */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

/** 429 — Rate limit exceeded */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, ERROR_CODES.RATE_LIMITED);
  }
}

/** 503 — Service unavailable */
export class ServiceUnavailableError extends AppError {
  constructor(serviceName: string) {
    super(
      `${serviceName} is currently unavailable`,
      503,
      ERROR_CODES.SERVICE_UNAVAILABLE
    );
  }
}

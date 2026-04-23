// ============================================
// Structured Logger (pino)
// AI Code Review Platform
// ============================================

import pino from 'pino';

/**
 * Create a logger instance for a service.
 * Uses structured JSON logging in production, pretty-print in development.
 */
export function createLogger(serviceName: string) {
  const isDev = process.env.NODE_ENV !== 'production';

  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    // Add base fields to every log entry
    base: {
      service: serviceName,
      env: process.env.NODE_ENV || 'development',
    },
  });
}

export type Logger = pino.Logger;

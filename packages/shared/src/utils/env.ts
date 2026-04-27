// ============================================
// Shared — Environment Variable Utilities
// ============================================

import { createLogger } from './logger';

const logger = createLogger('env');

/**
 * Require an environment variable to be set. If it's missing and no default
 * is provided, the process crashes immediately with a clear error message.
 * This prevents services from silently running with insecure or broken config.
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];

  if (value !== undefined && value !== '') {
    return value;
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  logger.fatal(`Missing required environment variable: ${name}`);
  process.exit(1);
}

/**
 * Read an optional environment variable with a default fallback.
 * Unlike requireEnv, this never crashes — use for non-critical config.
 */
export function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Returns true if the current NODE_ENV is 'production'.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

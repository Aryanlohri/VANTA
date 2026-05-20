import { describe, it, expect, vi } from 'vitest';
import { createLogger } from './logger';

describe('Logger', () => {
  it('should create a logger with the given service name', () => {
    const logger = createLogger('test-service');
    expect(logger).toBeDefined();
    
    // Check if the service name is present in the bindings/base configuration.
    // pino instances expose `bindings()` method that shows the default bindings.
    expect(logger.bindings().service).toBe('test-service');
  });

  it('should default to development environment if NODE_ENV is not set', () => {
    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    
    const logger = createLogger('env-test');
    expect(logger.bindings().env).toBe('development');
    
    process.env.NODE_ENV = originalEnv;
  });
});

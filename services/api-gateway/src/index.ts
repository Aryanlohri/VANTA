// ============================================
// API Gateway — Entry Point
// ============================================
//
// IMPORTANT: dotenv MUST be loaded before any other import that reads
// process.env at module-evaluation time (e.g. loadInternalSecret() in auth.ts).
// We use a dynamic require() here because ES module imports are hoisted and
// would execute before a top-level `import dotenv` + dotenv.config() can run.

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: '../../.env' });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, SERVICE_PORTS } from '@aicr/shared';
import { gatewayAuthMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const logger = createLogger('api-gateway');
const app = express();
const PORT = Number(process.env.API_GATEWAY_PORT) || SERVICE_PORTS.API_GATEWAY;

// ---- Global Middleware ----
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3010',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const jsonParser = express.json({ limit: '5mb' });

// Bypass express.json() for webhooks to preserve the raw body for HMAC verification
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api/v1/webhooks')) {
    next();
  } else {
    jsonParser(req, res, next);
  }
});

// Request correlation ID
app.use((req, _res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  req.headers['x-correlation-id'] = correlationId as string;
  next();
});

// Request logging
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    correlationId: req.headers['x-correlation-id'],
  }, 'Incoming request');
  next();
});

// ---- Health Check (public, before auth) ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- Auth Middleware ----
app.use('/api', gatewayAuthMiddleware);

// ---- Rate Limiting (after auth so x-user-role is available) ----
app.use(rateLimitMiddleware);

// ---- Service Routes ----
app.use('/api', routes);

// ---- Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service routes:');
  logger.info('  /api/auth    → Auth Service');
  logger.info('  /api/repos   → Repository Service');
  logger.info('  /api/reviews → Review Service');
});

// ---- Graceful Shutdown ----
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  process.exit(0);
});
process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down...');
  process.exit(0);
});

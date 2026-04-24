// ============================================
// Auth Service — Entry Point
// ============================================

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import { initDatabase, closeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';

const logger = createLogger('auth-service');
const app = express();
const PORT = Number(process.env.AUTH_SERVICE_PORT) || SERVICE_PORTS.AUTH_SERVICE;

// ---- Middleware ----
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3010',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// ---- Routes ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes); // triggered reload

// ---- Error Handler ----
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    return res.status(err.statusCode).json(err.toJSON());
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

// ---- Start Server ----
async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start auth service');
    process.exit(1);
  }
}

// ---- Graceful Shutdown ----
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  await closeDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

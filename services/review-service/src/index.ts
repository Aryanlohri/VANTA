import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import { initDatabase, closeDatabase } from './config/database';
import { initWebSocket } from './websocket';
import { initResultConsumer } from './queue/review.consumer';
import reviewRoutes from './routes/review.routes';

const logger = createLogger('review-service');
const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.REVIEW_SERVICE_PORT) || SERVICE_PORTS.REVIEW_SERVICE;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'review-service', timestamp: new Date().toISOString() });
});

app.use('/reviews', reviewRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) return res.status(err.statusCode).json(err.toJSON());
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

async function start() {
  await initDatabase();
  const io = initWebSocket(httpServer);
  initResultConsumer(io);
  httpServer.listen(PORT, () => logger.info(`Review service running on port ${PORT}`));
}

process.on('SIGTERM', async () => { await closeDatabase(); process.exit(0); });
process.on('SIGINT', async () => { await closeDatabase(); process.exit(0); });
start();

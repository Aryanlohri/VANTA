import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import { initDatabase, closeDatabase } from './config/database';
import repoRoutes from './routes/repo.routes';

const logger = createLogger('repository-service');
const app = express();
const PORT = Number(process.env.REPO_SERVICE_PORT) || SERVICE_PORTS.REPO_SERVICE;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'repository-service', timestamp: new Date().toISOString() });
});

app.use('/repos', repoRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => logger.info(`Repository service running on port ${PORT}`));
}

process.on('SIGTERM', async () => { await closeDatabase(); process.exit(0); });
process.on('SIGINT', async () => { await closeDatabase(); process.exit(0); });
start();

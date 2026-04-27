import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../../.env' });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, SERVICE_PORTS } from '@aicr/shared';
import { startAIWorker, stopAIWorker } from './queue/ai.worker';

const logger = createLogger('ai-service');
const app = express();
const PORT = Number(process.env.AI_SERVICE_PORT) || SERVICE_PORTS.AI_SERVICE;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-service',
    mockMode: process.env.AI_MOCK_MODE === 'true',
    timestamp: new Date().toISOString(),
  });
});

// Start the BullMQ worker
startAIWorker();

const server = app.listen(PORT, () => {
  logger.info(`AI service running on port ${PORT}`);
  logger.info(`Mock mode: ${process.env.AI_MOCK_MODE === 'true' ? 'ON' : 'OFF'}`);
});

// Graceful shutdown — drain worker, close Redis, then exit
async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close();
  await stopAIWorker();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

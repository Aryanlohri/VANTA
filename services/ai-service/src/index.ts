import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, SERVICE_PORTS } from '@aicr/shared';
import { startAIWorker } from './queue/ai.worker';

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

app.listen(PORT, () => {
  logger.info(`AI service running on port ${PORT}`);
  logger.info(`Mock mode: ${process.env.AI_MOCK_MODE === 'true' ? 'ON' : 'OFF'}`);
});

process.on('SIGTERM', () => { logger.info('Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { logger.info('Shutting down...'); process.exit(0); });

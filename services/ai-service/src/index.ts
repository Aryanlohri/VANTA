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

// Internal endpoint to receive webhook triggers
app.post('/internal/reviews/trigger', (req, res) => {
  const { github_repo_id, commit_sha, branch, type, repository_name, pr_number } = req.body;
  
  logger.info({
    github_repo_id,
    commit_sha,
    branch,
    type,
    repository_name,
    pr_number,
  }, 'Received webhook trigger for AI review');

  // TODO: Phase 1.2 - Fetch git diff, chunk files, and push to REVIEW_PROCESSING queue
  
  res.status(202).json({ success: true, message: 'Review job accepted' });
});

// Start the BullMQ worker
startAIWorker();

app.listen(PORT, () => {
  logger.info(`AI service running on port ${PORT}`);
  logger.info(`Mock mode: ${process.env.AI_MOCK_MODE === 'true' ? 'ON' : 'OFF'}`);
});

process.on('SIGTERM', () => { logger.info('Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { logger.info('Shutting down...'); process.exit(0); });

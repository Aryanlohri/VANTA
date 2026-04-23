import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES, createLogger } from '@aicr/shared';
import type { ReviewJobData, ReviewJobResult } from '@aicr/shared';
import { OpenAIService } from '../services/openai.service';

const logger = createLogger('ai-service:worker');

export function startAIWorker() {
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  // Queue to publish results back
  const resultsQueue = new Queue(QUEUE_NAMES.REVIEW_RESULTS, { connection });

  const worker = new Worker(
    QUEUE_NAMES.REVIEW_PROCESSING,
    async (job) => {
      const data: ReviewJobData = job.data;
      logger.info({ jobId: job.id, reviewId: data.reviewId, file: data.filePath }, 'Processing AI review');

      try {
        const result = await OpenAIService.reviewCode(data.content, data.language);

        // Publish result back to review service
        const jobResult: ReviewJobResult = {
          reviewId: data.reviewId,
          fileId: data.fileId,
          result,
        };

        await resultsQueue.add('review-result', jobResult, {
          removeOnComplete: 100,
          removeOnFail: 50,
        });

        logger.info({
          jobId: job.id,
          reviewId: data.reviewId,
          score: result.overall_score,
          issueCount: result.issues.length,
        }, 'AI review completed');

        return jobResult;
      } catch (error) {
        logger.error({ err: error, reviewId: data.reviewId }, 'AI review failed');
        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
      limiter: { max: 10, duration: 60000 }, // Max 10 jobs per minute (rate limit protection)
    }
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
  });

  logger.info('AI worker started — listening for review jobs');
  return worker;
}

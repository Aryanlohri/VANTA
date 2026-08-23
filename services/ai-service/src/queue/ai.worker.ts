import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { createHash } from 'crypto';
import { QUEUE_NAMES, createLogger } from '@aicr/shared';
import type { ReviewJobData, ReviewJobResult } from '@aicr/shared';
import { GeminiService } from '../services/gemini.service';

const logger = createLogger('ai-service:worker');
const CACHE_TTL_SECONDS = 3600; // 1 hour

let worker: Worker | null = null;
let connection: IORedis | null = null;
let resultsQueue: Queue | null = null;

export function startAIWorker() {
  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  // Queue to publish results back
  resultsQueue = new Queue(QUEUE_NAMES.REVIEW_RESULTS, { connection });

  worker = new Worker(
    QUEUE_NAMES.REVIEW_PROCESSING,
    async (job) => {
      const data: ReviewJobData = job.data;
      logger.info({ jobId: job.id, reviewId: data.reviewId, file: data.filePath }, 'Processing AI review');

      try {
        // ── Cache layer: hash content+language+mode to deduplicate reviews ──
        const cacheKey = `review_cache:${createHash('sha256').update(`${data.content}|${data.language || ''}|${data.mode || 'standard'}`).digest('hex')}`;

        const cached = await connection!.get(cacheKey);
        if (cached) {
          logger.info({ reviewId: data.reviewId, file: data.filePath }, 'Cache HIT — skipping Gemini call');
          const result = JSON.parse(cached);

          const jobResult: ReviewJobResult = {
            reviewId: data.reviewId,
            fileId: data.fileId,
            result,
          };

          await resultsQueue!.add('review-result', jobResult, {
            removeOnComplete: 100,
            removeOnFail: 50,
          });

          logger.info({
            jobId: job.id,
            reviewId: data.reviewId,
            score: result.overall_score,
            issueCount: result.issues.length,
          }, 'AI review completed (cached)');

          return jobResult;
        }

        // ── Cache MISS — call Gemini ────────────────────────────────────────
        const result = await GeminiService.reviewCode(data.content, data.language, data.mode, data.reviewId);

        // Publish result back to review service
        const jobResult: ReviewJobResult = {
          reviewId: data.reviewId,
          fileId: data.fileId,
          result,
        };

        await resultsQueue!.add('review-result', jobResult, {
          removeOnComplete: 100,
          removeOnFail: 50,
        });

        logger.info({
          jobId: job.id,
          reviewId: data.reviewId,
          score: result.overall_score,
          issueCount: result.issues.length,
        }, 'AI review completed');

        // Store in cache for future deduplication
        await connection!.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS).catch(
          (err: any) => logger.warn({ err }, 'Failed to write review cache')
        );

        return jobResult;
      } catch (error: any) {
        // Classify errors: don't retry permanent failures
        const isPermanent =
          error.message?.includes('Invalid AI response') ||
          error.message?.includes('GEMINI_API_KEY not configured');

        if (isPermanent) {
          logger.error({ err: error, reviewId: data.reviewId }, 'Permanent AI failure — will not retry');
          // Move to failed without further retries
          throw new Error(`PERMANENT: ${error.message}`);
        }

        logger.warn({ err: error, reviewId: data.reviewId, attempt: job.attemptsMade + 1 }, 'Retryable AI failure');
        throw error; // BullMQ will retry based on attempts/backoff config
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
    logger.error({ jobId: job?.id, err: err.message }, 'Job failed');
  });

  logger.info('AI worker started — listening for review jobs');
  return worker;
}

/**
 * Gracefully shut down the worker, draining active jobs before closing.
 * This is critical for Docker/Kubernetes to avoid dropping in-flight reviews.
 */
export async function stopAIWorker(): Promise<void> {
  logger.info('Shutting down AI worker...');

  if (worker) {
    await worker.close();
    logger.info('Worker closed');
  }

  if (resultsQueue) {
    await resultsQueue.close();
  }

  if (connection) {
    await connection.quit();
    logger.info('Redis connection closed');
  }
}

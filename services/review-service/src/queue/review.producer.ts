import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES, createLogger } from '@aicr/shared';
import type { ReviewJobData } from '@aicr/shared';

const logger = createLogger('review-service:producer');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const reviewQueue = new Queue(QUEUE_NAMES.REVIEW_PROCESSING, { connection });

export const ReviewProducer = {
  async enqueueFileReview(jobData: ReviewJobData): Promise<string> {
    const job = await reviewQueue.add('review-file', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    logger.info({ jobId: job.id, reviewId: jobData.reviewId, file: jobData.filePath }, 'Review job enqueued');
    return job.id!;
  },

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      reviewQueue.getWaitingCount(),
      reviewQueue.getActiveCount(),
      reviewQueue.getCompletedCount(),
      reviewQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  },
};

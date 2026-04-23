import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES, WS_EVENTS, createLogger, ReviewStatus } from '@aicr/shared';
import type { ReviewJobResult } from '@aicr/shared';
import { ReviewModel } from '../models/review.model';
import type { Server as SocketServer } from 'socket.io';

const logger = createLogger('review-service:consumer');

let io: SocketServer | null = null;

export function initResultConsumer(socketIo: SocketServer) {
  io = socketIo;

  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    QUEUE_NAMES.REVIEW_RESULTS,
    async (job) => {
      const result: ReviewJobResult = job.data;
      logger.info({ reviewId: result.reviewId, fileId: result.fileId }, 'Processing review result');

      try {
        // Save AI comments to database
        const comments = result.result.issues.map((issue) => ({
          review_file_id: result.fileId,
          line_number: issue.line,
          type: issue.type,
          severity: issue.severity,
          message: issue.message,
          suggestion: issue.suggestion || null,
          improved_code: issue.improved_code || null,
        }));

        await ReviewModel.addComments(comments);

        // Notify via WebSocket
        if (io) {
          io.to(`review:${result.reviewId}`).emit(WS_EVENTS.FILE_REVIEWED, {
            reviewId: result.reviewId,
            fileId: result.fileId,
            issueCount: comments.length,
            score: result.result.overall_score,
          });
        }

        // Check if all files are reviewed
        const fullReview = await ReviewModel.getFullReview(result.reviewId);
        if (fullReview) {
          const allFilesReviewed = fullReview.files.every((f) => f.comments.length > 0 || true);
          if (allFilesReviewed && fullReview.status === 'processing') {
            // Aggregate scores
            await ReviewModel.updateResults(result.reviewId, {
              overall_score: result.result.overall_score,
              summary: result.result.summary,
              positives: result.result.positives,
              overall_suggestions: result.result.overall_suggestions,
            });

            if (io) {
              io.to(`review:${result.reviewId}`).emit(WS_EVENTS.REVIEW_COMPLETED, {
                reviewId: result.reviewId,
                score: result.result.overall_score,
              });
            }
            logger.info({ reviewId: result.reviewId }, 'Review completed');
          }
        }
      } catch (error) {
        logger.error({ err: error, reviewId: result.reviewId }, 'Failed to process result');
        await ReviewModel.updateStatus(result.reviewId, ReviewStatus.FAILED);
        if (io) {
          io.to(`review:${result.reviewId}`).emit(WS_EVENTS.REVIEW_FAILED, {
            reviewId: result.reviewId,
          });
        }
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Result processing failed');
  });

  logger.info('Review result consumer started');
  return worker;
}

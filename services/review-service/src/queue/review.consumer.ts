import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { QUEUE_NAMES, WS_EVENTS, createLogger, ReviewStatus } from '@aicr/shared';
import type { ReviewJobResult } from '@aicr/shared';
import { ReviewModel } from '../models/review.model';
import type { Server as SocketServer } from 'socket.io';

const logger = createLogger('review-service:consumer');

const REPOSITORY_SERVICE_URL =
  process.env.REPOSITORY_SERVICE_URL || 'http://localhost:3002';

let io: SocketServer | null = null;
let worker: Worker | null = null;
let connection: IORedis | null = null;

/**
 * Track how many file results we've received per review.
 * Key = reviewId, Value = count of completed files.
 * This is safe because a single review-service instance processes all results.
 */
const reviewFileProgress = new Map<string, number>();

export function initResultConsumer(socketIo: SocketServer) {
  io = socketIo;

  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  worker = new Worker(
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

        // Increment the processed file counter for this review
        const currentCount = (reviewFileProgress.get(result.reviewId) || 0) + 1;
        reviewFileProgress.set(result.reviewId, currentCount);

        // Notify via WebSocket — per-file progress
        if (io) {
          io.to(`review:${result.reviewId}`).emit(WS_EVENTS.FILE_REVIEWED, {
            reviewId: result.reviewId,
            fileId: result.fileId,
            issueCount: comments.length,
            score: result.result.overall_score,
          });
        }

        // Check if ALL files for this review are done
        const fullReview = await ReviewModel.getFullReview(result.reviewId);
        if (fullReview && fullReview.status === 'processing') {
          const totalFiles = fullReview.files.length;
          const processedFiles = currentCount;

          logger.info({ reviewId: result.reviewId, processedFiles, totalFiles }, 'Review progress');

          if (processedFiles >= totalFiles) {
            // All files processed — aggregate scores and mark complete
            // Calculate average score across all file results
            const allComments = fullReview.files.flatMap((f) => f.comments || []);
            const criticalCount = allComments.filter((c: any) => c.severity === 'critical').length;
            const majorCount = allComments.filter((c: any) => c.severity === 'major').length;

            // Use the latest result's score as the overall (AI already weighs it)
            // Adjust down if there are critical/major issues across files
            let finalScore = result.result.overall_score;
            finalScore = Math.max(0, finalScore - (criticalCount * 5) - (majorCount * 2));

            await ReviewModel.updateResults(result.reviewId, {
              overall_score: finalScore,
              summary: result.result.summary,
              positives: result.result.positives,
              overall_suggestions: result.result.overall_suggestions,
            });

            // Clean up the progress tracker
            reviewFileProgress.delete(result.reviewId);

            // Post back to GitHub if this is a PR review
            if (fullReview.pull_request_number && fullReview.commit_sha) {
              try {
                // Map comments to GitHub's format
                const githubComments = allComments.map((c: any) => {
                  const file = fullReview.files.find((f: any) => f.id === c.review_file_id);
                  return {
                    path: file?.file_path,
                    line: c.line_number,
                    body: `**[${c.severity.toUpperCase()}] ${c.type}**\n${c.message}\n\n${
                      c.suggestion ? `*Suggestion:*\n${c.suggestion}\n` : ''
                    }${
                      c.improved_code ? `\n\`\`\`${file?.language || ''}\n${c.improved_code}\n\`\`\`` : ''
                    }`,
                  };
                });

                await axios.post(
                  `${REPOSITORY_SERVICE_URL}/repos/${fullReview.repo_id}/reviews`,
                  {
                    prNumber: fullReview.pull_request_number,
                    commitSha: fullReview.commit_sha,
                    comments: githubComments,
                  },
                  { headers: { 'x-user-id': fullReview.user_id } }
                );
                logger.info({ reviewId: result.reviewId }, 'Successfully posted PR review to GitHub');
              } catch (githubErr: any) {
                logger.error({ err: githubErr.response?.data || githubErr.message, reviewId: result.reviewId }, 'Failed to post review to GitHub');
              }
            }

            if (io) {
              io.to(`review:${result.reviewId}`).emit(WS_EVENTS.REVIEW_COMPLETED, {
                reviewId: result.reviewId,
                score: finalScore,
              });
            }
            logger.info({ reviewId: result.reviewId, score: finalScore, totalIssues: allComments.length }, 'Review completed');
          }
        }
      } catch (error) {
        logger.error({ err: error, reviewId: result.reviewId }, 'Failed to process result');
        await ReviewModel.updateStatus(result.reviewId, ReviewStatus.FAILED);
        reviewFileProgress.delete(result.reviewId);
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
    logger.error({ jobId: job?.id, err: err.message }, 'Result processing failed');
  });

  logger.info('Review result consumer started');
  return worker;
}

/**
 * Gracefully shut down the result consumer.
 */
export async function stopResultConsumer(): Promise<void> {
  if (worker) {
    await worker.close();
  }
  if (connection) {
    await connection.quit();
  }
  logger.info('Result consumer shut down');
}

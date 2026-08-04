import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import {
  createLogger,
  AppError,
  ValidationError,
  NotFoundError,
  ReviewStatus,
  ERROR_CODES,
  MAX_FILES_PER_REVIEW,
  SERVICE_PORTS,
} from '@aicr/shared';
import { ReviewModel } from '../models/review.model';
import { ReviewProducer } from '../queue/review.producer';

const logger = createLogger('review-service:controller');

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

let _internalSecret: string | null = null;

function getInternalSecret(): string {
  if (_internalSecret) return _internalSecret;
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || secret === 'REPLACE_WITH_GENERATED_SECRET_BEFORE_PRODUCTION') {
    logger.fatal(
      'INTERNAL_SERVICE_SECRET is not configured. ' +
      'Review service cannot verify subscription limits.'
    );
    process.exit(1);
  }
  _internalSecret = secret;
  return secret;
}

/**
 * Check and atomically increment the subscription usage counter for a user.
 * Returns { allowed: true } if the user is within their plan limit.
 * Returns { allowed: false, used, limit } if they have exceeded it.
 *
 * The increment is done server-side in the auth-service using an atomic
 * SQL UPDATE with a conditional WHERE clause to prevent race conditions.
 */
async function checkAndIncrementUsage(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  try {
    const res = await axios.post(
      `${AUTH_SERVICE_URL}/payment/usage/increment`,
      { userId },
      {
        timeout: 5000,
        headers: { 'x-internal-secret': getInternalSecret() },
      }
    );
    return res.data.data;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to check subscription usage');
    // Fail closed — if we can't verify the limit, reject the request
    throw new AppError(
      'Unable to verify subscription limits. Please try again.',
      503,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

export const ReviewController = {
  /**
   * POST /reviews
   * Create a new code review.
   *
   * SECURITY:
   *   - Subscription limit is checked AND incremented atomically before any
   *     DB write or queue job is created. This prevents limit bypass via
   *     concurrent requests.
   *   - Fails closed if the subscription service is unavailable.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const { repo_id, title, mode, files, pull_request_number, commit_sha } = req.body;
      if (!repo_id || !title || !files || !Array.isArray(files) || files.length === 0) {
        throw new ValidationError('Required: repo_id, title, files[]');
      }
      if (files.length > MAX_FILES_PER_REVIEW) {
        throw new ValidationError(`Maximum ${MAX_FILES_PER_REVIEW} files per review`);
      }

      // ── Subscription limit gate (atomic — prevents race conditions) ───────
      // Admins are exempt — they have unrestricted review creation.
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'admin') {
        const usageCheck = await checkAndIncrementUsage(userId);

        if (!usageCheck.allowed) {
          logger.warn(
            { userId, used: usageCheck.used, limit: usageCheck.limit },
            'Review creation rejected — subscription limit reached'
          );
          return res.status(429).json({
            success: false,
            error: {
              code: 'USAGE_LIMIT_EXCEEDED',
              message: `Quota exhausted. You have used ${usageCheck.used} of ${usageCheck.limit} reviews in this billing period.`,
            },
          });
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      // Create review record
      const review = await ReviewModel.create({
        repo_id,
        user_id: userId,
        title,
        mode: mode || 'standard',
        pull_request_number,
        commit_sha,
      });

      // Add files and enqueue AI jobs
      for (const file of files) {
        const reviewFile = await ReviewModel.addFile({
          review_id: review.id,
          file_path: file.path,
          content: file.content,
          language: file.language || null,
        });

        await ReviewProducer.enqueueFileReview({
          reviewId: review.id,
          fileId: reviewFile.id,
          filePath: file.path,
          content: file.content,
          language: file.language || null,
          mode: mode || 'standard',
        });
      }

      await ReviewModel.updateStatus(review.id, ReviewStatus.PROCESSING);
      logger.info(
        { reviewId: review.id, fileCount: files.length, userId },
        'Review submitted'
      );

      res.status(201).json({ success: true, data: { ...review, status: 'processing' } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reviews
   * List reviews for the authenticated user.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ReviewModel.findByUserId(userId, limit, offset),
        ReviewModel.countByUserId(userId),
      ]);

      res.json({
        success: true,
        data: reviews,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reviews/:id
   * Get a single review by ID.
   * FIXED: Ownership enforced — users can only fetch their own reviews.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;

      const review = await ReviewModel.getFullReview(id);

      if (!review) throw new NotFoundError('Review', id);

      // Ownership check — return 404 rather than 403 to avoid confirming existence
      if (review.user_id !== userId) {
        throw new NotFoundError('Review', id);
      }

      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /reviews/:id
   * Delete a review.
   * Ownership is enforced at the DB layer (WHERE id AND user_id).
   */
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const deleted = await ReviewModel.deleteReview(id, userId);
      if (!deleted) throw new NotFoundError('Review', id);

      res.json({ success: true, data: { message: 'Review deleted' } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /reviews/:id/github
   * Manually post a completed review to GitHub as a PR comment.
   */
  async postToGitHub(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const fullReview = await ReviewModel.getFullReview(id);

      if (!fullReview || fullReview.user_id !== userId) {
        throw new NotFoundError('Review', id);
      }

      if (fullReview.status !== ReviewStatus.COMPLETED) {
        throw new ValidationError('Review must be completed before posting to GitHub');
      }

      if (!fullReview.pull_request_number || !fullReview.commit_sha) {
        throw new ValidationError('Review is not associated with a Pull Request');
      }

      const allComments = fullReview.files.flatMap((f) => f.comments || []);
      
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

      const REPOSITORY_SERVICE_URL = process.env.REPOSITORY_SERVICE_URL || `http://localhost:${SERVICE_PORTS.REPO_SERVICE}`;

      const response = await axios.post(
        `${REPOSITORY_SERVICE_URL}/repos/${fullReview.repo_id}/reviews`,
        {
          prNumber: fullReview.pull_request_number,
          commitSha: fullReview.commit_sha,
          comments: githubComments,
        },
        { headers: { 'x-user-id': userId } }
      );

      logger.info({ reviewId: id }, 'Successfully posted PR review to GitHub manually');
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      logger.error({ err: error.response?.data || error.message }, 'Failed to post manual review to GitHub');
      next(error);
    }
  },

  /**
   * GET /reviews/admin/metrics
   * Returns review platform metrics.
   * Protected: requires admin role.
   */
  async getAdminMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const db = require('../config/database').getDb();
      
      const totalReviews = await db('reviews.reviews').count('id as count').first();
      const recentReviews = await db('reviews.reviews')
        .where('created_at', '>=', db.raw("now() - interval '24 hours'"))
        .count('id as count')
        .first();

      res.json({
        success: true,
        data: {
          totalReviews: parseInt(totalReviews.count, 10),
          recentReviews: parseInt(recentReviews.count, 10),
        }
      });
    } catch (error) {
      next(error);
    }
  },
};

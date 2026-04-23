import { Request, Response, NextFunction } from 'express';
import { createLogger, AppError, ValidationError, NotFoundError, ReviewStatus, ERROR_CODES, MAX_FILES_PER_REVIEW } from '@aicr/shared';
import { ReviewModel } from '../models/review.model';
import { ReviewProducer } from '../queue/review.producer';

const logger = createLogger('review-service:controller');

export const ReviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const { repo_id, title, files } = req.body;
      if (!repo_id || !title || !files || !Array.isArray(files) || files.length === 0) {
        throw new ValidationError('Required: repo_id, title, files[]');
      }
      if (files.length > MAX_FILES_PER_REVIEW) {
        throw new ValidationError(`Maximum ${MAX_FILES_PER_REVIEW} files per review`);
      }

      // Create review
      const review = await ReviewModel.create({ repo_id, user_id: userId, title });

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
        });
      }

      await ReviewModel.updateStatus(review.id, ReviewStatus.PROCESSING);
      logger.info({ reviewId: review.id, fileCount: files.length }, 'Review submitted');

      res.status(201).json({ success: true, data: { ...review, status: 'processing' } });
    } catch (error) {
      next(error);
    }
  },

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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const review = await ReviewModel.getFullReview(id);
      if (!review) throw new NotFoundError('Review', id);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const id = req.params.id as string;
      const deleted = await ReviewModel.deleteReview(id, userId);
      if (!deleted) throw new NotFoundError('Review', id);
      res.json({ success: true, data: { message: 'Review deleted' } });
    } catch (error) {
      next(error);
    }
  },
};

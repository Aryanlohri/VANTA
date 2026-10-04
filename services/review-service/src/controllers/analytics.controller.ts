import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_CODES } from '@aicr/shared';

export const AnalyticsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const db = require('../config/database').getDb();

      // Aggregate issues caught by type
      const issuesQuery = await db('reviews.review_comments')
        .join('reviews.review_files', 'reviews.review_comments.review_file_id', 'reviews.review_files.id')
        .join('reviews.reviews', 'reviews.review_files.review_id', 'reviews.reviews.id')
        .where('reviews.reviews.user_id', userId)
        .select('reviews.review_comments.type')
        .count('* as count')
        .groupBy('reviews.review_comments.type');

      // Overall stats
      const reviewsData = await db('reviews.reviews')
        .where('user_id', userId)
        .count('id as total_reviews')
        .avg('overall_score as avg_score');

      // Activity over last 30 days
      const recentActivity = await db('reviews.reviews')
        .where('user_id', userId)
        .select(db.raw("date_trunc('day', created_at) as date"))
        .count('id as count')
        .groupByRaw("date_trunc('day', created_at)")
        .orderBy('date', 'desc')
        .limit(30);

      const issuesCount = issuesQuery.reduce((acc: any, row: any) => {
        acc[row.type] = parseInt(row.count, 10);
        return acc;
      }, {});

      const totalIssues = Object.values(issuesCount).reduce((a: any, b: any) => a + b, 0);

      res.json({
        success: true,
        data: {
          totalReviews: parseInt(reviewsData[0].total_reviews, 10) || 0,
          avgScore: Math.round(reviewsData[0].avg_score || 0),
          totalIssues,
          issuesBreakdown: issuesCount,
          recentActivity: recentActivity.map((r: any) => ({
            date: r.date,
            count: parseInt(r.count, 10)
          })).reverse() // chronological order for charts
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getRepoStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const db = require('../config/database').getDb();

      // Get stats grouped by repo_id
      const stats = await db('reviews.reviews')
        .where('user_id', userId)
        .select('repo_id')
        .max('created_at as last_review_date')
        .avg('overall_score as avg_score')
        .count('id as review_count')
        .groupBy('repo_id');

      // Get open issues grouped by repo_id (just counting all comments as "issues" for now)
      const issues = await db('reviews.review_comments')
        .join('reviews.review_files', 'reviews.review_comments.review_file_id', 'reviews.review_files.id')
        .join('reviews.reviews', 'reviews.review_files.review_id', 'reviews.reviews.id')
        .where('reviews.reviews.user_id', userId)
        .select('reviews.reviews.repo_id')
        .count('* as issues_count')
        .groupBy('reviews.reviews.repo_id');

      const issuesMap = issues.reduce((acc: any, row: any) => {
        acc[row.repo_id] = parseInt(row.issues_count, 10);
        return acc;
      }, {});

      const formattedStats = stats.reduce((acc: any, row: any) => {
        acc[row.repo_id] = {
          lastReviewDate: row.last_review_date,
          avgScore: Math.round(row.avg_score || 0),
          reviewCount: parseInt(row.review_count, 10),
          openIssues: issuesMap[row.repo_id] || 0
        };
        return acc;
      }, {});

      res.json({ success: true, data: formattedStats });
    } catch (error) {
      next(error);
    }
  }
};

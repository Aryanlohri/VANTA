import { getDb } from '../config/database';
import type { Review, ReviewFile, ReviewComment, ReviewWithFiles, ReviewStatus } from '@aicr/shared';

const REVIEWS = 'reviews.reviews';
const FILES = 'reviews.review_files';
const COMMENTS = 'reviews.review_comments';

export const ReviewModel = {
  async create(data: { repo_id: string; user_id: string; title: string }): Promise<Review> {
    const [review] = await getDb()(REVIEWS).insert(data).returning('*');
    return review;
  },

  async findById(id: string): Promise<Review | null> {
    return (await getDb()(REVIEWS).where({ id }).first()) || null;
  },

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<Review[]> {
    return getDb()(REVIEWS).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);
  },

  async updateStatus(id: string, status: ReviewStatus): Promise<void> {
    await getDb()(REVIEWS).where({ id }).update({ status, updated_at: getDb().fn.now() });
  },

  async updateResults(id: string, data: {
    overall_score: number; summary: string; positives: string[]; overall_suggestions: string[];
  }): Promise<void> {
    await getDb()(REVIEWS).where({ id }).update({
      ...data, status: 'completed', updated_at: getDb().fn.now(),
    });
  },

  async addFile(data: { review_id: string; file_path: string; content: string; language: string | null }): Promise<ReviewFile> {
    const [file] = await getDb()(FILES).insert(data).returning('*');
    return file;
  },

  async addComments(comments: Array<{
    review_file_id: string; line_number: number; type: string; severity: string;
    message: string; suggestion: string | null; improved_code: string | null;
  }>): Promise<ReviewComment[]> {
    if (comments.length === 0) return [];
    return getDb()(COMMENTS).insert(comments).returning('*');
  },

  async getFullReview(id: string): Promise<ReviewWithFiles | null> {
    const review = await getDb()(REVIEWS).where({ id }).first();
    if (!review) return null;

    const files = await getDb()(FILES).where({ review_id: id });
    const fileIds = files.map((f: any) => f.id);

    const comments = fileIds.length > 0
      ? await getDb()(COMMENTS).whereIn('review_file_id', fileIds)
      : [];

    const filesWithComments = files.map((file: any) => ({
      ...file,
      comments: comments.filter((c: any) => c.review_file_id === file.id),
    }));

    return { ...review, files: filesWithComments };
  },

  async deleteReview(id: string, userId: string): Promise<boolean> {
    const affected = await getDb()(REVIEWS).where({ id, user_id: userId }).del();
    return affected > 0;
  },

  async countByUserId(userId: string): Promise<number> {
    const result = await getDb()(REVIEWS).where({ user_id: userId }).count('id as count').first();
    return Number(result?.count) || 0;
  },
};

// ============================================
// Repository Service — Repository Model
// ============================================

import { getDb } from '../config/database';
import type { Repository } from '@aicr/shared';

const TABLE = 'repositories.repositories';

export const RepositoryModel = {
  /**
   * Find all connected repositories for a user.
   */
  async findByUserId(userId: string): Promise<Repository[]> {
    return getDb()(TABLE)
      .where({ user_id: userId, is_connected: true })
      .orderBy('updated_at', 'desc');
  },

  /**
   * Find a repository by ID.
   */
  async findById(id: string): Promise<Repository | null> {
    const repo = await getDb()(TABLE).where({ id }).first();
    return repo || null;
  },

  /**
   * Find a repository by user and GitHub repo ID.
   */
  async findByGitHubId(userId: string, githubRepoId: number): Promise<Repository | null> {
    const repo = await getDb()(TABLE)
      .where({ user_id: userId, github_repo_id: githubRepoId })
      .first();
    return repo || null;
  },

  /**
   * Connect (create) a new repository.
   */
  async connect(data: {
    user_id: string;
    github_repo_id: number;
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    default_branch: string;
    is_private: boolean;
  }): Promise<Repository> {
    // Check if already exists (might be reconnecting)
    const existing = await RepositoryModel.findByGitHubId(data.user_id, data.github_repo_id);

    if (existing) {
      // Re-connect and update
      const [updated] = await getDb()(TABLE)
        .where({ id: existing.id })
        .update({
          ...data,
          is_connected: true,
          updated_at: getDb().fn.now(),
        })
        .returning('*');
      return updated;
    }

    const [repo] = await getDb()(TABLE).insert(data).returning('*');
    return repo;
  },

  /**
   * Disconnect a repository (soft delete).
   */
  async disconnect(id: string, userId: string): Promise<boolean> {
    const affected = await getDb()(TABLE)
      .where({ id, user_id: userId })
      .update({ is_connected: false, updated_at: getDb().fn.now() });
    return affected > 0;
  },

  /**
   * Count connected repositories for a user.
   */
  async countByUserId(userId: string): Promise<number> {
    const result = await getDb()(TABLE)
      .where({ user_id: userId, is_connected: true })
      .count('id as count')
      .first();
    return Number(result?.count) || 0;
  },
};

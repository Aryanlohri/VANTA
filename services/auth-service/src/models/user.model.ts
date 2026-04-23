// ============================================
// Auth Service — User Model
// ============================================

import { getDb } from '../config/database';
import type { User, UserPublic } from '@aicr/shared';

const TABLE = 'auth.users';

/**
 * User data access layer.
 */
export const UserModel = {
  /**
   * Find a user by their internal ID.
   */
  async findById(id: string): Promise<User | null> {
    const user = await getDb()(TABLE).where({ id }).first();
    return user || null;
  },

  /**
   * Find a user by their GitHub ID.
   */
  async findByGitHubId(githubId: number): Promise<User | null> {
    const user = await getDb()(TABLE).where({ github_id: githubId }).first();
    return user || null;
  },

  /**
   * Find a user by username.
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await getDb()(TABLE).where({ username }).first();
    return user || null;
  },

  /**
   * Create a new user or update if GitHub ID already exists (upsert).
   * This handles the case where a user logs in again after profile changes.
   */
  async upsertFromGitHub(data: {
    github_id: number;
    username: string;
    email: string | null;
    avatar_url: string;
    access_token_encrypted: string;
  }): Promise<User> {
    const existing = await UserModel.findByGitHubId(data.github_id);

    if (existing) {
      // Update existing user
      const [updated] = await getDb()(TABLE)
        .where({ id: existing.id })
        .update({
          username: data.username,
          email: data.email,
          avatar_url: data.avatar_url,
          access_token_encrypted: data.access_token_encrypted,
          updated_at: getDb().fn.now(),
        })
        .returning('*');
      return updated;
    }

    // Create new user
    const [user] = await getDb()(TABLE).insert(data).returning('*');
    return user;
  },

  /**
   * Update a user's access token.
   */
  async updateAccessToken(id: string, encryptedToken: string): Promise<void> {
    await getDb()(TABLE).where({ id }).update({
      access_token_encrypted: encryptedToken,
      updated_at: getDb().fn.now(),
    });
  },

  /**
   * Get the encrypted access token for a user.
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const row = await getDb()(TABLE)
      .where({ id: userId })
      .select('access_token_encrypted')
      .first();
    return row?.access_token_encrypted || null;
  },

  /**
   * Strip sensitive fields for public API responses.
   */
  toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
  },
};

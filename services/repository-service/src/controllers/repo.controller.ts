// ============================================
// Repository Service — Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createLogger, AppError, ValidationError, NotFoundError, ERROR_CODES } from '@aicr/shared';
import { RepositoryModel } from '../models/repository.model';
import { GitHubApi } from '../services/github.api';

const logger = createLogger('repository-service:controller');

/**
 * Retrieve a repository and enforce ownership.
 *
 * Returns the repository only if it belongs to `userId`.
 * Throws NotFoundError if the repo doesn't exist OR belongs to another user.
 * We deliberately return 404 (not 403) to avoid leaking whether an ID exists.
 */
async function getOwnedRepo(id: string, userId: string) {
  const repo = await RepositoryModel.findByIdAndUserId(id, userId);
  if (!repo) {
    throw new NotFoundError('Repository', id);
  }
  return repo;
}

export const RepoController = {
  /**
   * GET /repos
   * List all connected repositories for the authenticated user.
   */
  async listConnected(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const repos = await RepositoryModel.findByUserId(userId);

      res.json({ success: true, data: repos });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/github
   * List all GitHub repos available to the user (for the connect flow).
   */
  async listGitHubRepos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const page = Number(req.query.page) || 1;
      const { repos, hasMore } = await GitHubApi.listUserRepos(userId, page);

      // Mark repos that are already connected
      const connected = await RepositoryModel.findByUserId(userId);
      const connectedIds = new Set(connected.map((r) => Number(r.github_repo_id)));

      const reposWithStatus = repos.map((repo) => ({
        ...repo,
        is_connected: connectedIds.has(repo.id),
      }));

      res.json({
        success: true,
        data: reposWithStatus,
        meta: { page, hasMore },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /repos/connect
   * Connect a GitHub repository.
   */
  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const { github_repo_id, name, full_name, description, language, default_branch, is_private } = req.body;

      if (!github_repo_id || !name || !full_name) {
        throw new ValidationError('Missing required fields: github_repo_id, name, full_name');
      }

      // Validate full_name format to prevent injection into webhook URL
      if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(full_name)) {
        throw new ValidationError('Invalid repository full_name format');
      }

      let webhook_id: number | null = null;
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;

      if (webhookSecret && webhookBaseUrl) {
        const [owner, repoName] = full_name.split('/');
        const webhookUrl = `${webhookBaseUrl}/api/v1/webhooks/github`;
        try {
          webhook_id = await GitHubApi.createWebhook(userId, owner, repoName, webhookUrl, webhookSecret);
          logger.info({ webhook_id, full_name }, 'Webhook created successfully');
        } catch (e: any) {
          logger.warn({ full_name, err: e.message }, 'Failed to create webhook during connection. Proceeding anyway.');
        }
      }

      const repo = await RepositoryModel.connect({
        user_id: userId,
        github_repo_id,
        name,
        full_name,
        description: description || null,
        language: language || null,
        default_branch: default_branch || 'main',
        is_private: is_private || false,
        webhook_id,
      });

      logger.info({ repoId: repo.id, fullName: full_name }, 'Repository connected');

      res.status(201).json({ success: true, data: repo });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /repos/:id
   * Disconnect a repository.
   * Ownership is enforced — users can only disconnect their own repos.
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const success = await RepositoryModel.disconnect(id, userId);

      if (!success) {
        // 404 — never reveal whether ID belongs to another user
        throw new NotFoundError('Repository', id);
      }

      logger.info({ repoId: id }, 'Repository disconnected');

      res.json({ success: true, data: { message: 'Repository disconnected' } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/:id
   * Get a single repository by ID.
   * FIXED: Now enforces ownership — cannot read another user's repo.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const repo = await getOwnedRepo(id, userId);

      res.json({ success: true, data: repo });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/:id/files
   * List files in a repository.
   * FIXED: Ownership enforced — uses repo owner's identity, not caller's, for GitHub API.
   */
  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      // getOwnedRepo throws 404 if the repo doesn't belong to this user
      const repo = await getOwnedRepo(id, userId);

      const [owner, repoName] = repo.full_name.split('/');
      const branch = (req.query.branch as string) || repo.default_branch;

      // userId is verified — it matches repo.user_id via getOwnedRepo
      const files = await GitHubApi.getRepoTree(userId, owner, repoName, branch);

      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/:id/content/*
   * Get file content from a repository.
   * FIXED: Ownership enforced. Path is validated to prevent path traversal.
   */
  async getFileContent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const filePath = req.params[0] as string;

      // Prevent path traversal attacks
      if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
        throw new ValidationError('Invalid file path');
      }

      const repo = await getOwnedRepo(id, userId);

      const [owner, repoName] = repo.full_name.split('/');
      const ref = req.query.ref as string | undefined;

      const content = await GitHubApi.getFileContent(userId, owner, repoName, filePath, ref);

      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /repos/:id/reviews
   * Create a PR review on GitHub with inline comments.
   * Internal endpoint — called by the review-service.
   * Ownership still enforced to ensure the review-service cannot post to repos
   * belonging to other users via a bug or misconfiguration.
   */
  async createPullRequestReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const { prNumber, commitSha, comments } = req.body;

      if (!prNumber || !commitSha || !comments || !Array.isArray(comments)) {
        throw new ValidationError('Missing required fields: prNumber, commitSha, comments[]');
      }

      const repo = await getOwnedRepo(id, userId);

      const [owner, repoName] = repo.full_name.split('/');

      const reviewData = await GitHubApi.createPullRequestReview(
        userId,
        owner,
        repoName,
        prNumber,
        commitSha,
        comments
      );

      res.status(201).json({ success: true, data: reviewData });
    } catch (error) {
      next(error);
    }
  },
};

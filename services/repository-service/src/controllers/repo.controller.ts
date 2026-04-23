// ============================================
// Repository Service — Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createLogger, AppError, ValidationError, NotFoundError, ERROR_CODES } from '@aicr/shared';
import { RepositoryModel } from '../models/repository.model';
import { GitHubApi } from '../services/github.api';

const logger = createLogger('repository-service:controller');

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

      const repo = await RepositoryModel.connect({
        user_id: userId,
        github_repo_id,
        name,
        full_name,
        description: description || null,
        language: language || null,
        default_branch: default_branch || 'main',
        is_private: is_private || false,
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
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const success = await RepositoryModel.disconnect(id, userId);

      if (!success) {
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
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const repo = await RepositoryModel.findById(id);

      if (!repo) {
        throw new NotFoundError('Repository', id);
      }

      res.json({ success: true, data: repo });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/:id/files
   * List files in a repository.
   */
  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const repo = await RepositoryModel.findById(id);

      if (!repo) {
        throw new NotFoundError('Repository', id);
      }

      const [owner, repoName] = repo.full_name.split('/');
      const branch = (req.query.branch as string) || repo.default_branch;

      const files = await GitHubApi.getRepoTree(userId, owner, repoName, branch);

      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /repos/:id/files/:path(*)
   * Get file content from a repository.
   */
  async getFileContent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new AppError('User ID required', 401, ERROR_CODES.UNAUTHORIZED);

      const id = req.params.id as string;
      const filePath = req.params[0] as string; // Wildcard path

      const repo = await RepositoryModel.findById(id);
      if (!repo) throw new NotFoundError('Repository', id);

      const [owner, repoName] = repo.full_name.split('/');
      const ref = req.query.ref as string | undefined;

      const content = await GitHubApi.getFileContent(userId, owner, repoName, filePath, ref);

      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  },
};

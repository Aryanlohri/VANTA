// ============================================
// Repository Service — GitHub API Integration
// ============================================

import axios from 'axios';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import type { GitHubRepo, FileTreeItem, FileContent } from '@aicr/shared';

const logger = createLogger('repository-service:github-api');

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

/**
 * Get the GitHub access token for a user from the auth service.
 */
async function getGitHubToken(userId: string): Promise<string> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/token/${userId}`, {
      timeout: 5000,
    });

    if (response.data.success) {
      return response.data.data.token;
    }

    throw new AppError('Failed to get GitHub token', 500);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Failed to fetch GitHub token from auth service');
    throw new AppError('Unable to authenticate with GitHub', 500);
  }
}

/**
 * Create an authenticated GitHub API client.
 */
function createGitHubClient(token: string) {
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    timeout: 15000,
  });
}

export const GitHubApi = {
  /**
   * List all repositories accessible by the authenticated user.
   */
  async listUserRepos(userId: string, page = 1, perPage = 30): Promise<{
    repos: GitHubRepo[];
    hasMore: boolean;
  }> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    const response = await client.get('/user/repos', {
      params: {
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page,
        type: 'all',
      },
    });

    const repos: GitHubRepo[] = response.data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      default_branch: repo.default_branch,
      private: repo.private,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
    }));

    // Check if there are more pages
    const linkHeader = response.headers.link || '';
    const hasMore = linkHeader.includes('rel="next"');

    return { repos, hasMore };
  },

  /**
   * Get the file tree of a repository.
   */
  async getRepoTree(userId: string, owner: string, repo: string, branch?: string): Promise<FileTreeItem[]> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    // Get default branch if not specified
    if (!branch) {
      const repoResponse = await client.get(`/repos/${owner}/${repo}`);
      branch = repoResponse.data.default_branch;
    }

    const response = await client.get(`/repos/${owner}/${repo}/git/trees/${branch}`, {
      params: { recursive: 1 },
    });

    const items: FileTreeItem[] = response.data.tree
      .filter((item: any) => item.type === 'blob' || item.type === 'tree')
      .map((item: any) => ({
        path: item.path,
        type: item.type === 'blob' ? 'file' : 'dir',
        size: item.size,
        sha: item.sha,
      }));

    return items;
  },

  /**
   * Get the content of a specific file.
   */
  async getFileContent(userId: string, owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    const params: Record<string, string> = {};
    if (ref) params.ref = ref;

    const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });

    const data = response.data;

    if (data.type !== 'file') {
      throw new AppError(`${path} is not a file`, 400);
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    // Detect language from file extension
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    const { EXTENSION_TO_LANGUAGE } = require('@aicr/shared');
    const language = EXTENSION_TO_LANGUAGE[ext] || null;

    return {
      path: data.path,
      content,
      encoding: 'utf-8',
      size: data.size,
      sha: data.sha,
      language,
    };
  },
};

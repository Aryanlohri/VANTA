// ============================================
// Repository Service — GitHub API Integration
// ============================================

import axios from 'axios';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import type { GitHubRepo, FileTreeItem, FileContent } from '@aicr/shared';
import { redis } from './redis';

const logger = createLogger('repository-service:github-api');

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

/**
 * Lazily load and validate the inter-service secret.
 * Deferred to first use to avoid dotenv ordering issues with tsx.
 */
let _internalSecret: string | null = null;

function getInternalSecret(): string {
  if (_internalSecret) return _internalSecret;

  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || secret === 'REPLACE_WITH_GENERATED_SECRET_BEFORE_PRODUCTION') {
    logger.fatal(
      'INTERNAL_SERVICE_SECRET is not configured. ' +
      'Repository service cannot securely call the auth service.'
    );
    process.exit(1);
  }
  _internalSecret = secret;
  return secret;
}

/**
 * Get the GitHub access token for a user from the auth service.
 * Sends the X-Internal-Secret header so the auth service accepts the request.
 */
async function getGitHubToken(userId: string): Promise<string> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/token/${userId}`, {
      timeout: 5000,
      headers: {
        'x-internal-secret': getInternalSecret(),
      },
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
    const cacheKey = `github:repos:${userId}:${page}:${perPage}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.warn({ err: e }, 'Failed to read from Redis cache');
    }

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

    const result = { repos, hasMore };
    
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 mins cache
    } catch (e) {
      logger.warn({ err: e }, 'Failed to write to Redis cache');
    }

    return result;
  },

  /**
   * Get the file tree of a repository.
   */
  async getRepoTree(userId: string, owner: string, repo: string, branch?: string): Promise<FileTreeItem[]> {
    const cacheKey = `github:tree:${userId}:${owner}:${repo}:${branch || 'default'}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.warn({ err: e }, 'Failed to read from Redis cache');
    }

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

    try {
      await redis.set(cacheKey, JSON.stringify(items), 'EX', 600); // 10 mins cache
    } catch (e) {
      logger.warn({ err: e }, 'Failed to write to Redis cache');
    }

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

  /**
   * Get files changed in a pull request, including their diff patch.
   */
  async getPullRequestFiles(userId: string, owner: string, repo: string, prNumber: number): Promise<any[]> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);
    
    // https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files
    const response = await client.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
      params: { per_page: 100 }
    });

    return response.data;
  },

  /**
   * Get files changed in a specific commit, including their diff patch.
   */
  async getCommitFiles(userId: string, owner: string, repo: string, commitSha: string): Promise<any[]> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    // https://docs.github.com/en/rest/commits/commits#get-a-commit
    const response = await client.get(`/repos/${owner}/${repo}/commits/${commitSha}`);

    return response.data.files || [];
  },

  /**
   * Create a webhook on a GitHub repository.
   */
  async createWebhook(userId: string, owner: string, repo: string, webhookUrl: string, secret: string): Promise<number> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    try {
      const response = await client.post(`/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
          secret: secret,
        },
      });

      return response.data.id; // Returns the webhook_id
    } catch (error: any) {
      if (error.response?.status === 422) {
        // Validation failed, possibly webhook already exists
        logger.warn({ owner, repo }, 'Webhook might already exist');
        
        // Try to fetch existing webhooks to find our ID
        try {
          const hooksRes = await client.get(`/repos/${owner}/${repo}/hooks`);
          const existingHook = hooksRes.data.find((h: any) => h.config.url === webhookUrl);
          if (existingHook) return existingHook.id;
        } catch (e) {
          logger.error('Failed to fetch existing webhooks');
        }
      }
      logger.error({ err: error.response?.data || error.message }, 'Failed to create GitHub webhook');
      throw new AppError('Failed to create webhook on GitHub', 500);
    }
  },

  /**
   * Create a review on a pull request with inline comments.
   */
  async createPullRequestReview(
    userId: string,
    owner: string,
    repo: string,
    prNumber: number,
    commitSha: string,
    comments: Array<{ path: string; line: number; body: string }>
  ): Promise<any> {
    const token = await getGitHubToken(userId);
    const client = createGitHubClient(token);

    // Filter out comments without valid lines or paths
    const validComments = comments.filter((c) => c.path && c.line && c.body).map((c) => ({
      path: c.path,
      line: c.line,
      side: 'RIGHT',
      body: c.body,
    }));

    if (validComments.length === 0) {
      logger.info({ prNumber }, 'No valid comments to post to GitHub');
      return null;
    }

    try {
      const response = await client.post(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
        commit_id: commitSha,
        event: 'COMMENT',
        body: '✨ **VANTA AI Code Review**\nHere are some suggestions to improve your code quality, security, and performance.',
        comments: validComments,
      });

      logger.info({ prNumber, reviewId: response.data.id }, 'Successfully posted PR review to GitHub');
      return response.data;
    } catch (error: any) {
      logger.error({ err: error.response?.data || error.message }, 'Failed to create PR review');
      
      // Fallback mechanism: 422 Unprocessable Entity often means invalid line numbers for inline comments.
      if (error.response?.status === 422) {
        logger.warn({ prNumber, owner, repo }, 'GitHub rejected inline comments (likely due to line numbers outside the diff). Falling back to general PR comment.');
        
        try {
          // Construct a single markdown string with all comments
          let fallbackBody = '✨ **VANTA AI Code Review**\nHere are some suggestions to improve your code quality, security, and performance.\n\n';
          validComments.forEach(c => {
            fallbackBody += `**File:** \`${c.path}\` (Line ${c.line})\n${c.body}\n\n---\n\n`;
          });

          const fallbackResponse = await client.post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
            body: fallbackBody
          });
          
          logger.info({ prNumber, commentId: fallbackResponse.data.id }, 'Successfully posted fallback general PR comment');
          return fallbackResponse.data;
        } catch (fallbackError: any) {
          logger.error({ err: fallbackError.response?.data || fallbackError.message }, 'Failed to post fallback PR comment');
          throw new AppError('Failed to post review to GitHub even after fallback', 500);
        }
      }

      throw new AppError('Failed to post review to GitHub', 500);
    }
  },
};

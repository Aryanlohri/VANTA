// ============================================
// Auth Service — GitHub OAuth Service
// ============================================

import axios from 'axios';
import crypto from 'crypto';
import { createLogger, AppError, ERROR_CODES } from '@aicr/shared';

const logger = createLogger('auth-service:github');

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
 * Get the encryption key from environment.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    // In development, use a default key (NOT for production!)
    return crypto.scryptSync('dev-encryption-key', 'salt', 32);
  }
  return crypto.scryptSync(key, 'salt', 32);
}

export const GitHubService = {
  /**
   * Generate the GitHub OAuth authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new AppError('GITHUB_CLIENT_ID not configured', 500);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/github/callback`,
      scope: 'read:user user:email repo',
      state,
    });

    return `${GITHUB_OAUTH_URL}?${params.toString()}`;
  },

  /**
   * Exchange the OAuth code for an access token.
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post<GitHubTokenResponse>(
        GITHUB_TOKEN_URL,
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/github/callback`,
        },
        {
          headers: { Accept: 'application/json' },
          timeout: 10000,
        }
      );

      if (!response.data.access_token) {
        logger.error({ response: response.data }, 'GitHub token exchange failed');
        throw new AppError('Failed to get access token from GitHub', 401, ERROR_CODES.OAUTH_FAILED);
      }

      return response.data.access_token;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'GitHub token exchange error');
      throw new AppError('GitHub OAuth token exchange failed', 500, ERROR_CODES.OAUTH_FAILED);
    }
  },

  /**
   * Fetch the authenticated user's profile from GitHub.
   */
  async getUserProfile(accessToken: string): Promise<{
    id: number;
    username: string;
    email: string | null;
    avatar_url: string;
  }> {
    try {
      const [userResponse, emailsResponse] = await Promise.all([
        axios.get<GitHubUserResponse>(GITHUB_USER_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          timeout: 10000,
        }),
        axios.get<GitHubEmailResponse[]>(GITHUB_EMAILS_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          timeout: 10000,
        }).catch(() => ({ data: [] as GitHubEmailResponse[] })),
      ]);

      const user = userResponse.data;

      // Get primary verified email
      let email = user.email;
      if (!email && emailsResponse.data.length > 0) {
        const primaryEmail = emailsResponse.data.find((e) => e.primary && e.verified);
        email = primaryEmail?.email || emailsResponse.data[0]?.email || null;
      }

      return {
        id: user.id,
        username: user.login,
        email,
        avatar_url: user.avatar_url,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch GitHub user profile');
      throw new AppError('Failed to fetch user profile from GitHub', 500, ERROR_CODES.OAUTH_FAILED);
    }
  },

  /**
   * Encrypt an access token for storage.
   */
  encryptToken(token: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  },

  /**
   * Decrypt a stored access token.
   */
  decryptToken(encryptedToken: string): string {
    const key = getEncryptionKey();
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};

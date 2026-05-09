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

// ── Encryption ─────────────────────────────────────────────────────────────
//
// Algorithm: AES-256-GCM (authenticated encryption)
//   - Provides both confidentiality AND integrity/authenticity
//   - GCM mode detects tampering — if the ciphertext is modified, decryption
//     throws rather than silently returning garbage
//   - NEVER use AES-CBC for this (no authentication, padding oracle attacks)
//
// Key: 32-byte raw key from ENCRYPTION_KEY env var (hex-encoded, 64 chars)
//   - Derived directly — no scrypt, no KDF needed because the input is already
//     high-entropy random bytes
//   - NO fallback to any default or dev key. Process crashes if key is absent.
//
// Ciphertext format: <24-char hex IV>:<32-char hex auth tag>:<hex ciphertext>
//   - The IV is random per encryption, stored with the ciphertext
//   - The auth tag ensures integrity

/** Eagerly load and validate the encryption key. Crashes at startup if missing. */
function loadEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex || keyHex.trim().length === 0) {
    logger.fatal(
      'ENCRYPTION_KEY is not set. This is required to encrypt GitHub access tokens. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
    process.exit(1);
  }

  if (
    keyHex === 'change_me_to_a_32_char_hex_string' ||
    keyHex === '54c9f8565a629debb1c73d0cd89f14d3' // the leaked placeholder value
  ) {
    logger.fatal(
      'ENCRYPTION_KEY is set to a known placeholder or insecure value. ' +
      'This key has been publicly exposed. Generate a new one immediately.'
    );
    process.exit(1);
  }

  // Require exactly 64 hex characters = 32 bytes = 256 bits
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    logger.fatal(
      `ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ` +
      `Received ${keyHex.length} characters. ` +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
    process.exit(1);
  }

  return Buffer.from(keyHex, 'hex');
}

// Cached at module load — do NOT call this on every encrypt/decrypt to avoid
// repeated env reads. The key never changes during a service's lifetime.
const ENCRYPTION_KEY = loadEncryptionKey();

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

      // Prefer primary verified email
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
   * Encrypt a GitHub access token for at-rest storage.
   *
   * Uses AES-256-GCM (authenticated encryption).
   * Format: <12-byte IV hex>:<16-byte auth tag hex>:<ciphertext hex>
   */
  encryptToken(token: string): string {
    const iv = crypto.randomBytes(12); // 12 bytes is the standard for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag(); // 16-byte integrity tag

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  /**
   * Decrypt a stored GitHub access token.
   *
   * Throws if the ciphertext has been tampered with (GCM auth tag mismatch).
   */
  decryptToken(encryptedToken: string): string {
    const parts = encryptedToken.split(':');

    if (parts.length !== 3) {
      throw new AppError('Malformed encrypted token — cannot decrypt', 500);
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    if (!ivHex || !authTagHex || !ciphertext) {
      throw new AppError('Malformed encrypted token — missing components', 500);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    // decipher.final() will throw if the auth tag doesn't match —
    // this is the tamper detection that AES-GCM provides
    decrypted += decipher.final('utf8');

    return decrypted;
  },
};

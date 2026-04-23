// ============================================
// Auth Service — Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger, AppError, ERROR_CODES } from '@aicr/shared';
import { GitHubService } from '../services/github.service';
import { TokenService } from '../services/token.service';
import { UserModel } from '../models/user.model';

const logger = createLogger('auth-service:controller');

// In-memory store for OAuth state tokens (use Redis in production)
const oauthStates = new Map<string, { createdAt: number }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, { createdAt }] of oauthStates) {
    if (now - createdAt > 10 * 60 * 1000) { // 10 min expiry
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

export const AuthController = {
  /**
   * GET /auth/github
   * Redirect to GitHub OAuth authorization page.
   */
  async initiateOAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      oauthStates.set(state, { createdAt: Date.now() });

      const authUrl = GitHubService.getAuthorizationUrl(state);
      logger.info('Redirecting to GitHub OAuth');

      res.json({ success: true, data: { url: authUrl } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/github/callback
   * Handle the OAuth callback from GitHub.
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        throw new AppError('Missing authorization code', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      if (!state || typeof state !== 'string' || !oauthStates.has(state)) {
        throw new AppError('Invalid or expired OAuth state', 400, ERROR_CODES.OAUTH_FAILED);
      }

      // Remove used state
      oauthStates.delete(state);

      // Exchange code for token
      logger.info('Exchanging OAuth code for token');
      const accessToken = await GitHubService.exchangeCodeForToken(code);

      // Fetch user profile
      logger.info('Fetching GitHub user profile');
      const profile = await GitHubService.getUserProfile(accessToken);

      // Encrypt the access token for storage
      const encryptedToken = GitHubService.encryptToken(accessToken);

      // Upsert user in database
      const user = await UserModel.upsertFromGitHub({
        github_id: profile.id,
        username: profile.username,
        email: profile.email,
        avatar_url: profile.avatar_url,
        access_token_encrypted: encryptedToken,
      });

      logger.info({ userId: user.id, username: user.username }, 'User authenticated');

      // Generate JWT
      const tokens = TokenService.generateTokens(user.id, user.username);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
      res.redirect(
        `${frontendUrl}/auth/callback?token=${tokens.accessToken}&expiresIn=${tokens.expiresIn}`
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   * Get the current authenticated user's profile.
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        throw new AppError('Not authenticated', 401, ERROR_CODES.UNAUTHORIZED);
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
      }

      res.json({
        success: true,
        data: UserModel.toPublic(user),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/verify
   * Verify a JWT token and return the user info.
   * Used internally by the API gateway.
   */
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        throw new AppError('Token is required', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const payload = TokenService.verifyToken(token);
      const user = await UserModel.findById(payload.userId);

      if (!user) {
        throw new AppError('User not found', 401, ERROR_CODES.UNAUTHORIZED);
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/token/:userId
   * Get the decrypted GitHub access token for a user.
   * Internal endpoint — only accessible from other services.
   */
  async getGitHubToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const encryptedToken = await UserModel.getAccessToken(userId);

      if (!encryptedToken) {
        throw new AppError('Token not found', 404, ERROR_CODES.NOT_FOUND);
      }

      const token = GitHubService.decryptToken(encryptedToken);

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      next(error);
    }
  },
};

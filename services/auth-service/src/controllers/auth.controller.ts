// ============================================
// Auth Service — Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger, AppError, ERROR_CODES } from '@aicr/shared';
import { GitHubService } from '../services/github.service';
import { TokenService } from '../services/token.service';
import { UserModel } from '../models/user.model';
import { getRedis } from '../config/redis';

const logger = createLogger('auth-service:controller');

// ── Redis key prefixes ──────────────────────────────────────────────────────
// All Redis keys are namespaced to avoid collisions with other services.
const OAUTH_STATE_PREFIX = 'auth:oauth_state:';
const AUTH_CODE_PREFIX = 'auth:one_time_code:';

/** TTL for OAuth state tokens: 10 minutes */
const OAUTH_STATE_TTL_SECONDS = 600;

/**
 * TTL for one-time auth codes: 60 seconds.
 * The frontend MUST exchange the code for a JWT within this window.
 * After that the code is invalid and a new login is required.
 */
const AUTH_CODE_TTL_SECONDS = 60;

export const AuthController = {
  /**
   * GET /auth/github
   * Generates a cryptographically random OAuth state, stores it in Redis,
   * and returns the GitHub authorization URL to the client.
   */
  async initiateOAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      const key = `${OAUTH_STATE_PREFIX}${state}`;

      // Store in Redis with TTL. setex = SET + EXPIRE atomically.
      await getRedis().setex(key, OAUTH_STATE_TTL_SECONDS, '1');

      const authUrl = GitHubService.getAuthorizationUrl(state);
      logger.info('Redirecting to GitHub OAuth');

      res.json({ success: true, data: { url: authUrl } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/github/callback
   * Handles the OAuth callback from GitHub.
   *
   * SECURITY NOTE — One-Time Code Pattern:
   *   We do NOT put the JWT in the redirect URL (it would land in browser
   *   history, server logs, and the Referer header).
   *
   *   Instead we:
   *     1. Generate a cryptographically random one-time code
   *     2. Store the JWT in Redis keyed by that code (60s TTL)
   *     3. Redirect to the frontend with only the code in the URL
   *     4. The frontend calls POST /auth/exchange to swap the code for the JWT
   *
   *   Once exchanged the code is deleted — it cannot be used again.
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        throw new AppError('Missing authorization code', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      if (!state || typeof state !== 'string') {
        throw new AppError('Missing OAuth state parameter', 400, ERROR_CODES.OAUTH_FAILED);
      }

      // Validate state against Redis — atomic delete (get then del)
      const stateKey = `${OAUTH_STATE_PREFIX}${state}`;
      // Use getdel so the state is consumed atomically (no replay)
      const stateValue = await getRedis().getdel(stateKey);

      if (!stateValue) {
        logger.warn({ state }, 'OAuth state not found or already used — possible CSRF or replay');
        throw new AppError('Invalid or expired OAuth state', 400, ERROR_CODES.OAUTH_FAILED);
      }

      // Exchange code for GitHub access token
      logger.info('Exchanging OAuth code for token');
      const accessToken = await GitHubService.exchangeCodeForToken(code);

      // Fetch user profile
      logger.info('Fetching GitHub user profile');
      const profile = await GitHubService.getUserProfile(accessToken);

      // Encrypt the access token for at-rest storage
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

      // Generate a one-time code and store the JWT in Redis under it.
      // The actual JWT NEVER touches the URL — only this opaque code does.
      const oneTimeCode = crypto.randomBytes(32).toString('hex');
      const codeKey = `${AUTH_CODE_PREFIX}${oneTimeCode}`;
      await getRedis().setex(codeKey, AUTH_CODE_TTL_SECONDS, JSON.stringify({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      }));

      logger.info({ userId: user.id }, 'One-time auth code issued (60s TTL)');

      // Redirect to frontend with the opaque code — NOT the JWT
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
      res.redirect(`${frontendUrl}/auth/callback?code=${oneTimeCode}`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/exchange
   * Exchanges a one-time auth code (from the OAuth callback redirect) for a JWT.
   *
   * This endpoint is PUBLIC (no JWT required) because the user doesn't have
   * one yet — this is how they obtain it.
   *
   * The code is valid for 60 seconds and is deleted after the first use.
   */
  async exchangeCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string' || code.length !== 64) {
        throw new AppError('Invalid or missing code', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const codeKey = `${AUTH_CODE_PREFIX}${code}`;
      // Atomic get-and-delete — code is valid exactly once
      const stored = await getRedis().getdel(codeKey);

      if (!stored) {
        logger.warn({ ip: req.ip }, 'One-time code not found, expired, or already used');
        throw new AppError('Code is invalid or has expired. Please log in again.', 401, ERROR_CODES.UNAUTHORIZED);
      }

      const { accessToken, expiresIn } = JSON.parse(stored);

      logger.info('One-time code successfully exchanged for JWT');

      res.json({ success: true, data: { accessToken, expiresIn } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   * Returns the current authenticated user's profile.
   * Protected: requires a valid JWT (enforced by authMiddleware on the route).
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
   * Verifies a JWT and returns the user info.
   * INTERNAL ONLY — protected by requireInternalSecret middleware on the route.
   * The API gateway calls this on every authenticated request.
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
   * Returns the decrypted GitHub access token for a user.
   * INTERNAL ONLY — protected by requireInternalSecret middleware on the route.
   * Called by repository-service to make GitHub API calls on behalf of users.
   */
  async getGitHubToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;

      // Basic UUID format guard to prevent log injection / misuse
      if (!/^[0-9a-f-]{36}$/.test(userId)) {
        throw new AppError('Invalid user ID format', 400, ERROR_CODES.VALIDATION_ERROR);
      }

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

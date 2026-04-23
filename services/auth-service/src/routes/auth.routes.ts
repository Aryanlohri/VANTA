// ============================================
// Auth Service — Routes
// ============================================

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ---- Public routes ----

// Initiate GitHub OAuth
router.get('/github', AuthController.initiateOAuth);

// GitHub OAuth callback
router.get('/github/callback', AuthController.handleCallback);

// Verify token (internal — used by API gateway)
router.post('/verify', AuthController.verifyToken);

// Get GitHub token for a user (internal — used by other services)
router.get('/token/:userId', AuthController.getGitHubToken);

// ---- Protected routes ----

// Get current user profile
router.get('/me', authMiddleware, AuthController.getProfile);

export default router;

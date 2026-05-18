// ============================================
// Auth Service — Routes
// ============================================

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireInternalSecret } from '../middleware/internalAuth.middleware';
import { isAdmin } from '../middleware/isAdmin.middleware';

const router = Router();

// ── Public routes (no JWT required) ────────────────────────────────────────

// Initiate GitHub OAuth — returns the authorization URL
router.get('/github', AuthController.initiateOAuth);

// GitHub OAuth callback — validates state, exchanges code, issues one-time code
router.get('/github/callback', AuthController.handleCallback);

// Exchange one-time code for JWT — the ONLY way clients get their token
// This endpoint is public because clients don't have a JWT yet at this point.
router.post('/exchange', AuthController.exchangeCode);

// ── Internal-only routes — protected by inter-service secret ───────────────
// These endpoints MUST NOT be reachable by end users or external callers.
// requireInternalSecret validates the X-Internal-Secret header using
// timingSafeEqual against INTERNAL_SERVICE_SECRET from the environment.

// Verify JWT — used by API gateway on every authenticated request
router.post('/verify', requireInternalSecret, AuthController.verifyToken);

// Get decrypted GitHub token — used by repository-service to call GitHub API
router.get('/token/:userId', requireInternalSecret, AuthController.getGitHubToken);

// ── Protected routes (JWT required) ────────────────────────────────────────

// Get current user profile
router.get('/me', authMiddleware, AuthController.getProfile);

// Get platform metrics (Admin only)
router.get('/admin/metrics', authMiddleware, isAdmin, AuthController.getMetrics);

export default router;

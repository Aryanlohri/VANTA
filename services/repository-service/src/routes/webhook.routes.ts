import express, { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// We must use express.raw to preserve the raw Buffer for HMAC validation.
// The controller will manually JSON.parse it after signature verification.
router.post(
  '/github',
  express.raw({ type: 'application/json' }),
  WebhookController.handleGitHubWebhook
);

export default router;

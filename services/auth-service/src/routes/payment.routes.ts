// ============================================
// Auth Service — Payment Routes (Razorpay)
// ============================================

import { Router, Request, Response } from 'express';
import { createLogger } from '@aicr/shared';
import { SubscriptionModel } from '../models/subscription.model';

const router = Router();
const logger = createLogger('auth-service:payment');

/**
 * GET /payment/usage
 * Returns current usage for the authenticated user.
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const sub = await SubscriptionModel.getOrCreate(userId);

    res.json({
      success: true,
      data: {
        plan: sub.plan,
        reviews_used: sub.reviews_used,
        reviews_limit: sub.reviews_limit,
        percentage: Math.round((sub.reviews_used / sub.reviews_limit) * 100),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get usage');
    res.status(500).json({ success: false, error: { message: 'Failed to get usage' } });
  }
});

/**
 * POST /payment/usage/increment
 * Atomically check and increment the review usage counter for a user.
 *
 * INTERNAL ONLY — protected by requireInternalSecret middleware.
 * This endpoint is called by the review-service before creating each review.
 *
 * Uses a single SQL UPDATE with a conditional WHERE (reviews_used < reviews_limit)
 * to prevent race conditions when multiple review requests arrive simultaneously.
 */
import { requireInternalSecret } from '../middleware/internalAuth.middleware';

router.post('/usage/increment', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'userId is required' } });
    }

    const result = await SubscriptionModel.atomicIncrementUsage(userId);

    logger.info(
      { userId, allowed: result.allowed, used: result.used, limit: result.limit },
      'Usage increment checked'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error }, 'Failed to increment usage');
    res.status(500).json({ success: false, error: { message: 'Failed to process usage' } });
  }
});

export default router;

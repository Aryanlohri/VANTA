// ============================================
// Auth Service — Payment Routes (Razorpay)
// ============================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { createLogger } from '@aicr/shared';
import { SubscriptionModel } from '../models/subscription.model';

const router = Router();
const logger = createLogger('auth-service:payment');

// ── Plan pricing (in paise — Razorpay uses smallest currency unit) ──
const PLAN_PRICING: Record<string, Record<string, number>> = {
  pro:  { monthly: 1599_00, annual: 1299_00 },  // ₹1599/mo or ₹1299/mo
  team: { monthly: 4099_00, annual: 3299_00 },  // ₹4099/mo or ₹3299/mo
};

/**
 * GET /payment/plans
 * Returns available plans and current user subscription.
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const subscription = await SubscriptionModel.getOrCreate(userId);

    res.json({
      success: true,
      data: {
        current: {
          plan: subscription.plan,
          status: subscription.status,
          billing_cycle: subscription.billing_cycle,
          reviews_used: subscription.reviews_used,
          reviews_limit: subscription.reviews_limit,
          current_period_end: subscription.current_period_end,
        },
        plans: {
          free: { price: { monthly: 0, annual: 0 }, reviews: 5 },
          pro: { price: { monthly: 19, annual: 15 }, reviews: 100 },
          team: { price: { monthly: 49, annual: 39 }, reviews: 500 },
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get plans');
    res.status(500).json({ success: false, error: { message: 'Failed to get plans' } });
  }
});

/**
 * POST /payment/create-order
 * Creates a Razorpay order for one-time payment.
 * Body: { plan: 'pro' | 'team', billing_cycle: 'monthly' | 'annual' }
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { plan, billing_cycle } = req.body;

    if (!plan || !['pro', 'team'].includes(plan)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid plan' } });
    }
    if (!billing_cycle || !['monthly', 'annual'].includes(billing_cycle)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid billing cycle' } });
    }

    const amount = PLAN_PRICING[plan][billing_cycle];
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ success: false, error: { message: 'Payment gateway not configured' } });
    }

    // Create Razorpay order via API
    const orderPayload = {
      amount: billing_cycle === 'annual' ? amount * 12 : amount, // Annual = 12 months upfront
      currency: 'INR',
      receipt: `rcpt_${userId.substring(0, 4)}_${Date.now().toString().slice(-8)}`,
      notes: { user_id: userId, plan, billing_cycle },
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const order = await response.json();

    if (!response.ok) {
      logger.error({ order }, 'Razorpay order creation failed');
      return res.status(500).json({ success: false, error: { message: 'Failed to create payment order' } });
    }

    logger.info({ orderId: order.id, plan, billing_cycle, amount: orderPayload.amount }, 'Razorpay order created');

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: orderPayload.amount,
        currency: order.currency,
        key_id: keyId,
        plan,
        billing_cycle,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create order');
    res.status(500).json({ success: false, error: { message: 'Payment order failed' } });
  }
});

/**
 * POST /payment/verify
 * Verifies Razorpay payment signature and activates the plan.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing_cycle }
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing_cycle } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: { message: 'Missing payment details' } });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, error: { message: 'Payment gateway not configured' } });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn({ userId, razorpay_order_id }, 'Invalid payment signature');
      return res.status(400).json({ success: false, error: { message: 'Payment verification failed' } });
    }

    // Payment verified — activate plan
    const subscription = await SubscriptionModel.activatePlan(userId, plan, billing_cycle, {
      payment_id: razorpay_payment_id,
    });

    logger.info({ userId, plan, billing_cycle, paymentId: razorpay_payment_id }, 'Plan activated');

    res.json({
      success: true,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        reviews_limit: subscription.reviews_limit,
        current_period_end: subscription.current_period_end,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Payment verification failed');
    res.status(500).json({ success: false, error: { message: 'Payment verification failed' } });
  }
});

/**
 * POST /payment/webhook
 * Razorpay webhook handler for subscription events.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'] as string;
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSig) {
        logger.warn('Invalid webhook signature');
        return res.status(400).json({ success: false });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    logger.info({ event }, 'Razorpay webhook received');

    switch (event) {
      case 'payment.captured':
        // Payment was successful
        logger.info({ paymentId: payload.payment?.entity?.id }, 'Payment captured');
        break;

      case 'subscription.cancelled':
        // Subscription was cancelled
        const subId = payload.subscription?.entity?.id;
        if (subId) {
          const sub = await SubscriptionModel.getByRazorpayId(subId);
          if (sub) {
            await SubscriptionModel.cancel(sub.user_id);
            logger.info({ userId: sub.user_id }, 'Subscription cancelled via webhook');
          }
        }
        break;

      default:
        logger.info({ event }, 'Unhandled webhook event');
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Webhook processing failed');
    res.status(500).json({ success: false });
  }
});

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

export default router;

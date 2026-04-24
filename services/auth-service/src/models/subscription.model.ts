// ============================================
// Auth Service — Subscription Model
// ============================================

import { getDb } from '../config/database';

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billing_cycle: 'monthly' | 'annual';
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_customer_id: string | null;
  reviews_limit: number;
  reviews_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

/** Plan limits configuration */
const PLAN_LIMITS = {
  free: 5,
  pro: 100,
  team: 500,
} as const;

const TABLE = 'auth.subscriptions';

export const SubscriptionModel = {
  /** Get or create a subscription for a user */
  async getOrCreate(userId: string): Promise<Subscription> {
    const existing = await getDb()(TABLE).where({ user_id: userId }).first();
    if (existing) return existing;

    // Create a free subscription by default
    const [sub] = await getDb()(TABLE)
      .insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        billing_cycle: 'monthly',
        reviews_limit: PLAN_LIMITS.free,
        reviews_used: 0,
      })
      .returning('*');
    return sub;
  },

  /** Get subscription by user ID */
  async getByUserId(userId: string): Promise<Subscription | null> {
    return await getDb()(TABLE).where({ user_id: userId }).first() || null;
  },

  /** Get subscription by Razorpay subscription ID */
  async getByRazorpayId(razorpaySubId: string): Promise<Subscription | null> {
    return await getDb()(TABLE).where({ razorpay_subscription_id: razorpaySubId }).first() || null;
  },

  /** Activate a paid plan after successful payment */
  async activatePlan(
    userId: string,
    plan: 'pro' | 'team',
    billingCycle: 'monthly' | 'annual',
    razorpayData: {
      subscription_id?: string;
      payment_id?: string;
      customer_id?: string;
    }
  ): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const [sub] = await getDb()(TABLE)
      .where({ user_id: userId })
      .update({
        plan,
        status: 'active',
        billing_cycle: billingCycle,
        razorpay_subscription_id: razorpayData.subscription_id || null,
        razorpay_payment_id: razorpayData.payment_id || null,
        razorpay_customer_id: razorpayData.customer_id || null,
        reviews_limit: PLAN_LIMITS[plan],
        reviews_used: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: getDb().fn.now(),
      })
      .returning('*');

    // Also update user's plan field
    await getDb()('auth.users').where({ id: userId }).update({ plan, updated_at: getDb().fn.now() });

    return sub;
  },

  /** Cancel subscription (reverts to free at period end) */
  async cancel(userId: string): Promise<Subscription> {
    const [sub] = await getDb()(TABLE)
      .where({ user_id: userId })
      .update({ status: 'cancelled', updated_at: getDb().fn.now() })
      .returning('*');
    return sub;
  },

  /** Increment review usage counter */
  async incrementUsage(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const sub = await this.getOrCreate(userId);
    if (sub.reviews_used >= sub.reviews_limit) {
      return { allowed: false, used: sub.reviews_used, limit: sub.reviews_limit };
    }
    await getDb()(TABLE)
      .where({ id: sub.id })
      .update({ reviews_used: sub.reviews_used + 1, updated_at: getDb().fn.now() });
    return { allowed: true, used: sub.reviews_used + 1, limit: sub.reviews_limit };
  },

  /** Reset monthly usage (called by cron or webhook on renewal) */
  async resetUsage(userId: string): Promise<void> {
    await getDb()(TABLE).where({ user_id: userId }).update({ reviews_used: 0, updated_at: getDb().fn.now() });
  },
};

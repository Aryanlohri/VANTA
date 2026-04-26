// ============================================
// API Gateway — Route Definitions
// ============================================

import { Router } from 'express';
import { authProxy, repoProxy, reviewProxy, paymentProxy, webhookProxy } from './proxy';

const router = Router();

// ---- Service routing ----
// All requests are proxied to the appropriate microservice

// Auth routes → Auth Service
router.use('/auth', authProxy);

// Repository routes → Repository Service
router.use('/repos', repoProxy);

// Review routes → Review Service
router.use('/reviews', reviewProxy);

// Payment routes → Auth Service (payment module)
router.use('/payment', paymentProxy);

// Webhook routes → Repository Service (webhook module)
router.use('/v1/webhooks', webhookProxy);

export default router;

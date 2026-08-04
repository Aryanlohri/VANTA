// ============================================
// API Gateway — Route Definitions
// ============================================

import { Router } from 'express';
import IORedis from 'ioredis';
import { createLogger } from '@aicr/shared';
import { authProxy, repoProxy, reviewProxy, webhookProxy } from './proxy';

const logger = createLogger('api-gateway:stream');

const router = Router();

// ---- SSE Streaming Route ----
// We handle this natively in the gateway to avoid proxy buffering issues with SSE.
router.get('/reviews/:id/stream', (req, res) => {
  const reviewId = req.params.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const channel = `review:${reviewId}:stream`;
  const subscriber = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  subscriber.subscribe(channel, (err) => {
    if (err) {
      logger.error({ err, reviewId }, 'Failed to subscribe to Redis stream');
      res.write(`data: ${JSON.stringify({ error: 'Stream unavailable' })}\n\n`);
      res.end();
    }
  });

  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      res.write(`data: ${JSON.stringify({ text: message })}\n\n`);
    }
  });

  req.on('close', () => {
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});

// ---- Service routing ----
// All requests are proxied to the appropriate microservice

// Auth routes → Auth Service
router.use('/auth', authProxy);

// Repository routes → Repository Service
router.use('/repos', repoProxy);

// Review routes → Review Service
router.use('/reviews', reviewProxy);

// Webhook routes → Repository Service (webhook module)
router.use('/v1/webhooks', webhookProxy);

export default router;

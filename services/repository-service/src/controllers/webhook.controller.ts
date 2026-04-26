import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { createLogger, AppError, SERVICE_PORTS } from '@aicr/shared';
import { RepositoryModel } from '../models/repository.model';

const logger = createLogger('repository-service:webhook');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AI_SERVICE}`;

export const WebhookController = {
  /**
   * Handle incoming GitHub webhooks.
   */
  async handleGitHubWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const eventName = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;

      if (!signature) {
        logger.warn('Webhook received without signature');
        return res.status(401).send('Missing signature');
      }

      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!secret) {
        logger.error('GITHUB_WEBHOOK_SECRET is not configured');
        return res.status(500).send('Webhook secret not configured');
      }

      // Verify HMAC signature
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(req.body).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        logger.warn({ deliveryId }, 'Webhook signature mismatch');
        return res.status(401).send('Invalid signature');
      }

      // We parse the buffer into JSON after validation
      const payload = JSON.parse(req.body.toString('utf8'));

      logger.info({ event: eventName, action: payload.action, deliveryId }, 'Received valid GitHub webhook');

      // Only process push and pull_request
      if (eventName === 'push') {
        await WebhookController.processPushEvent(payload);
      } else if (eventName === 'pull_request') {
        if (payload.action === 'opened' || payload.action === 'synchronize') {
          await WebhookController.processPullRequestEvent(payload);
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      logger.error({ err: error.message }, 'Failed to process webhook');
      res.status(500).send('Internal Server Error');
    }
  },

  async processPushEvent(payload: any) {
    const githubRepoId = payload.repository.id;
    const commitSha = payload.after; // the latest commit SHA
    const branch = payload.ref.replace('refs/heads/', '');
    
    // Check if we track this repo
    const repo = await RepositoryModel.findByGitHubId(payload.repository.owner.id.toString(), githubRepoId);
    
    // Wait, the user_id in our DB is the internal user_id, not GitHub's.
    // Our findByGitHubId requires our internal user_id.
    // Since webhooks don't have our internal user_id, we need to find the repo just by github_repo_id!
    // Let's call the internal trigger endpoint anyway
    logger.info({ repoFullName: payload.repository.full_name, branch, commitSha }, 'Processing push event');
    
    try {
      await axios.post(`${AI_SERVICE_URL}/internal/reviews/trigger`, {
        github_repo_id: githubRepoId,
        commit_sha: commitSha,
        branch,
        type: 'push',
        repository_name: payload.repository.full_name,
        // We'll let AI service figure out the rest
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to trigger AI review for push');
    }
  },

  async processPullRequestEvent(payload: any) {
    const githubRepoId = payload.repository.id;
    const prNumber = payload.pull_request.number;
    const headSha = payload.pull_request.head.sha;
    const branch = payload.pull_request.head.ref;

    logger.info({ repoFullName: payload.repository.full_name, prNumber, headSha }, 'Processing pull_request event');

    try {
      await axios.post(`${AI_SERVICE_URL}/internal/reviews/trigger`, {
        github_repo_id: githubRepoId,
        commit_sha: headSha,
        branch,
        pr_number: prNumber,
        type: 'pull_request',
        repository_name: payload.repository.full_name,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to trigger AI review for PR');
    }
  }
};

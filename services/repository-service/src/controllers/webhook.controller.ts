import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { createLogger, AppError, SERVICE_PORTS, EXTENSION_TO_LANGUAGE } from '@aicr/shared';
import { RepositoryModel } from '../models/repository.model';
import { GitHubApi } from '../services/github.api';

const logger = createLogger('repository-service:webhook');

const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || `http://localhost:${SERVICE_PORTS.REVIEW_SERVICE}`;

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
    
    // Find the repo by its GitHub ID
    const repo = await RepositoryModel.findByGitHubIdOnly(githubRepoId);
    
    if (!repo) {
      logger.warn({ githubRepoId }, 'Webhook received for untracked repository');
      return;
    }

    logger.info({ repoFullName: payload.repository.full_name, branch, commitSha }, 'Processing push event');
    
    try {
      const rawFiles = await GitHubApi.getCommitFiles(repo.user_id, payload.repository.owner.login, payload.repository.name, commitSha);
      
      const files = rawFiles
        .filter((f: any) => f.patch && f.status !== 'removed') // only files with code changes
        .map((f: any) => {
          const ext = '.' + f.filename.split('.').pop()?.toLowerCase();
          return {
            path: f.filename,
            content: f.patch,
            language: EXTENSION_TO_LANGUAGE[ext] || null
          };
        })
        .filter((f: any) => f.language); // Only review supported source code files

      if (files.length === 0) {
        logger.info('No supported code files changed in commit');
        return;
      }

      await axios.post(`${REVIEW_SERVICE_URL}/reviews`, {
        repo_id: repo.id,
        title: `Commit Review: ${commitSha.substring(0, 7)}`,
        files
      }, {
        headers: { 'x-user-id': repo.user_id }
      });

      logger.info('Successfully triggered review for push event');
    } catch (err: any) {
      logger.error({ err: err.response?.data || err.message }, 'Failed to trigger review for push');
    }
  },

  async processPullRequestEvent(payload: any) {
    const githubRepoId = payload.repository.id;
    const prNumber = payload.pull_request.number;
    const headSha = payload.pull_request.head.sha;
    const branch = payload.pull_request.head.ref;
    const prTitle = payload.pull_request.title;

    logger.info({ repoFullName: payload.repository.full_name, prNumber, headSha }, 'Processing pull_request event');

    const repo = await RepositoryModel.findByGitHubIdOnly(githubRepoId);
    
    if (!repo) {
      logger.warn({ githubRepoId }, 'Webhook received for untracked repository');
      return;
    }

    try {
      const rawFiles = await GitHubApi.getPullRequestFiles(repo.user_id, payload.repository.owner.login, payload.repository.name, prNumber);
      
      const files = rawFiles
        .filter((f: any) => f.patch && f.status !== 'removed')
        .map((f: any) => {
          const ext = '.' + f.filename.split('.').pop()?.toLowerCase();
          return {
            path: f.filename,
            content: f.patch,
            language: EXTENSION_TO_LANGUAGE[ext] || null
          };
        })
        .filter((f: any) => f.language);

      if (files.length === 0) {
        logger.info('No supported code files changed in PR');
        return;
      }

      await axios.post(`${REVIEW_SERVICE_URL}/reviews`, {
        repo_id: repo.id,
        title: `PR Review: #${prNumber} ${prTitle}`,
        files
      }, {
        headers: { 'x-user-id': repo.user_id }
      });

      logger.info('Successfully triggered review for pull request');
    } catch (err: any) {
      logger.error({ err: err.response?.data || err.message }, 'Failed to trigger review for PR');
    }
  }
};

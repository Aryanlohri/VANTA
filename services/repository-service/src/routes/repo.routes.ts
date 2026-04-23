// ============================================
// Repository Service — Routes
// ============================================

import { Router } from 'express';
import { RepoController } from '../controllers/repo.controller';

const router = Router();

// List connected repositories
router.get('/', RepoController.listConnected);

// List available GitHub repos (for connect flow)
router.get('/github', RepoController.listGitHubRepos);

// Connect a repository
router.post('/connect', RepoController.connect);

// Get a single repository
router.get('/:id', RepoController.getById);

// Disconnect a repository
router.delete('/:id', RepoController.disconnect);

// List files in a repository
router.get('/:id/files', RepoController.listFiles);

// Get file content (wildcard path)
router.get('/:id/content/*', RepoController.getFileContent);

export default router;

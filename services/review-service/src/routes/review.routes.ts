import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { isAdmin } from '../middleware/isAdmin.middleware';

const router = Router();

router.get('/admin/metrics', isAdmin, ReviewController.getAdminMetrics);
router.get('/analytics/dashboard', AnalyticsController.getDashboard);
router.post('/', ReviewController.create);
router.get('/', ReviewController.list);
router.get('/:id', ReviewController.getById);
router.post('/:id/github', ReviewController.postToGitHub);
router.delete('/:id', ReviewController.deleteReview);

export default router;

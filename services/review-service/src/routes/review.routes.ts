import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();

router.post('/', ReviewController.create);
router.get('/', ReviewController.list);
router.get('/:id', ReviewController.getById);
router.delete('/:id', ReviewController.deleteReview);

export default router;

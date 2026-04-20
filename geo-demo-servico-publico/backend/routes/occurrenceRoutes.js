import { Router } from 'express';
import {
  createOccurrenceController,
  getOccurrenceByIdController,
  listOccurrencesController,
  updateOccurrenceStatusController
} from '../controllers/occurrenceController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/', authenticate, authorize('cidadao', 'admin', 'ouvidoria'), listOccurrencesController);
router.get('/:id', authenticate, authorize('cidadao', 'admin', 'ouvidoria'), getOccurrenceByIdController);
router.post('/', authenticate, authorize('cidadao', 'admin'), createOccurrenceController);
router.patch('/:id/status', authenticate, authorize('admin', 'ouvidoria'), updateOccurrenceStatusController);

export default router;

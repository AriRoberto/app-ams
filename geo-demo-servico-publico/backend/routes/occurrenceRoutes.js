import { Router } from 'express';
import { createOccurrenceController, listOccurrencesController } from '../controllers/occurrenceController.js';

const router = Router();

router.get('/', listOccurrencesController);
router.post('/', createOccurrenceController);

export default router;

import { Router } from 'express';
import { listAuditLogsController } from '../controllers/auditController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/audit', authenticate, authorize('admin'), listAuditLogsController);

export default router;

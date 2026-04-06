import { Router } from 'express';
import { listAuditLogsController } from '../controllers/auditController.js';
import {
  adminUpdateTicketStatusController,
  dashboardMetricsController,
  dashboardTicketsController
} from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/audit', authenticate, authorize('admin'), listAuditLogsController);
router.get('/dashboard/metrics', authenticate, authorize('admin', 'ouvidoria'), dashboardMetricsController);
router.get('/dashboard/tickets', authenticate, authorize('admin', 'ouvidoria'), dashboardTicketsController);
router.patch('/tickets/:id/status', authenticate, authorize('admin', 'ouvidoria'), adminUpdateTicketStatusController);

export default router;

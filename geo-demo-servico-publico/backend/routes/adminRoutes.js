import { Router } from 'express';
import { listAuditLogsController } from '../controllers/auditController.js';
import {
  adminUpdateTicketStatusController,
  clearDemoDataController,
  dashboardMetricsController,
  dashboardTicketsController,
  seedDemoDataController
} from '../controllers/dashboardController.js';
import { importLogradourosController, listLogradourosController } from '../controllers/logradouroController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.get('/audit', authenticate, authorize('admin'), listAuditLogsController);
router.get('/dashboard/metrics', authenticate, authorize('admin', 'ouvidoria'), dashboardMetricsController);
router.get('/dashboard/tickets', authenticate, authorize('admin', 'ouvidoria'), dashboardTicketsController);
router.patch('/tickets/:id/status', authenticate, authorize('admin', 'ouvidoria'), adminUpdateTicketStatusController);
router.post('/demo-data/seed', authenticate, authorize('admin', 'ouvidoria'), seedDemoDataController);
router.delete('/demo-data', authenticate, authorize('admin', 'ouvidoria'), clearDemoDataController);
router.post('/logradouros/import', authenticate, authorize('admin'), importLogradourosController);
router.get('/logradouros', authenticate, authorize('admin', 'ouvidoria'), listLogradourosController);

export default router;

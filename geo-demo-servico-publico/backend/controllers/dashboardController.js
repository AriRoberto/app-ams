import { getDashboardMetrics, getDashboardTickets } from '../services/dashboardService.js';
import { clearDemoOccurrences, seedDemoOccurrences } from '../services/demoDataService.js';
import { updateOccurrenceStatus } from '../services/occurrenceService.js';

const ALLOWED_STATUS = ['ABERTA', 'EM_ANALISE', 'EM_ATENDIMENTO', 'CONCLUIDA'];

export async function dashboardMetricsController(req, res, next) {
  try {
    const metrics = await getDashboardMetrics(req.query);
    return res.json({ success: true, data: metrics });
  } catch (error) {
    return next(error);
  }
}

export async function dashboardTicketsController(req, res, next) {
  try {
    const list = await getDashboardTickets(req.query);
    return res.json({ success: true, ...list });
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateTicketStatusController(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const statusNovo = String(req.body?.status || '').trim().toUpperCase();

    if (!ALLOWED_STATUS.includes(statusNovo)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    const updated = await updateOccurrenceStatus(id, statusNovo, {
      userId: req.user.id,
      role: req.user.role,
      ipOrigem: req.ip
    });

    if (!updated) return res.status(404).json({ message: 'Chamado não encontrado.' });

    return res.json({ success: true, ...updated });
  } catch (error) {
    return next(error);
  }
}


export async function seedDemoDataController(req, res, next) {
  try {
    const total = Number(req.body?.total || 24);
    const result = await seedDemoOccurrences({ total, requestedBy: req.user?.id });
    return res.status(201).json({ success: true, message: 'Dados de demonstração criados.', data: result });
  } catch (error) {
    return next(error);
  }
}

export async function clearDemoDataController(req, res, next) {
  try {
    const result = await clearDemoOccurrences({ requestedBy: req.user?.id, requestedByEmail: req.user?.email });
    return res.json({ success: true, message: 'Dados de demonstração removidos.', data: result });
  } catch (error) {
    return next(error);
  }
}

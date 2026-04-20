import { getDashboardMetrics, getDashboardTickets } from '../services/dashboardService.js';
import { clearDemoOccurrences, seedDemoOccurrences } from '../services/demoDataService.js';
import { updateOccurrenceStatus } from '../services/occurrenceService.js';
import { EXECUTIVE_RESPONSE_STATUS, OCCURRENCE_STATUS } from '../utils/constants.js';

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
    const executiveResponseStatus = req.body?.executiveResponseStatus
      ? String(req.body.executiveResponseStatus).trim().toUpperCase()
      : null;

    if (!OCCURRENCE_STATUS.includes(statusNovo)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    if (executiveResponseStatus && !EXECUTIVE_RESPONSE_STATUS.includes(executiveResponseStatus)) {
      return res.status(400).json({ message: 'Resposta do Executivo inválida.' });
    }

    const updated = await updateOccurrenceStatus(id, statusNovo, {
      userId: req.user.id,
      role: req.user.role,
      ipOrigem: req.ip
    }, executiveResponseStatus);

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

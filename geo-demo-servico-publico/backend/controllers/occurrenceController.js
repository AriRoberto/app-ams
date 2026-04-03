import { createOccurrence, listOccurrences, updateOccurrenceStatus } from '../services/occurrenceService.js';
import { validateOccurrencePayload } from '../utils/validators.js';

const ALLOWED_STATUS = ['ABERTA', 'EM_ANALISE', 'EM_ATENDIMENTO', 'CONCLUIDA'];

export async function createOccurrenceController(req, res, next) {
  try {
    const validation = validateOccurrencePayload(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const result = await createOccurrence(validation.data, req.user);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function listOccurrencesController(req, res, next) {
  try {
    const data = await listOccurrences(req.user);

    res.json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateOccurrenceStatusController(req, res, next) {
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
    if (!updated) {
      return res.status(404).json({ message: 'Manifestação não encontrada.' });
    }


    return res.json({ success: true, ...updated });
  } catch (error) {
    return next(error);
  }
}

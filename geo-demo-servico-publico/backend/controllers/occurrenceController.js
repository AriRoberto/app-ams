import { createOccurrence, listOccurrences } from '../services/occurrenceService.js';
import { validateOccurrencePayload } from '../utils/validators.js';

export async function createOccurrenceController(req, res, next) {
  try {
    const validation = validateOccurrencePayload(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const result = await createOccurrence(validation.data);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function listOccurrencesController(_req, res, next) {
  try {
    const data = await listOccurrences();

    res.json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    return next(error);
  }
}

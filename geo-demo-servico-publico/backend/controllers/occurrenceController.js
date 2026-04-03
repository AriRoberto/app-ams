import { createOccurrence, listOccurrences } from '../services/occurrenceService.js';
import { validateOccurrencePayload } from '../utils/validators.js';

export function createOccurrenceController(req, res) {
  const validation = validateOccurrencePayload(req.body || {});

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors
    });
  }

  const result = createOccurrence(validation.data);
  return res.status(201).json(result);
}

export function listOccurrencesController(_req, res) {
  res.json({
    success: true,
    total: listOccurrences().length,
    data: listOccurrences()
  });
}

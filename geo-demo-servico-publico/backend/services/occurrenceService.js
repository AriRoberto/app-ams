import { randomUUID } from 'node:crypto';
import { buildInstitutionalEmailPreview } from '../utils/emailBuilder.js';

const OCCURRENCES = [];

export function createOccurrence(payload) {
  const occurrence = {
    id: randomUUID(),
    ...payload,
    dataHoraRegistro: new Date().toISOString()
  };

  const emailPreview = buildInstitutionalEmailPreview(occurrence);
  OCCURRENCES.push(occurrence);

  return {
    success: true,
    occurrence,
    emailPreview
  };
}

export function listOccurrences() {
  return OCCURRENCES;
}

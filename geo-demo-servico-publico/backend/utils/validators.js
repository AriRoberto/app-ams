import { DESTINATARIOS, OCCURRENCE_TYPES } from './constants.js';

export function sanitizeText(value, max = 300) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
}

export function validateOccurrencePayload(payload) {
  const nomeCidadao = sanitizeText(payload.nomeCidadao, 120);
  const tipoOcorrencia = sanitizeText(payload.tipoOcorrencia, 64);
  const descricao = sanitizeText(payload.descricao, 1200);
  const pontoReferencia = sanitizeText(payload.pontoReferencia, 240);
  const destinatario = sanitizeText(payload.destinatario, 64);
  const emailDestino = sanitizeText(payload.emailDestino, 180).toLowerCase();
  const cidade = sanitizeText(payload.cidade, 120);
  const uf = sanitizeText(payload.uf, 2).toUpperCase();
  const ibge_id = Number(payload.ibge_id);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  const errors = [];

  if (nomeCidadao.length < 3) errors.push('nomeCidadao deve ter pelo menos 3 caracteres.');
  if (!OCCURRENCE_TYPES.includes(tipoOcorrencia)) errors.push('tipoOcorrencia inválido.');
  if (descricao.length < 10) errors.push('descricao deve ter pelo menos 10 caracteres.');
  if (pontoReferencia.length < 5) errors.push('pontoReferencia deve ter pelo menos 5 caracteres.');
  if (!DESTINATARIOS.includes(destinatario)) errors.push('destinatario inválido.');
  if (!isValidEmail(emailDestino)) errors.push('emailDestino inválido.');
  if (cidade.length < 3) errors.push('cidade inválida.');
  if (uf.length !== 2) errors.push('uf inválida.');
  if (!Number.isInteger(ibge_id)) errors.push('ibge_id inválido.');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) errors.push('latitude/longitude inválidas.');

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      nomeCidadao,
      tipoOcorrencia,
      descricao,
      pontoReferencia,
      destinatario,
      emailDestino,
      cidade,
      uf,
      ibge_id,
      latitude,
      longitude
    }
  };
}

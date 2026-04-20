import { DESTINATARIOS, OCCURRENCE_TYPES } from './constants.js';

export function sanitizeText(value, max = 300) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
}

export function normalizeCpf(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (base, factor) => {
    let total = 0;
    for (let index = 0; index < base.length; index += 1) {
      total += Number(base[index]) * (factor - index);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const digit1 = calculateDigit(cpf.slice(0, 9), 10);
  const digit2 = calculateDigit(cpf.slice(0, 10), 11);
  return cpf.endsWith(`${digit1}${digit2}`);
}

export function validateRegistrationPayload(payload = {}) {
  const nome = sanitizeText(payload.nome, 120);
  const email = sanitizeText(payload.email, 180).toLowerCase();
  const cpf = normalizeCpf(payload.cpf);
  const password = String(payload.password || '');
  const role = sanitizeText(payload.role, 20).toLowerCase() || 'cidadao';
  const errors = [];

  if (nome.length < 3) errors.push('nome deve ter pelo menos 3 caracteres.');
  if (!isValidEmail(email)) errors.push('email inválido.');
  if (!isValidCpf(cpf)) errors.push('cpf inválido.');
  if (password.length < 8) errors.push('password deve ter pelo menos 8 caracteres.');
  if (!/[A-Z]/.test(password)) errors.push('password deve ter ao menos uma letra maiúscula.');
  if (!/[a-z]/.test(password)) errors.push('password deve ter ao menos uma letra minúscula.');
  if (!/\d/.test(password)) errors.push('password deve ter ao menos um número.');
  if (!/[^\w\s]/.test(password)) errors.push('password deve ter ao menos um caractere especial.');
  if (!['cidadao', 'admin', 'ouvidoria'].includes(role)) errors.push('role inválida.');

  return {
    isValid: errors.length === 0,
    errors,
    data: { nome, email, cpf, password, role }
  };
}

export function validateOccurrencePayload(payload) {
  const nomeCidadao = sanitizeText(payload.nomeCidadao, 120);
  const tipoOcorrencia = sanitizeText(payload.tipoOcorrencia, 64);
  const descricao = sanitizeText(payload.descricao, 1200);
  const pontoReferencia = sanitizeText(payload.pontoReferencia, 240);
  const destinatario = sanitizeText(payload.destinatario, 64);
  const bairro = sanitizeText(payload.bairro, 120);
  const priority = sanitizeText(payload.priority, 20).toLowerCase() || 'normal';
  const emailDestino = sanitizeText(payload.emailDestino, 180).toLowerCase();
  const cidade = sanitizeText(payload.cidade, 120);
  const uf = sanitizeText(payload.uf, 2).toUpperCase();
  const ibge_id = Number(payload.ibge_id);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const requirementFormEnabled = Boolean(payload.requirementFormEnabled);
  const requirementFormData = requirementFormEnabled
    ? {
        assunto: sanitizeText(payload.requirementFormData?.assunto, 180),
        texto: sanitizeText(payload.requirementFormData?.texto, 2000)
      }
    : null;

  const errors = [];

  if (nomeCidadao.length < 3) errors.push('nomeCidadao deve ter pelo menos 3 caracteres.');
  if (!OCCURRENCE_TYPES.includes(tipoOcorrencia)) errors.push('tipoOcorrencia inválido.');
  if (descricao.length < 10) errors.push('descricao deve ter pelo menos 10 caracteres.');
  if (pontoReferencia.length < 5) errors.push('pontoReferencia deve ter pelo menos 5 caracteres.');
  if (!DESTINATARIOS.includes(destinatario)) errors.push('destinatario inválido.');
  if (!bairro) errors.push('bairro é obrigatório.');
  if (!['baixa', 'normal', 'alta'].includes(priority)) errors.push('priority inválida. Use: baixa|normal|alta.');
  if (!isValidEmail(emailDestino)) errors.push('emailDestino inválido.');
  if (cidade.length < 3) errors.push('cidade inválida.');
  if (uf.length !== 2) errors.push('uf inválida.');
  if (!Number.isInteger(ibge_id)) errors.push('ibge_id inválido.');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) errors.push('latitude/longitude inválidas.');
  if (requirementFormEnabled && requirementFormData.assunto.length < 3) errors.push('assunto do requerimento deve ter pelo menos 3 caracteres.');
  if (requirementFormEnabled && requirementFormData.texto.length < 10) errors.push('texto do requerimento deve ter pelo menos 10 caracteres.');

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      nomeCidadao,
      tipoOcorrencia,
      descricao,
      pontoReferencia,
      destinatario,
      bairro: bairro || 'Não informado',
      priority,
      emailDestino,
      cidade,
      uf,
      ibge_id,
      latitude,
      longitude,
      requirementFormEnabled,
      requirementFormData
    }
  };
}

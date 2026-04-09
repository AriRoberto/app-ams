export const COLUMN_ALIASES = {
  logradouro: ['logradouro', 'logradouros', 'nome_logradouro', 'nome logradouro', 'logradouro_publico', 'logradouro_publico_nominado', 'logradouros_publicos_nominados', 'rua', 'endereco', 'endereço', 'logradouro_nome'],
  bairro: ['bairro', 'bairros', 'bairro_nome', 'nome_bairro', 'bairro_zona', 'bairro/zona'],
  zona: ['zona', 'setor', 'regiao', 'região'],
  tipo: ['tipo', 'tipo_logradouro', 'classificacao'],
  cep: ['cep', 'codigo_cep', 'código_cep', 'codigo cep']
};

export function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function detectColumnMapping(headers = []) {
  const normalizedToOriginal = new Map(headers.map((header) => [normalizeHeader(header), header]));
  const mapping = {};

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const alias = aliases.find((item) => normalizedToOriginal.has(normalizeHeader(item)));
    if (alias) {
      mapping[field] = normalizedToOriginal.get(normalizeHeader(alias));
    }
  }

  return mapping;
}

export function findHeaderRowIndex(sheetRows = [], maxScanRows = 120) {
  const scanLimit = Math.min(maxScanRows, sheetRows.length);

  for (let index = 0; index < scanLimit; index += 1) {
    const row = sheetRows[index] || [];
    const headers = row.map((cell) => String(cell || '').trim()).filter(Boolean);
    if (!headers.length) continue;

    const mapping = detectColumnMapping(headers);
    if (mapping.logradouro && mapping.bairro) {
      return index;
    }
  }

  return -1;
}

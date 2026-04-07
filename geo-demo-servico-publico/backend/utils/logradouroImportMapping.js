export const COLUMN_ALIASES = {
  logradouro: ['logradouro', 'nome_logradouro', 'nome logradouro', 'rua', 'endereco', 'endereço', 'logradouro_nome'],
  bairro: ['bairro', 'bairro_nome', 'nome_bairro'],
  zona: ['zona', 'setor', 'regiao', 'região'],
  tipo: ['tipo', 'tipo_logradouro', 'classificacao'],
  cep: ['cep', 'codigo_cep', 'código_cep', 'codigo cep']
};

function normalizeHeader(value) {
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

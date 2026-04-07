import test from 'node:test';
import assert from 'node:assert/strict';
import { detectColumnMapping } from '../utils/logradouroImportMapping.js';

test('detectColumnMapping identifica colunas equivalentes da planilha', () => {
  const headers = ['Nome Logradouro', 'Bairro', 'Zona', 'Tipo Logradouro', 'CEP'];
  const mapping = detectColumnMapping(headers);

  assert.equal(mapping.logradouro, 'Nome Logradouro');
  assert.equal(mapping.bairro, 'Bairro');
  assert.equal(mapping.zona, 'Zona');
  assert.equal(mapping.tipo, 'Tipo Logradouro');
  assert.equal(mapping.cep, 'CEP');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectColumnMapping, findHeaderRowIndex } from '../utils/logradouroImportMapping.js';

test('detectColumnMapping identifica colunas equivalentes da planilha', () => {
  const headers = ['Nome Logradouro', 'Bairro', 'Zona', 'Tipo Logradouro', 'CEP'];
  const mapping = detectColumnMapping(headers);

  assert.equal(mapping.logradouro, 'Nome Logradouro');
  assert.equal(mapping.bairro, 'Bairro');
  assert.equal(mapping.zona, 'Zona');
  assert.equal(mapping.tipo, 'Tipo Logradouro');
  assert.equal(mapping.cep, 'CEP');
});

test('findHeaderRowIndex ignora linha de título e encontra cabeçalho real', () => {
  const rows = [
    ['LOGRADOUROS PÚBLICOS NOMINADOS DO MUNICÍPIO DE SÃO VICENTE DE MINAS', '', '', ''],
    ['LOGRADOURO', 'BAIRRO', 'ZONA', 'CEP'],
    ['Rua A', 'Centro', 'Urbana', '36370000']
  ];

  const index = findHeaderRowIndex(rows);
  assert.equal(index, 1);
});

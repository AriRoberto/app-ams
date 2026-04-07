import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOccurrenceRow } from '../utils/occurrenceMapper.js';

test('exibe bairro da ocorrência em listagem/detalhes quando informado', () => {
  const row = formatOccurrenceRow({ id: '1', bairro: 'Cidade Nova' });
  assert.equal(row.bairro, 'Cidade Nova');
});

test('exibe Não informado para registros legados sem bairro', () => {
  const row = formatOccurrenceRow({ id: '2', bairro: null });
  assert.equal(row.bairro, 'Não informado');
});

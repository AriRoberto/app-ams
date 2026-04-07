import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOccurrencePayload } from '../utils/validators.js';

function payloadBase() {
  return {
    nomeCidadao: 'Maria da Silva',
    tipoOcorrencia: 'BURACO_NA_RUA',
    descricao: 'Há um buraco grande na rua principal perto da praça.',
    pontoReferencia: 'Em frente ao mercado central',
    destinatario: 'PREFEITURA',
    emailDestino: 'contato@prefeitura.gov.br',
    cidade: 'São Vicente de Minas',
    uf: 'MG',
    ibge_id: 3165305,
    latitude: -21.703333,
    longitude: -44.443889,
    priority: 'normal'
  };
}

test('criação com bairro válido é aceita', () => {
  const result = validateOccurrencePayload({ ...payloadBase(), bairro: 'Centro' });
  assert.equal(result.isValid, true);
  assert.equal(result.data.bairro, 'Centro');
});

test('bairro inválido é rejeitado', () => {
  const result = validateOccurrencePayload({ ...payloadBase(), bairro: 'Bairro Inexistente' });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((item) => item.includes('bairro inválido')));
});

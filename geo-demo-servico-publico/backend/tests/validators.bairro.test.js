import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, validateOccurrencePayload, validateRegistrationPayload } from '../utils/validators.js';

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

test('validação de CPF aceita documento válido', () => {
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('52998224725'), true);
});

test('validação de CPF rejeita documento inválido', () => {
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('529.982.247-24'), false);
});

test('cadastro rejeita senha fraca e CPF inválido', () => {
  const result = validateRegistrationPayload({
    nome: 'Usuário Teste',
    email: 'usuario@demo.local',
    cpf: '12345678900',
    password: '123456',
    role: 'cidadao'
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((item) => item.includes('cpf inválido')));
  assert.ok(result.errors.some((item) => item.includes('password deve ter pelo menos 8 caracteres')));
});

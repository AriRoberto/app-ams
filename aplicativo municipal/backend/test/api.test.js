import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ams-test-'));
const dbFile = path.join(tempDir, 'db.json');
await fs.writeFile(dbFile, '{"users":[],"requests":[]}\n', 'utf-8');

process.env.NODE_ENV = 'test';
process.env.DB_FILE = dbFile;

const { default: app } = await import('../src/server.js');

const server = app.listen(0);
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

test.after(async () => {
  server.close();
  await fs.rm(tempDir, { recursive: true, force: true });
});

test('registers user and creates request', async () => {
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Teste User',
      cpf: '12345678901',
      email: 'user@test.local'
    })
  });

  assert.equal(registerRes.status, 201);
  const registerData = await registerRes.json();
  assert.ok(registerData.user.id);

  const requestRes = await fetch(`${baseUrl}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registerData.user.id,
      category: 'LIMPEZA_URBANA',
      descricao: 'Lixo acumulado na calçada principal.',
      endereco: 'Rua Exemplo, 100',
      latitude: -23.56,
      longitude: -46.63
    })
  });

  assert.equal(requestRes.status, 201);
  const requestData = await requestRes.json();
  assert.equal(requestData.status, 'RECEBIDO');
  assert.match(requestData.protocol, /^AMS-/);

  const listRes = await fetch(`${baseUrl}/api/requests?userId=${registerData.user.id}`);
  assert.equal(listRes.status, 200);
  const list = await listRes.json();
  assert.equal(list.length, 1);
});

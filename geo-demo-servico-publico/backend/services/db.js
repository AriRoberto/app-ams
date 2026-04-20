import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../db/schema.sql');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'geo',
  password: process.env.DB_PASSWORD || 'geo',
  database: process.env.DB_NAME || 'geo_demo',
  max: 10
});

async function seedDefaultUsers() {
  const users = [
    { nome: 'Admin Demo', email: 'admin@demo.local', cpf: '11144477735', role: 'admin', password: 'Admin@123' },
    { nome: 'Ouvidoria Demo', email: 'ouvidoria@demo.local', cpf: '39053344705', role: 'ouvidoria', password: 'Ouvidoria@123' },
    { nome: 'Cidadao Demo', email: 'cidadao@demo.local', cpf: '52998224725', role: 'cidadao', password: 'Cidadao@123' }
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (id, nome, email, cpf, role, password_hash, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (email) DO UPDATE
       SET nome = EXCLUDED.nome,
           cpf = COALESCE(users.cpf, EXCLUDED.cpf),
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash,
           email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at)`,
      [randomUUID(), user.nome, user.email, user.cpf, user.role, passwordHash]
    );
  }
}

export async function initDatabase() {
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  await seedDefaultUsers();
}

export async function query(text, values = []) {
  return pool.query(text, values);
}

export function getClient() {
  return pool.connect();
}

export async function closeDatabase() {
  await pool.end();
}

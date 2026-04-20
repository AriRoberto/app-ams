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
    { nome: 'Admin Demo', email: 'admin@demo.local', role: 'admin', password: 'Admin@123', cpf: '00000000191', emailVerified: true },
    { nome: 'Ouvidoria Demo', email: 'ouvidoria@demo.local', role: 'ouvidoria', password: 'Ouvidoria@123', cpf: '00000000272', emailVerified: true },
    { nome: 'Cidadao Demo', email: 'cidadao@demo.local', role: 'cidadao', password: 'Cidadao@123', cpf: '00000000353', emailVerified: true }
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (id, nome, email, cpf, role, password_hash, email_verified, email_confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (email) DO UPDATE
         SET cpf = COALESCE(users.cpf, EXCLUDED.cpf),
             email_verified = COALESCE(users.email_verified, EXCLUDED.email_verified),
             email_confirmed_at = COALESCE(users.email_confirmed_at, NOW())`,
      [randomUUID(), user.nome, user.email, user.cpf, user.role, passwordHash, user.emailVerified]
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

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

export async function initDatabase() {
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');
  await pool.query(schemaSql);
}

export async function query(text, values = []) {
  return pool.query(text, values);
}

export async function closeDatabase() {
  await pool.end();
}

import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function parseExpiryToDate(expiry) {
  const now = Date.now();
  const value = String(expiry).trim();
  if (value.endsWith('d')) return new Date(now + Number(value.slice(0, -1)) * 86400000);
  if (value.endsWith('h')) return new Date(now + Number(value.slice(0, -1)) * 3600000);
  if (value.endsWith('m')) return new Date(now + Number(value.slice(0, -1)) * 60000);
  return new Date(now + 7 * 86400000);
}

export function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export async function generateRefreshToken(user) {
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  const tokenHash = hashToken(token);

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), user.id, tokenHash, parseExpiryToDate(REFRESH_EXPIRES_IN)]
  );

  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export async function verifyRefreshToken(token) {
  const payload = jwt.verify(token, REFRESH_SECRET);
  const tokenHash = hashToken(token);

  const result = await query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!result.rowCount) {
    throw new Error('Refresh token inválido ou revogado.');
  }

  return payload;
}

export async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}

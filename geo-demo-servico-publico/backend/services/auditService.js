import { query } from './db.js';

export async function logStatusChange({ manifestacaoId, userId, role, statusAnterior, statusNovo, ipOrigem }) {
  await query(
    `INSERT INTO audit_logs (
      manifestacao_id, usuario_id, role, acao,
      status_anterior, status_novo, ip_origem, details
    ) VALUES ($1, $2, $3, 'UPDATE_STATUS', $4, $5, $6, $7::jsonb)`,
    [manifestacaoId, userId, role, statusAnterior, statusNovo, ipOrigem, JSON.stringify({ source: 'api' })]
  );
}

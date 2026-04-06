import { query } from '../services/db.js';

export async function listAuditLogsController(_req, res, next) {
  try {
    const logs = await query(
      `SELECT id, manifestacao_id, usuario_id, role, acao, status_anterior,
              status_novo, ip_origem, timestamp, details
       FROM audit_logs
       ORDER BY timestamp DESC
       LIMIT 200`
    );

    res.json({ success: true, total: logs.rowCount, data: logs.rows });
  } catch (error) {
    next(error);
  }
}

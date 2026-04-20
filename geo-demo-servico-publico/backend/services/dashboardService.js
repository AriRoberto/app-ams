import { query } from './db.js';
import { calculateSlaCompliance, classifySlaStatus, getRemainingTimeLabel } from './slaService.js';

function buildFilters(params = {}) {
  const where = [];
  const values = [];

  if (params.bairro) {
    values.push(params.bairro);
    where.push(`o.bairro = $${values.length}`);
  }
  if (params.categoria) {
    values.push(params.categoria);
    where.push(`o.occurrence_type = $${values.length}`);
  }
  if (params.status) {
    values.push(params.status);
    where.push(`o.status = $${values.length}`);
  }
  if (params.dataInicio) {
    values.push(params.dataInicio);
    where.push(`o.created_at >= $${values.length}`);
  }
  if (params.dataFim) {
    values.push(params.dataFim);
    where.push(`o.created_at <= $${values.length}`);
  }

  return {
    values,
    whereClause: where.length ? `WHERE ${where.join(' AND ')}` : ''
  };
}

export async function getDashboardTickets(params = {}) {
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const { values, whereClause } = buildFilters(params);
  const listSql = `SELECT o.id,
                          o.bairro,
                          o.occurrence_type AS categoria,
                          o.status,
                          o.executive_response_status,
                          o.requirement_form_enabled,
                          o.created_at,
                          o.sla_deadline,
                          o.resolved_at,
                          o.citizen_name AS "nomeCidadao",
                          u.nome AS "usuarioNome",
                          u.email AS "usuarioEmail",
                          u.cpf AS "usuarioCpf"
                   FROM occurrences o
                   LEFT JOIN users u ON u.id = o.user_id
                   ${whereClause}
                   ORDER BY o.created_at DESC
                   LIMIT ${pageSize} OFFSET ${offset}`;

  const totalSql = `SELECT COUNT(*)::int AS total FROM occurrences o ${whereClause}`;

  const [list, total] = await Promise.all([
    query(listSql, values),
    query(totalSql, values)
  ]);

  const mapped = list.rows.map((row) => {
    const slaStatus = classifySlaStatus({
      status: row.status,
      createdAt: row.created_at,
      slaDeadline: row.sla_deadline
    });

    return {
      ...row,
      sla_status: slaStatus,
      tempo_restante: getRemainingTimeLabel(row.sla_deadline || row.created_at)
    };
  });

  return {
    page,
    pageSize,
    total: total.rows[0]?.total || 0,
    data: mapped
  };
}

export async function getDashboardMetrics(params = {}) {
  const tickets = await getDashboardTickets({ ...params, page: 1, pageSize: 1000 });
  const rows = tickets.data;

  const volumeTotal = rows.length;
  const violados = rows.filter((r) => r.sla_status === 'violado').length;
  const atencao = rows.filter((r) => r.sla_status === 'atencao').length;
  const conformidadeSla = calculateSlaCompliance(volumeTotal, violados);

  const resolved = rows.filter((r) => r.resolved_at);
  const avgMs = resolved.length
    ? resolved.reduce((acc, r) => acc + (new Date(r.resolved_at) - new Date(r.created_at)), 0) / resolved.length
    : 0;

  return {
    volumeTotal,
    totalViolado: violados,
    totalAtencao: atencao,
    conformidadeSla,
    tempoMedioAtendimentoHoras: Number((avgMs / 3600000).toFixed(2))
  };
}

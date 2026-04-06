import { randomUUID } from 'node:crypto';
import { buildInstitutionalEmailPreview } from '../utils/emailBuilder.js';
import { enqueueInstitutionalEmail } from './emailQueueService.js';
import { logStatusChange } from './auditService.js';
import { query } from './db.js';
import { calculateSlaDeadline } from './slaService.js';

export async function createOccurrence(payload, user) {
  const occurrence = {
    id: randomUUID(),
    ...payload,
    bairro: payload.bairro || 'Não informado',
    priority: payload.priority || 'normal',
    userId: user.id,
    dataHoraRegistro: new Date().toISOString(),
    status: 'ABERTA',
    slaDeadline: calculateSlaDeadline(new Date())
  };

  await query(
    `INSERT INTO occurrences (
      id, citizen_name, user_id, occurrence_type, description, reference_point,
      bairro, priority, destination_role, destination_email,
      city, uf, ibge_id, status, sla_deadline, location, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      ST_SetSRID(ST_MakePoint($16, $17), 4326)::geography, $18
    )`,
    [
      occurrence.id,
      occurrence.nomeCidadao,
      occurrence.userId,
      occurrence.tipoOcorrencia,
      occurrence.descricao,
      occurrence.pontoReferencia,
      occurrence.bairro,
      occurrence.priority,
      occurrence.destinatario,
      occurrence.emailDestino,
      occurrence.cidade,
      occurrence.uf,
      occurrence.ibge_id,
      occurrence.status,
      occurrence.slaDeadline,
      occurrence.longitude,
      occurrence.latitude,
      occurrence.dataHoraRegistro
    ]
  );

  const emailPreview = buildInstitutionalEmailPreview(occurrence);

  await enqueueInstitutionalEmail({
    occurrenceId: occurrence.id,
    to: emailPreview.destinatario,
    subject: emailPreview.assunto,
    text: emailPreview.corpo,
    html: `<pre>${emailPreview.corpo.replaceAll('\n', '<br/>')}</pre>`
  });

  return {
    success: true,
    occurrence,
    emailPreview,
    delivery: 'enfileirada'
  };
}

export async function listOccurrences(user) {
  const baseQuery = `SELECT
      id,
      user_id AS "userId",
      citizen_name AS "nomeCidadao",
      occurrence_type AS "tipoOcorrencia",
      description AS descricao,
      reference_point AS "pontoReferencia",
      bairro,
      priority,
      destination_role AS destinatario,
      destination_email AS "emailDestino",
      city AS cidade,
      uf,
      ibge_id,
      status,
      sla_deadline AS "slaDeadline",
      resolved_at AS "resolvedAt",
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at AS "dataHoraRegistro"
    FROM occurrences`;

  if (user.role === 'cidadao') {
    const result = await query(`${baseQuery} WHERE user_id = $1 ORDER BY created_at DESC`, [user.id]);
    return result.rows;
  }

  const result = await query(`${baseQuery} ORDER BY created_at DESC`);
  return result.rows;
}

export async function updateOccurrenceStatus(id, novoStatus, auditContext) {
  const oldData = await query('SELECT id, status FROM occurrences WHERE id = $1', [id]);
  if (!oldData.rowCount) return null;

  const statusAnterior = oldData.rows[0].status;
  const updated = await query(
    `UPDATE occurrences
     SET status = $2,
         resolved_at = CASE WHEN $2 = 'CONCLUIDA' THEN NOW() ELSE resolved_at END
     WHERE id = $1
     RETURNING id, status AS "statusNovo"`,
    [id, novoStatus]
  );

  const payload = {
    manifestacaoId: id,
    statusAnterior,
    statusNovo: updated.rows[0].statusNovo
  };

  if (auditContext) {
    await logStatusChange({
      manifestacaoId: payload.manifestacaoId,
      userId: auditContext.userId,
      role: auditContext.role,
      statusAnterior: payload.statusAnterior,
      statusNovo: payload.statusNovo,
      ipOrigem: auditContext.ipOrigem
    });
  }

  return payload;
}

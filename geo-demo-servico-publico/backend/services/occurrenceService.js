import { randomUUID } from 'node:crypto';
import { buildInstitutionalEmailPreview } from '../utils/emailBuilder.js';
import { query } from './db.js';

export async function createOccurrence(payload) {
  const occurrence = {
    id: randomUUID(),
    ...payload,
    dataHoraRegistro: new Date().toISOString()
  };

  await query(
    `INSERT INTO occurrences (
      id, citizen_name, occurrence_type, description, reference_point,
      destination_role, destination_email, city, uf, ibge_id, location, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326)::geography, $13
    )`,
    [
      occurrence.id,
      occurrence.nomeCidadao,
      occurrence.tipoOcorrencia,
      occurrence.descricao,
      occurrence.pontoReferencia,
      occurrence.destinatario,
      occurrence.emailDestino,
      occurrence.cidade,
      occurrence.uf,
      occurrence.ibge_id,
      occurrence.longitude,
      occurrence.latitude,
      occurrence.dataHoraRegistro
    ]
  );

  await query(
    `INSERT INTO audit_logs (occurrence_id, action, actor, details)
     VALUES ($1, 'CREATE_OCCURRENCE', 'SYSTEM', $2::jsonb)`,
    [occurrence.id, JSON.stringify({ source: 'web_or_mobile_demo' })]
  );

  const emailPreview = buildInstitutionalEmailPreview(occurrence);

  return {
    success: true,
    occurrence,
    emailPreview
  };
}

export async function listOccurrences() {
  const result = await query(
    `SELECT
      id,
      citizen_name AS "nomeCidadao",
      occurrence_type AS "tipoOcorrencia",
      description AS descricao,
      reference_point AS "pontoReferencia",
      destination_role AS destinatario,
      destination_email AS "emailDestino",
      city AS cidade,
      uf,
      ibge_id,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at AS "dataHoraRegistro"
    FROM occurrences
    ORDER BY created_at DESC`
  );

  return result.rows;
}

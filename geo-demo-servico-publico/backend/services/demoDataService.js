import { randomUUID } from 'node:crypto';
import { sendInstitutionalEmail } from './emailTransport.js';
import { query } from './db.js';
import { calculateSlaDeadline, classifySlaStatus } from './slaService.js';

const DEMO_CLEANUP_NOTIFY_TO = 'ariroberto@gmail.com';

const BAIRROS = ['Centro', 'Nossa Senhora Aparecida', 'Rosário', 'Cachoeirinha', 'Santo Antônio', 'Boa Vista'];
const CATEGORIAS = ['BURACO_NA_RUA', 'ILUMINACAO_PUBLICA', 'LIMPEZA_URBANA', 'AGUA_ESGOTO'];
const STATUS = ['ABERTA', 'EM_ANALISE', 'EM_ATENDIMENTO', 'CONCLUIDA'];
const PRIORITIES = ['baixa', 'normal', 'alta'];

function formatTs(d) {
  return new Date(d).toISOString();
}

function buildRecord(index, now = new Date()) {
  const bucket = index % 3; // 0: vencido, 1: a vencer, 2: em dia
  let createdAt;
  let status;

  if (bucket === 0) {
    createdAt = new Date(now.getTime() - (96 + index) * 3600000);
    status = STATUS[index % 3];
  } else if (bucket === 1) {
    createdAt = new Date(now.getTime() - (60 + (index % 5)) * 3600000);
    status = ['ABERTA', 'EM_ANALISE', 'EM_ATENDIMENTO'][index % 3];
  } else {
    createdAt = new Date(now.getTime() - (18 + (index % 10)) * 3600000);
    status = STATUS[index % STATUS.length];
  }

  const slaDeadline = calculateSlaDeadline(createdAt);
  const resolvedAt = status === 'CONCLUIDA' ? new Date(createdAt.getTime() + 6 * 3600000) : null;

  return {
    id: randomUUID(),
    citizenName: `Demo Cidadão ${index + 1}`,
    occurrenceType: CATEGORIAS[index % CATEGORIAS.length],
    description: `Registro de demonstração #${index + 1} para análise de SLA no painel administrativo.`,
    referencePoint: `Próximo à praça ${index + 1}`,
    bairro: BAIRROS[index % BAIRROS.length],
    priority: PRIORITIES[index % PRIORITIES.length],
    destinationRole: 'PREFEITURA',
    destinationEmail: 'ouvidoria@saovicentedeminas.mg.gov.br',
    city: 'São Vicente de Minas',
    uf: 'MG',
    ibgeId: 3165305,
    status,
    createdAt,
    slaDeadline,
    resolvedAt,
    latitude: -21.703333 + ((index % 8) * 0.0012),
    longitude: -44.443889 + ((index % 8) * 0.0011)
  };
}

export function buildDemoDataset({ total = 24, now = new Date() } = {}) {
  const count = Math.max(20, Number(total || 20));
  return Array.from({ length: count }, (_, idx) => buildRecord(idx, now));
}

function summarizeSla(records, now = new Date()) {
  return records.reduce(
    (acc, record) => {
      const label = classifySlaStatus({
        status: record.status,
        createdAt: record.createdAt,
        slaDeadline: record.slaDeadline,
        now
      });
      acc[label] += 1;
      return acc;
    },
    { ok: 0, atencao: 0, violado: 0 }
  );
}

async function findDemoUserId() {
  const user = await query(`SELECT id FROM users WHERE email = 'cidadao@demo.local' LIMIT 1`);
  return user.rows[0]?.id || null;
}

export async function seedDemoOccurrences({ total = 24, requestedBy }) {
  const records = buildDemoDataset({ total });
  const userId = await findDemoUserId();

  for (const record of records) {
    await query(
      `INSERT INTO occurrences (
        id, citizen_name, user_id, occurrence_type, description, reference_point,
        bairro, priority, destination_role, destination_email,
        city, uf, ibge_id, status, sla_deadline, resolved_at, is_demo, location, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17,
        ST_SetSRID(ST_MakePoint($18, $19), 4326)::geography, $20
      )`,
      [
        record.id,
        record.citizenName,
        userId,
        record.occurrenceType,
        record.description,
        record.referencePoint,
        record.bairro,
        record.priority,
        record.destinationRole,
        record.destinationEmail,
        record.city,
        record.uf,
        record.ibgeId,
        record.status,
        formatTs(record.slaDeadline),
        record.resolvedAt ? formatTs(record.resolvedAt) : null,
        true,
        record.longitude,
        record.latitude,
        formatTs(record.createdAt)
      ]
    );
  }

  const summary = summarizeSla(records);
  // eslint-disable-next-line no-console
  console.log(`[demo-data] seed criado por ${requestedBy || 'desconhecido'} | total=${records.length}`);

  return { inserted: records.length, summary };
}

export async function clearDemoOccurrences({ requestedBy, requestedByEmail }) {
  const countResult = await query('SELECT COUNT(*)::int AS total FROM occurrences WHERE is_demo = TRUE');
  const total = countResult.rows[0]?.total || 0;

  await query('DELETE FROM occurrences WHERE is_demo = TRUE');

  const timestamp = new Date().toISOString();
  const subject = '[Geo Demo] Dados de demonstração removidos';
  const text = [
    'Os dados de demonstração/teste foram removidos do sistema.',
    `Data/Hora: ${timestamp}`,
    `Quantidade removida: ${total}`,
    `Executado por: ${requestedByEmail || requestedBy || 'não informado'}`
  ].join('\n');

  await sendInstitutionalEmail({
    to: DEMO_CLEANUP_NOTIFY_TO,
    subject,
    text,
    html: `<pre>${text.replaceAll('\n', '<br/>')}</pre>`
  });

  // eslint-disable-next-line no-console
  console.log(`[demo-data] limpeza executada por ${requestedBy || 'desconhecido'} | removidos=${total}`);

  return {
    removed: total,
    notified: DEMO_CLEANUP_NOTIFY_TO,
    timestamp
  };
}


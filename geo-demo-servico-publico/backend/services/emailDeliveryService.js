import { query } from './db.js';

export async function registerEmailQueued(occurrenceId) {
  await query(
    `INSERT INTO email_deliveries (occurrence_id, status)
     VALUES ($1, 'pendente')`,
    [occurrenceId]
  );
}

export async function markEmailSuccess({ occurrenceId, providerMessageId }) {
  await query(
    `UPDATE occurrences
     SET email_status = 'sucesso', email_last_error = NULL, email_sent_at = NOW()
     WHERE id = $1`,
    [occurrenceId]
  );

  await query(
    `UPDATE email_deliveries
     SET status = 'sucesso', enviado_em = NOW(), provider_message_id = $2
     WHERE id = (
       SELECT id FROM email_deliveries
       WHERE occurrence_id = $1
       ORDER BY queued_at DESC
       LIMIT 1
     )`,
    [occurrenceId, providerMessageId || null]
  );
}

export async function markEmailFailure({ occurrenceId, errorMessage }) {
  await query(
    `UPDATE occurrences
     SET email_status = 'falha', email_last_error = $2
     WHERE id = $1`,
    [occurrenceId, errorMessage]
  );

  await query(
    `UPDATE email_deliveries
     SET status = 'falha', erro = $2
     WHERE id = (
       SELECT id FROM email_deliveries
       WHERE occurrence_id = $1
       ORDER BY queued_at DESC
       LIMIT 1
     )`,
    [occurrenceId, errorMessage]
  );
}

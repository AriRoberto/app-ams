-- Migration: status de encaminhamento/resposta do Executivo e dados opcionais de requerimento.
ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS executive_response_status TEXT
  CHECK (executive_response_status IN ('DEFERIDO', 'INDEFERIDO'));

ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS requirement_form_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS requirement_form_data JSONB;


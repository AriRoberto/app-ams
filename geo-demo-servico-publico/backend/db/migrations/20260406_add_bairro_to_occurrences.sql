-- Migration: adiciona bairro na tabela occurrences com compatibilidade retroativa.
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS bairro TEXT;

UPDATE occurrences
SET bairro = 'Não informado'
WHERE bairro IS NULL OR TRIM(bairro) = '';

ALTER TABLE occurrences
  ALTER COLUMN bairro SET DEFAULT 'Não informado';

CREATE INDEX IF NOT EXISTS idx_occurrences_bairro ON occurrences (bairro);

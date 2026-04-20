-- Script: carga robusta de logradouros a partir de CSV convertido do XLS
-- Uso recomendado no psql (ajuste o caminho do arquivo no \copy):
-- \i backend/db/scripts/insert_logradouros_from_csv.sql

BEGIN;

-- 1) Garante estrutura mínima da tabela alvo
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS logradouros (
  id UUID PRIMARY KEY,
  logradouro TEXT NOT NULL,
  bairro TEXT NOT NULL,
  zona TEXT,
  tipo TEXT,
  cep TEXT,
  source_file TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (logradouro, bairro, zona)
);

-- 2) Tabela temporária de estágio (evita erro por formato/campos vazios)
DROP TABLE IF EXISTS tmp_logradouros_import;
CREATE TEMP TABLE tmp_logradouros_import (
  logradouro_raw TEXT,
  bairro_raw TEXT,
  zona_raw TEXT,
  tipo_raw TEXT,
  cep_raw TEXT
);

-- 3) Importação do CSV para staging
-- IMPORTANTE:
-- - ajuste o caminho abaixo para o seu ambiente
-- - CSV precisa ter cabeçalho e delimitador ';'
-- - encoding UTF-8 (ou rode iconv antes)
\copy tmp_logradouros_import (logradouro_raw, bairro_raw, zona_raw, tipo_raw, cep_raw)
FROM './Logradouross_Zonas.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ';', ENCODING 'UTF8', QUOTE '"');

-- 4) Normalização + INSERT idempotente
INSERT INTO logradouros (
  id,
  logradouro,
  bairro,
  zona,
  tipo,
  cep,
  source_file,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  NULLIF(trim(regexp_replace(logradouro_raw, '\\s+', ' ', 'g')), '') AS logradouro,
  NULLIF(trim(regexp_replace(bairro_raw, '\\s+', ' ', 'g')), '') AS bairro,
  NULLIF(trim(regexp_replace(zona_raw, '\\s+', ' ', 'g')), '') AS zona,
  NULLIF(trim(regexp_replace(tipo_raw, '\\s+', ' ', 'g')), '') AS tipo,
  NULLIF(trim(regexp_replace(cep_raw, '\\D', '', 'g')), '') AS cep,
  'Logradouross_Zonas.csv',
  NOW(),
  NOW()
FROM tmp_logradouros_import
WHERE NULLIF(trim(logradouro_raw), '') IS NOT NULL
  AND NULLIF(trim(bairro_raw), '') IS NOT NULL
ON CONFLICT (logradouro, bairro, zona) DO UPDATE
SET tipo = COALESCE(EXCLUDED.tipo, logradouros.tipo),
    cep = COALESCE(EXCLUDED.cep, logradouros.cep),
    source_file = EXCLUDED.source_file,
    updated_at = NOW();

COMMIT;

-- 5) Validação pós-carga
SELECT COUNT(*) AS total_logradouros FROM logradouros;

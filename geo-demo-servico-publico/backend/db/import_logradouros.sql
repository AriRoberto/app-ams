-- Script de importação de Logradouros para PostgreSQL.
-- Ajuste o caminho do arquivo e execute no mesmo servidor que o banco PostgreSQL.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS logradouros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TEMP TABLE staging_logradouros (
  bairro TEXT,
  logradouro TEXT,
  zona TEXT,
  codigo_bairro TEXT,
  codigo_logradouro TEXT,
  area_original TEXT
);

\copy staging_logradouros (bairro, logradouro, zona, codigo_bairro, codigo_logradouro, area_original)
FROM '/tmp/logradouros.csv'
WITH CSV HEADER DELIMITER ';' ENCODING 'UTF8';

INSERT INTO logradouros (id, logradouro, bairro, zona, tipo, cep, source_file)
SELECT uuid_generate_v4(),
       trim(logradouro),
       trim(bairro),
       nullif(trim(zona), ''),
       NULL,
       NULL,
       'Logradouros_Zonas.csv'
FROM (
  SELECT DISTINCT ON (
      LOWER(trim(logradouro)),
      LOWER(trim(bairro)),
      COALESCE(LOWER(trim(zona)), '')
    )
    logradouro,
    bairro,
    zona
  FROM staging_logradouros
  WHERE trim(logradouro) <> '' AND trim(bairro) <> ''
  ORDER BY LOWER(trim(logradouro)), LOWER(trim(bairro)), COALESCE(LOWER(trim(zona)), ''), codigo_logradouro
) x
ON CONFLICT (logradouro, bairro, zona) DO NOTHING;

-- Migration: estrutura de logradouros para importação segura de planilhas da prefeitura.
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

CREATE INDEX IF NOT EXISTS idx_logradouros_bairro ON logradouros (bairro);
CREATE INDEX IF NOT EXISTS idx_logradouros_logradouro ON logradouros (logradouro);

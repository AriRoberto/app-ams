CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('cidadao', 'admin', 'ouvidoria')),
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  email_verification_token_hash TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY,
  citizen_name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  occurrence_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_point TEXT NOT NULL,
  bairro TEXT DEFAULT 'Não informado',
  priority TEXT DEFAULT 'normal',
  destination_role TEXT NOT NULL,
  destination_email TEXT NOT NULL,
  city TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  ibge_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  executive_response_status TEXT CHECK (executive_response_status IN ('DEFERIDO', 'INDEFERIDO')),
  requirement_form_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  requirement_form_data JSONB,
  email_status TEXT NOT NULL DEFAULT 'pendente',
  email_last_error TEXT,
  email_sent_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


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

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  manifestacao_id UUID REFERENCES occurrences(id),
  usuario_id UUID REFERENCES users(id),
  role TEXT NOT NULL,
  acao TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  ip_origem TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id BIGSERIAL PRIMARY KEY,
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'sucesso', 'falha')),
  erro TEXT,
  provider_message_id TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY,
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ABERTA';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS executive_response_status TEXT CHECK (executive_response_status IN ('DEFERIDO', 'INDEFERIDO'));
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS requirement_form_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS requirement_form_data JSONB;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS bairro TEXT DEFAULT 'Não informado';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS email_last_error TEXT;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_occurrences_location ON occurrences USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_occurrences_created_at ON occurrences (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences (status);
CREATE INDEX IF NOT EXISTS idx_occurrences_bairro ON occurrences (bairro);
CREATE INDEX IF NOT EXISTS idx_occurrences_sla_deadline ON occurrences (sla_deadline);
CREATE INDEX IF NOT EXISTS idx_occurrences_is_demo ON occurrences (is_demo);
CREATE INDEX IF NOT EXISTS idx_logradouros_bairro ON logradouros (bairro);
CREATE INDEX IF NOT EXISTS idx_logradouros_logradouro ON logradouros (logradouro);
CREATE INDEX IF NOT EXISTS idx_occurrences_email_status ON occurrences (email_status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_manifestacao ON audit_logs (manifestacao_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_occurrence ON email_deliveries (occurrence_id, queued_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf_unique ON users (cpf) WHERE cpf IS NOT NULL;

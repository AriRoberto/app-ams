CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY,
  citizen_name TEXT NOT NULL,
  occurrence_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_point TEXT NOT NULL,
  destination_role TEXT NOT NULL,
  destination_email TEXT NOT NULL,
  city TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  ibge_id INTEGER NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  occurrence_id UUID REFERENCES occurrences(id),
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY,
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occurrences_location ON occurrences USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_occurrences_created_at ON occurrences (created_at DESC);

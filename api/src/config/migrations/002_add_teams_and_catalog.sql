-- Migration 002: teams and competency catalog tables
-- Requires: 001_add_competency_enums.sql

CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competency_catalogs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competency_catalogs_one_active_per_team
  ON competency_catalogs (team_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS competency_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id    UUID NOT NULL REFERENCES competency_catalogs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competency_domains (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID NOT NULL REFERENCES competency_blocks(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competencies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id         UUID NOT NULL REFERENCES competency_domains(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  weight            NUMERIC(4, 2) NOT NULL CHECK (weight > 0),
  level_criterion   TEXT NOT NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_targets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID NOT NULL REFERENCES competency_blocks(id) ON DELETE CASCADE,
  grade         user_grade NOT NULL,
  min_score     NUMERIC(4, 2) NOT NULL,
  max_score     NUMERIC(4, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_id, grade),
  CHECK (min_score <= max_score)
);

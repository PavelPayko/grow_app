-- Migration 003: assessment cycles and competency assessments
-- Requires: 002_add_teams_and_catalog.sql

CREATE TABLE IF NOT EXISTS assessment_cycles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  catalog_id    UUID NOT NULL REFERENCES competency_catalogs(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  start_date    DATE,
  end_date      DATE,
  status        cycle_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_cycles_one_active_per_team
  ON assessment_cycles (team_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS competency_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id        UUID NOT NULL REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id   UUID NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  score           SMALLINT CHECK (score IS NULL OR (score >= 0 AND score <= 3)),
  evidence        TEXT,
  assessed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  assessed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, user_id, competency_id)
);

CREATE TABLE IF NOT EXISTS cycle_user_snapshots (
  cycle_id      UUID NOT NULL REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade         user_grade NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle_id, user_id)
);

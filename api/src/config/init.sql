CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ 
BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION 
  WHEN duplicate_object THEN RAISE NOTICE 'Тип user_role уже существует.';
END $$;

DO $$ 
BEGIN
  CREATE TYPE point_status AS ENUM ('new', 'in_progress', 'completed');
EXCEPTION 
  WHEN duplicate_object THEN RAISE NOTICE 'Тип point_status уже существует.';
END $$;

DO $$ 
BEGIN
  CREATE TYPE point_type AS ENUM ('point', 'achievement');
EXCEPTION 
  WHEN duplicate_object THEN RAISE NOTICE 'Тип point_type уже существует.';
END $$;

DO $$ 
BEGIN
  CREATE TYPE user_grade AS ENUM ('junior', 'middle', 'senior');
EXCEPTION 
  WHEN duplicate_object THEN RAISE NOTICE 'Тип user_grade уже существует.';
END $$;

DO $$ 
BEGIN
  CREATE TYPE cycle_status AS ENUM ('draft', 'active', 'closed');
EXCEPTION 
  WHEN duplicate_object THEN RAISE NOTICE 'Тип cycle_status уже существует.';
END $$;

CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login         TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  grade         user_grade NOT NULL DEFAULT 'junior',
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

CREATE TABLE IF NOT EXISTS points (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          point_type NOT NULL DEFAULT 'point',
  description       TEXT NOT NULL,
  deadline      DATE NOT NULL,
  status        point_status NOT NULL DEFAULT 'new',
  competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
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
-- Migration 007: decouple competency catalogs from teams
-- Requires: 002_add_teams_and_catalog.sql

-- 1. Add catalog_id to teams
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES competency_catalogs(id) ON DELETE RESTRICT;

-- 2. Set catalog_id from each team's active catalog
UPDATE teams t
SET catalog_id = (
  SELECT c.id
  FROM competency_catalogs c
  WHERE c.team_id = t.id AND c.is_active = true
  LIMIT 1
)
WHERE catalog_id IS NULL;

-- 3. Remove team binding from competency_catalogs
DROP INDEX IF EXISTS idx_competency_catalogs_one_active_per_team;

ALTER TABLE competency_catalogs DROP COLUMN IF EXISTS team_id;
ALTER TABLE competency_catalogs DROP COLUMN IF EXISTS is_active;

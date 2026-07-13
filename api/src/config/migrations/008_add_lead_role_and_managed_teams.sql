-- Migration 008: lead role, job_title, user_managed_teams
-- Requires: 002_add_teams_and_catalog.sql

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS job_title TEXT;

CREATE TABLE IF NOT EXISTS user_managed_teams (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_user_managed_teams_team_id ON user_managed_teams(team_id);

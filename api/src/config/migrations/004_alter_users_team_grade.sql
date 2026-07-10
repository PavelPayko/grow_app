-- Migration 004: extend users with team_id and grade
-- Requires: 002_add_teams_and_catalog.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS grade user_grade NOT NULL DEFAULT 'junior';

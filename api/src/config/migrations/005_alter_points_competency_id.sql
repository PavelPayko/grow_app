-- Migration 005: link points to competencies (future IDP integration)
-- Requires: 002_add_teams_and_catalog.sql

ALTER TABLE points
  ADD COLUMN IF NOT EXISTS competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL;

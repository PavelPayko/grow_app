-- Migration 006: assign existing users to default team
-- Requires: seed (team "Default Team") or manual team creation

UPDATE users
SET team_id = (SELECT id FROM teams WHERE name = 'Default Team' LIMIT 1)
WHERE team_id IS NULL
  AND EXISTS (SELECT 1 FROM teams WHERE name = 'Default Team');

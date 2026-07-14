-- Migration 009: nullable user grade (optional for lead/admin)

ALTER TABLE users
  ALTER COLUMN grade DROP NOT NULL;

ALTER TABLE users
  ALTER COLUMN grade DROP DEFAULT;

ALTER TABLE cycle_user_snapshots
  ALTER COLUMN grade DROP NOT NULL;

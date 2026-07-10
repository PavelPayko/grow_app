-- Migration 001: competency matrix enum types
-- Run on existing databases: psql -f 001_add_competency_enums.sql

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

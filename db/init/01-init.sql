-- This script runs automatically when the PostgreSQL container starts for the first time.
-- The database is already created via POSTGRES_DB env var.
-- Add any initial setup here.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE onboarding_diary TO postgres;

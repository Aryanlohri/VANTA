-- Initialize schemas for each service
-- Each service owns its own schema for logical separation
-- This runs automatically when the PostgreSQL container starts for the first time

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS repositories;
CREATE SCHEMA IF NOT EXISTS reviews;

-- Grant usage on schemas to the default user
GRANT ALL ON SCHEMA auth TO aicr_user;
GRANT ALL ON SCHEMA repositories TO aicr_user;
GRANT ALL ON SCHEMA reviews TO aicr_user;

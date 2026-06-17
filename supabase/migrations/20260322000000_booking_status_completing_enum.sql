-- Migration: add 'completing' to booking_status enum
-- Split out from 20260322000002_provider_expansion.sql: Postgres forbids using a
-- newly added enum value in the same transaction that adds it (55P04). The enum
-- value must be committed in its own migration before later migrations seed rows
-- that reference it (schema-drift / migration-ordering fix).
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completing' AFTER 'in_progress';

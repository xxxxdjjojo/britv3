-- ============================================================
-- Vouching (provider references) — Migration A: enum values ONLY
-- ============================================================
-- New provider_reference_status values for the referee-driven vouching flow.
--
-- This file contains ONLY `ALTER TYPE ... ADD VALUE`. Postgres cannot use an
-- enum value added by ALTER TYPE later in the SAME transaction, and the
-- partial indexes in Migration B reference these new values — so the ADD VALUEs
-- must land in their own (earlier-sorting) migration and commit before B runs.
--
-- Enum name confirmed as `provider_reference_status`
-- (20260316100001_provider_dashboard_tables.sql SECTION 5).

ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'declined';
ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'revoked';
ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE provider_reference_status ADD VALUE IF NOT EXISTS 'flagged';

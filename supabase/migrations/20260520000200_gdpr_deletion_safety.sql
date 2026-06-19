-- ============================================================================
-- 20260520000200_gdpr_deletion_safety.sql
--
-- Sprint 0 Stream A: cascade-delete blast-radius remediation + GDPR purge.
--
-- BEFORE this migration: deleting an auth.users row fires 65+7 CASCADE chains
-- across the user-owned schema. An admin mis-click (or a buggy script) can
-- destroy buyer/seller/agent data with no audit trail.
--
-- AFTER this migration:
--   1. All public.* FKs that previously had ON DELETE CASCADE to auth.users
--      or public.profiles are rewritten to ON DELETE RESTRICT. Direct deletes
--      now ERROR unless every dependent row has already been removed.
--   2. A new tracking table public.kernel_deleted_users records each purge
--      lifecycle (pending -> purging -> completed | failed).
--   3. profiles.deleted_at supports soft-delete so the app can hide the user
--      from queries the moment the request is made, before the Inngest worker
--      finishes the hard purge.
--   4. Four SECURITY DEFINER RPCs gate the workflow:
--        public.request_user_deletion (app -> emits Inngest event)
--        public.start_user_purge     (worker claims the purge)
--        public.complete_user_purge  (worker marks success)
--        public.fail_user_purge      (worker records failure for retry)
--
-- ROLLBACK:
--   The pg_constraint DO-block below should be reversed (RESTRICT -> CASCADE).
--   See /docs/runbooks/gdpr-deletion-safety-rollback.md for the inverse
--   procedure (drop kernel_deleted_users, profiles.deleted_at, and the four
--   SECURITY DEFINER functions). Sprint 1 PF#9 CI will enforce that every
--   future migration ships with a matching reversal.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A.1) Tracking table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kernel_deleted_users (
  user_id          UUID PRIMARY KEY,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by     UUID NULL,
  reason           TEXT NULL CHECK (
    reason IS NULL
    OR reason IN ('user_request', 'admin', 'gdpr_purge', 'fraud')
  ),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'purging', 'completed', 'failed')
  ),
  purge_started_at TIMESTAMPTZ NULL,
  completed_at     TIMESTAMPTZ NULL,
  failed_at        TIMESTAMPTZ NULL,
  last_error       TEXT NULL,
  attempt_count    INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS kernel_deleted_users_status_idx
  ON public.kernel_deleted_users(status);

ALTER TABLE public.kernel_deleted_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kernel_deleted_users_service_role_all"
  ON public.kernel_deleted_users;

CREATE POLICY "kernel_deleted_users_service_role_all"
  ON public.kernel_deleted_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- A.2) Soft-delete column on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON public.profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- A.3) request_user_deletion
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_user_deletion(
  p_user_id        UUID,
  p_reason         TEXT DEFAULT 'user_request',
  p_admin_user_id  UUID DEFAULT NULL
)
RETURNS TABLE (status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0002';
  END IF;

  -- Mark profile as soft-deleted first so the app hides the user immediately.
  UPDATE public.profiles SET deleted_at = now() WHERE id = p_user_id;

  INSERT INTO public.kernel_deleted_users (user_id, requested_by, reason)
  VALUES (p_user_id, p_admin_user_id, p_reason)
  ON CONFLICT (user_id) DO UPDATE
    SET requested_at = now(),
        status = 'pending',
        last_error = NULL,
        failed_at = NULL,
        requested_by = EXCLUDED.requested_by,
        reason = EXCLUDED.reason;

  RETURN QUERY SELECT 'pending'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.request_user_deletion(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_user_deletion(UUID, TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- A.4) start_user_purge
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_user_purge(p_user_id UUID)
RETURNS TABLE (status TEXT, attempt_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kernel_deleted_users
    SET status = CASE
          WHEN status = 'completed' THEN 'completed'
          ELSE 'purging'
        END,
        purge_started_at = COALESCE(purge_started_at, now()),
        attempt_count = attempt_count + 1
    WHERE user_id = p_user_id;

  RETURN QUERY
    SELECT k.status, k.attempt_count
    FROM public.kernel_deleted_users k
    WHERE k.user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_user_purge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_user_purge(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- A.5) complete_user_purge / fail_user_purge
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_user_purge(p_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.kernel_deleted_users
    SET status = 'completed',
        completed_at = now(),
        last_error = NULL
    WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.complete_user_purge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_user_purge(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.fail_user_purge(p_user_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.kernel_deleted_users
    SET status = 'failed',
        failed_at = now(),
        last_error = p_error
    WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.fail_user_purge(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_user_purge(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- A.6) Replace CASCADE -> RESTRICT for every public.* FK to auth.users
--      or public.profiles.
--
-- We loop pg_constraint dynamically rather than hand-listing 72 ALTERs:
--   * resilient to migrations that add or rename constraints between branches
--   * idempotent (re-running the migration is a no-op since CASCADE chains
--     no longer exist after the first run)
--
-- For composite-key FKs we'd need to join multiple pg_attribute rows; none
-- of the 72 known chains are composite, so the single-column join is
-- sufficient. If a future composite chain appears, this loop will simply
-- skip it (att.attnum = ANY(con.conkey) returns the first matching column
-- and the resulting single-column ADD CONSTRAINT will fail loudly -- that's
-- the desired behaviour).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  drop_sql TEXT;
  add_sql  TEXT;
BEGIN
  FOR r IN
    SELECT
      con.conname  AS constraint_name,
      ns.nspname   AS schema_name,
      cl.relname   AS table_name,
      att.attname  AS column_name,
      refnsp.nspname AS ref_schema,
      refrel.relname AS ref_table
    FROM pg_constraint con
    JOIN pg_class cl       ON con.conrelid = cl.oid
    JOIN pg_namespace ns   ON cl.relnamespace = ns.oid
    JOIN pg_class refrel   ON con.confrelid = refrel.oid
    JOIN pg_namespace refnsp ON refrel.relnamespace = refnsp.oid
    JOIN pg_attribute att  ON att.attrelid = cl.oid
                          AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND con.confdeltype = 'c'   -- CASCADE
      AND con.conislocal      -- skip partition-inherited copies; they cannot be
                              -- dropped on the child, only on the parent (42P16)
      AND ns.nspname = 'public'
      AND (
        (refnsp.nspname = 'auth'   AND refrel.relname = 'users')
        OR (refnsp.nspname = 'public' AND refrel.relname = 'profiles')
      )
  LOOP
    drop_sql := format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.schema_name, r.table_name, r.constraint_name
    );
    EXECUTE drop_sql;

    add_sql := format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(id) ON DELETE RESTRICT',
      r.schema_name, r.table_name, r.constraint_name,
      r.column_name, r.ref_schema, r.ref_table
    );
    EXECUTE add_sql;

    RAISE NOTICE 'Restricted %.% (%) -> %.%',
      r.schema_name, r.table_name, r.constraint_name, r.ref_schema, r.ref_table;
  END LOOP;
END $$;

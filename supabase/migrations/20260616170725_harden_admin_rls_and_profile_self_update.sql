-- Harden admin RLS gates and prevent privilege self-escalation.
--
-- Fixes two CRITICAL issues introduced by 20260429000001_rls_policies.sql
-- (formerly 20260429_rls_policies.sql), already live in production:
--   1. The admin-only SELECT policies on email_logs / audit_logs were gated on
--      auth.users.raw_user_meta_data->>'role', a USER-WRITABLE field
--      (auth.updateUser({ data }) writes it) — any signed-in user could set
--      role:'admin' and read those tables.
--   2. The profiles "allow_own_update" policy lets a user UPDATE any column of
--      their own row, including is_admin — i.e. self-promote to admin (the JWT
--      custom_access_token_hook then mints admin claims from profiles.is_admin).
--
-- Canonical admin gate in this codebase is the server-controlled
-- public.profiles.is_admin column; these changes bring the two outlier policies
-- in line and lock the is_admin flag against self-service writes.

-- 1. Re-gate the admin-only views on profiles.is_admin instead of user metadata.
DROP POLICY IF EXISTS "allow_admin_view_logs" ON public.email_logs;
CREATE POLICY "allow_admin_view_logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- NOTE: the original migration also re-gated public.audit_logs, but that table
-- never existed in the real schema — it was part of the fictional schema in the
-- 20260429000001 audit worksheet (now neutralized). The real audit table is
-- public.admin_audit_log, already gated on profiles.is_admin in
-- 20260316000000_admin_wave1_foundation.sql. Block removed (schema-drift fix).

-- 2. Reject self-service changes to is_admin. Only the service role or an
--    existing admin may flip the flag; normal self-updates (name, avatar,
--    active_role role-switching, etc.) continue to work via allow_own_update.
CREATE OR REPLACE FUNCTION public.prevent_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF auth.role() <> 'service_role'
       AND NOT EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND is_admin = true
       ) THEN
      RAISE EXCEPTION 'Not permitted to modify is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_admin_flag ON public.profiles;
CREATE TRIGGER profiles_protect_admin_flag
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privileged_self_update();

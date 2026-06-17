-- ============================================================================
-- 20260520000300_gdpr_deletion_fixes.sql
--
-- Sprint 0 Stream A: spec-compliance corrections to the GDPR deletion safety
-- migration shipped in 20260520000200_gdpr_deletion_safety.sql.
--
-- WHAT THIS FIXES
--   The original public.request_user_deletion RPC unconditionally reset
--   status='pending' in the ON CONFLICT branch. Re-requesting a user whose
--   row was already 'completed' clobbered the audit trail and pushed the
--   worker to re-run a purge that should have been a no-op. The fix:
--
--     1. Short-circuit at the top: if the row is already 'completed', return
--        status='already_completed' WITHOUT mutating profiles.deleted_at or
--        the kernel_deleted_users row. The service wrapper branches on this.
--
--     2. Defensive depth: the ON CONFLICT UPDATE now includes a CASE on
--        status (so a completed row would stay completed even if the
--        short-circuit ever regresses) plus a WHERE clause that refuses the
--        UPDATE entirely for completed rows.
--
-- CONVENTION
--   Applied migrations are immutable in this project. Corrections ship as
--   new migrations so the deployment history is auditable. Do NOT edit
--   20260520000200_gdpr_deletion_safety.sql.
--
-- ROLLBACK
--   Restore the original definition from 20260520000200_gdpr_deletion_safety.sql
--   (lines 81-114). See /docs/runbooks/gdpr-deletion-safety-rollback.md for
--   the broader inverse procedure if this fix is being rolled back alongside
--   the original Sprint 0 Stream A work.
-- ============================================================================

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
DECLARE
  existing_status TEXT;
BEGIN
  -- Validate user exists.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0002';
  END IF;

  -- Short-circuit if the user has already been purged. We do NOT touch
  -- profiles.deleted_at or kernel_deleted_users here -- the prior purge
  -- already cleaned up. The wrapper returns 'already_completed' to the
  -- caller without emitting an Inngest event.
  SELECT k.status INTO existing_status
    FROM public.kernel_deleted_users k
    WHERE k.user_id = p_user_id;

  IF existing_status = 'completed' THEN
    RETURN QUERY SELECT 'already_completed'::TEXT;
    RETURN;
  END IF;

  -- Mark profile soft-deleted so the app hides the user immediately.
  UPDATE public.profiles SET deleted_at = now() WHERE id = p_user_id;

  -- Insert or update the deletion request. The CASE expression preserves
  -- 'completed' even if the short-circuit ever regresses; the WHERE clause
  -- refuses the UPDATE entirely for completed rows (defensive depth).
  INSERT INTO public.kernel_deleted_users (user_id, requested_by, reason)
  VALUES (p_user_id, p_admin_user_id, p_reason)
  ON CONFLICT (user_id) DO UPDATE
    SET requested_at = now(),
        status = CASE
          WHEN public.kernel_deleted_users.status = 'completed' THEN 'completed'
          ELSE 'pending'
        END,
        last_error = NULL,
        failed_at = NULL,
        requested_by = EXCLUDED.requested_by,
        reason = EXCLUDED.reason
    WHERE public.kernel_deleted_users.status <> 'completed';

  RETURN QUERY SELECT 'pending'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.request_user_deletion(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_user_deletion(UUID, TEXT, UUID) TO service_role;

-- Prevent privilege self-escalation via profiles.is_admin.
--
-- Production's "Users can update own profile" policy is
--   USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
-- with NO column restriction, so a user can UPDATE their own row including
-- is_admin. The admin gate (is_admin() / profiles.is_admin) would then grant
-- them admin. This trigger blocks any change to is_admin unless the caller is
-- the service role or an already-existing admin. Ordinary self-updates
-- (display_name, avatar, active_role role-switching, etc.) are unaffected.
--
-- NOTE: the email_logs/audit_logs admin-view policies originally drafted in this
-- migration were removed. audit_logs does not exist on this database, and
-- email_logs already carries its own admin policies. The companion
-- 20260429000001_rls_policies.sql was never applied to this project (verified
-- against prod), so there were no live spoofable policies to re-gate.

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

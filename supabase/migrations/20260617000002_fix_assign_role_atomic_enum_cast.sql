-- Fix assign_role_atomic: cast p_role (text) to user_role before writing the
-- enum-typed columns user_roles.role and profiles.active_role.
--
-- The on-disk definition (20260318_atomic_role_assignment.sql) inserts/updates the
-- text p_role directly into user_role-typed columns, raising
--   "column \"role\" is of type user_role but expression is of type text" (42804)
-- on a fresh `supabase db reset`, which breaks the all-roles E2E seed
-- (supabase/seed/seed-test-users.ts) for every non-admin user.
--
-- The hosted project (ynkqzzpcbpphjczmrfva) already casts p_role::user_role — its
-- function was fixed out-of-band but no committed migration captured it. This forward
-- migration brings the on-disk schema into line. It keeps the on-disk validation
-- block (which hosted's current body lacks) and adds the two casts. CREATE OR REPLACE
-- is idempotent. See docs/DASHBOARD_HOSTED_RECONCILIATION.md.
CREATE OR REPLACE FUNCTION public.assign_role_atomic(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valid_roles text[] := ARRAY['homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider', 'mortgage_broker'];
BEGIN
  -- Validate role
  IF p_role != ALL(v_valid_roles) THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Upsert role record (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Set active role on profile
  UPDATE public.profiles
  SET active_role = p_role::user_role
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (
    p_user_id,
    'role_assigned',
    jsonb_build_object('role', p_role)
  );
END;
$function$;

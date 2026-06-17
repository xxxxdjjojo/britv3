-- ---------------------------------------------------------------------------
-- Atomic role assignment RPC functions with audit logging
-- Replaces separate multi-step DB calls in role-service.ts with
-- transactional RPCs that cannot leave state inconsistent.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- assign_role_atomic
-- Upserts a single role into user_roles and sets profiles.active_role in one
-- transaction, then writes an audit log entry.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_role_atomic(
  p_user_id uuid,
  p_role    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid_roles text[] := ARRAY['homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider', 'mortgage_broker'];
BEGIN
  -- Validate role
  IF p_role != ALL(v_valid_roles) THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Upsert role record (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Set active role on profile
  UPDATE public.profiles
  SET active_role = p_role
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (
    p_user_id,
    'role_assigned',
    jsonb_build_object('role', p_role)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- select_roles_atomic
-- Upserts multiple roles into user_roles, sets profiles.active_role to the
-- first role in the array, then writes an audit log entry.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.select_roles_atomic(
  p_user_id uuid,
  p_roles   text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
  v_valid_roles text[] := ARRAY['homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider', 'mortgage_broker'];
BEGIN
  -- Validate all roles
  FOREACH r IN ARRAY p_roles LOOP
    IF r != ALL(v_valid_roles) THEN
      RAISE EXCEPTION 'Invalid role: %', r;
    END IF;
  END LOOP;

  -- Upsert each role (idempotent)
  FOREACH r IN ARRAY p_roles LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, r)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;

  -- Set active role to first element
  UPDATE public.profiles
  SET active_role = p_roles[1]
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (
    p_user_id,
    'roles_selected',
    jsonb_build_object('roles', to_jsonb(p_roles))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- switch_role_atomic
-- Verifies user owns the target role, updates profiles.active_role, then
-- writes an audit log entry capturing the old and new role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.switch_role_atomic(
  p_user_id uuid,
  p_role    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_role text;
  v_valid_roles text[] := ARRAY['homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider', 'mortgage_broker'];
BEGIN
  -- Validate role
  IF p_role != ALL(v_valid_roles) THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Verify user has the requested role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  ) THEN
    RAISE EXCEPTION 'User does not have the requested role';
  END IF;

  -- Capture current active role for audit log
  SELECT active_role INTO v_old_role
  FROM public.profiles
  WHERE id = p_user_id;

  -- Switch active role
  UPDATE public.profiles
  SET active_role = p_role
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (
    p_user_id,
    'role_switched',
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_role
    )
  );
END;
$$;

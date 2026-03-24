-- ==========================================================================
-- Backend Data Layer Blueprint — Single Migration
-- ==========================================================================

-- --------------------------------------------------------------------------
-- A. JWT Custom Claims Auth Hook
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_plan text;
  user_is_admin boolean;
  user_id uuid;
BEGIN
  user_id := (event->>'user_id')::uuid;
  claims := event->'claims';

  SELECT active_role, is_admin
  INTO user_role, user_is_admin
  FROM public.profiles
  WHERE id = user_id;

  SELECT plan_name
  INTO user_plan
  FROM public.subscriptions
  WHERE user_id = custom_access_token_hook.user_id
    AND status IN ('active', 'trialing')
  LIMIT 1;

  claims := jsonb_set(claims, '{app_metadata}', COALESCE(claims->'app_metadata', '{}'::jsonb));
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(COALESCE(user_role, '')));
  claims := jsonb_set(claims, '{app_metadata,plan}', to_jsonb(COALESCE(user_plan, '')));
  claims := jsonb_set(claims, '{app_metadata,is_admin}', to_jsonb(COALESCE(user_is_admin, false)));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.jwt_claims_errors (user_id, error_message, error_detail)
  VALUES (user_id, SQLERRM, SQLSTATE);
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON public.profiles TO supabase_auth_admin;
GRANT SELECT ON public.subscriptions TO supabase_auth_admin;

-- --------------------------------------------------------------------------
-- B. JWT Claims Error Logging Table
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jwt_claims_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jwt_claims_errors_created ON public.jwt_claims_errors (created_at);

ALTER TABLE public.jwt_claims_errors ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- B2. RPC: Find properties with price drops in last 24 hours
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.find_recent_price_drops()
RETURNS TABLE (
  property_id uuid,
  listing_id uuid,
  title text,
  slug text,
  old_price bigint,
  new_price bigint,
  drop_pct numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_two AS (
    SELECT
      ph.property_id AS prop_id,
      ph.price AS ph_price,
      ph.created_at AS ph_created,
      ROW_NUMBER() OVER (PARTITION BY ph.property_id ORDER BY ph.created_at DESC) AS rn
    FROM public.price_history ph
    WHERE ph.created_at > now() - interval '48 hours'
  )
  SELECT
    l2.prop_id AS property_id,
    sl.listing_id,
    sl.title,
    sl.slug,
    prev.ph_price AS old_price,
    l2.ph_price AS new_price,
    ROUND(((prev.ph_price - l2.ph_price)::numeric / prev.ph_price) * 100, 1) AS drop_pct
  FROM latest_two l2
  JOIN latest_two prev ON l2.prop_id = prev.prop_id AND prev.rn = 2
  JOIN public.search_listings sl ON sl.property_id = l2.prop_id::text
  WHERE l2.rn = 1
    AND l2.ph_price < prev.ph_price
    AND l2.ph_created > now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- --------------------------------------------------------------------------
-- C. pg_cron Schedules
-- --------------------------------------------------------------------------

SELECT cron.unschedule('refresh-search-listings')
  FROM cron.job WHERE jobname = 'refresh-search-listings';
SELECT cron.schedule(
  'refresh-search-listings',
  '*/5 * * * *',
  'SELECT refresh_search_listings()'
);

-- =============================================================================
-- Account Purge Function & Scheduled Job
-- =============================================================================
-- Fixes:
--   BUG-7:  No automated purge after 30-day deletion grace period (GDPR Art. 17)
--   BUG-11: Listings orphaned on agent deletion
--   BUG-12: No pseudonymisation for deleted users in messages/reviews
--   BUG-13: Email not freed after deletion (auth.users handled by purge-service.ts)
--
-- Prerequisites:
--   - pg_cron extension (requires Supabase Pro+ plan)
--   - All referenced tables must exist (profiles, listings, seller_listings,
--     messages, reviews, bookings, service_requests, deletion_requests, etc.)
--
-- Note: auth.users row deletion cannot be done in SQL and is handled by
-- the companion TypeScript service at src/services/gdpr/purge-service.ts
-- via the Supabase Admin API.
-- =============================================================================

-- 1. Create the purge function
CREATE OR REPLACE FUNCTION public.purge_deleted_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- -----------------------------------------------------------------------
  -- A. Pseudonymise the user profile
  -- -----------------------------------------------------------------------
  UPDATE profiles
  SET display_name  = 'Deleted User',
      first_name    = NULL,
      last_name     = NULL,
      phone         = NULL,
      postcode      = NULL,
      bio           = NULL,
      avatar_url    = NULL,
      settings      = '{}'::jsonb,
      deleted_at    = now()
  WHERE id = p_user_id;

  -- -----------------------------------------------------------------------
  -- B. Delete user activity data (saved items, history, analytics)
  -- -----------------------------------------------------------------------
  DELETE FROM saved_properties  WHERE user_id = p_user_id;
  DELETE FROM saved_searches    WHERE user_id = p_user_id;
  DELETE FROM viewing_history   WHERE user_id = p_user_id;
  DELETE FROM search_analytics  WHERE user_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- C. Withdraw active listings (BUG-11: prevent orphaned listings)
  -- -----------------------------------------------------------------------
  UPDATE listings
  SET status     = 'withdrawn',
      deleted_at = now()
  WHERE user_id = p_user_id
    AND status = 'active';

  UPDATE seller_listings
  SET status = 'withdrawn'
  WHERE user_id = p_user_id
    AND status IN ('active', 'draft');

  -- -----------------------------------------------------------------------
  -- D. Pseudonymise messages and reviews (BUG-12)
  -- -----------------------------------------------------------------------
  UPDATE messages
  SET sender_id = NULL
  WHERE sender_id = p_user_id;

  UPDATE reviews
  SET reviewer_id = NULL
  WHERE reviewer_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- E. Delete auth-related data
  -- -----------------------------------------------------------------------
  DELETE FROM user_backup_codes WHERE user_id = p_user_id;
  DELETE FROM consent_records   WHERE user_id = p_user_id;
  DELETE FROM user_roles        WHERE user_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- F. Cancel active bookings and open service requests
  -- -----------------------------------------------------------------------
  UPDATE bookings
  SET status = 'cancelled'
  WHERE (user_id = p_user_id OR provider_id = p_user_id)
    AND status NOT IN ('completed', 'cancelled');

  UPDATE service_requests
  SET status = 'cancelled'
  WHERE user_id = p_user_id
    AND status = 'open';

  -- -----------------------------------------------------------------------
  -- G. Mark deletion request as completed
  -- -----------------------------------------------------------------------
  UPDATE deletion_requests
  SET status       = 'completed',
      completed_at = now()
  WHERE user_id = p_user_id
    AND status = 'pending';
END;
$$;

-- 2. Access control: only service_role may call this function
REVOKE EXECUTE ON FUNCTION public.purge_deleted_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_deleted_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_deleted_user(uuid) TO service_role;

-- 3. Schedule daily purge at 3 AM UTC via pg_cron
-- NOTE: pg_cron requires the Supabase Pro plan or higher.
-- On the free tier this statement will fail — the purge_deleted_user function
-- can still be called manually or from an Edge Function / cron service.
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'purge-deleted-accounts',
      '0 3 * * *',
      $cron$
        SELECT public.purge_deleted_user(user_id)
        FROM public.deletion_requests
        WHERE status = 'pending'
          AND scheduled_purge_at <= now();
      $cron$
    );
  END IF;
END;
$outer$;

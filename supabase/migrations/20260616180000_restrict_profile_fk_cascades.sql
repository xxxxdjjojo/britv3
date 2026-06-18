-- =============================================================================
-- BRIT-S001 — Replace ON DELETE CASCADE with ON DELETE RESTRICT on every FK
-- from marketplace tables to public.profiles(id), and add an audited GDPR
-- purge function that anonymises (rather than destroys) connected data.
--
-- Why: a single profile delete (operator error, compromised admin, or a buggy
-- service-role path) currently cascades and silently wipes connected
-- marketplace listings, reviews, bookings, and quotes with no recovery path.
-- RESTRICT turns an accidental profile delete into a blocked statement instead
-- of irreversible data loss. User erasure must instead go through purge_user(),
-- which anonymises in place and soft-deletes the profile.
--
-- NOTE: auth.users(id) cascades elsewhere are intentionally left untouched —
-- they are mediated by the Supabase auth service (per security audit guidance).
--
-- LOCAL DB IS BROKEN (NOW()-in-index migration) — this migration is authored
-- and statically reviewed only. Apply + verify in STAGING before production.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Marketplace FKs: profiles(id) ON DELETE CASCADE -> ON DELETE RESTRICT
--    Resolved by (table, column) so the migration is resilient to the actual
--    auto-generated constraint name (<table>_<column>_fkey for inline FKs).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  target RECORD;
  fk_name TEXT;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('service_provider_details', 'user_id'),
      ('provider_documents',       'user_id'),
      ('service_requests',         'user_id'),
      ('bookings',                 'user_id'),
      ('reviews',                  'reviewer_id'),
      ('review_helpfulness',       'user_id'),
      ('review_flags',             'user_id')
    ) AS t(table_name, column_name)
  LOOP
    -- Find the FK constraint on (table, column) that references profiles(id).
    SELECT con.conname INTO fk_name
    FROM pg_constraint con
    JOIN pg_class rel        ON rel.oid = con.conrelid
    JOIN pg_namespace nsp    ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att    ON att.attrelid = con.conrelid
                            AND att.attnum = con.conkey[1]
    JOIN pg_class refrel     ON refrel.oid = con.confrelid
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = target.table_name
      AND att.attname = target.column_name
      AND refrel.relname = 'profiles';

    IF fk_name IS NULL THEN
      RAISE WARNING 'No profiles FK found on %.% — skipping', target.table_name, target.column_name;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', target.table_name, fk_name);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE RESTRICT',
      target.table_name, fk_name, target.column_name
    );
    RAISE NOTICE 'Recreated %.% FK % as ON DELETE RESTRICT', target.table_name, target.column_name, fk_name;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. GDPR purge audit log (version-controlled, self-contained)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gdpr_purge_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purged_user  UUID NOT NULL,
  purged_by    UUID,
  reason       TEXT,
  purged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gdpr_purge_log ENABLE ROW LEVEL SECURITY;
-- No policies: only SECURITY DEFINER functions / service role may read/write.

-- ---------------------------------------------------------------------------
-- 3. purge_user() — audited, anonymising erasure. Anonymises in place and
--    soft-deletes the profile; never hard-deletes (which RESTRICT now blocks).
--    Extend the marketplace anonymisation block as more PII columns are added.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_user(
  p_user_id UUID,
  p_purged_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Audit first so the intent is recorded even if a later step fails.
  INSERT INTO public.gdpr_purge_log (purged_user, purged_by, reason)
  VALUES (p_user_id, p_purged_by, p_reason);

  -- Anonymise the profile PII and soft-delete.
  UPDATE public.profiles
  SET display_name   = '[deleted user]',
      avatar_url     = NULL,
      phone          = NULL,
      phone_verified = FALSE,
      deleted_at     = NOW(),
      updated_at     = NOW()
  WHERE id = p_user_id;

  -- Anonymise reviewer-authored free text (right-to-erasure of contributed PII).
  UPDATE public.reviews
  SET title       = '[removed]',
      review_text = '[removed]',
      updated_at  = NOW()
  WHERE reviewer_id = p_user_id;

  -- Extend here for additional PII-bearing marketplace tables as the schema
  -- grows (e.g. quotes free-text, message bodies, provider_documents metadata).
END $$;

REVOKE ALL ON FUNCTION public.purge_user(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;

COMMIT;

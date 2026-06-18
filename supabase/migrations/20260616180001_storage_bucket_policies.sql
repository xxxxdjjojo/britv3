-- =============================================================================
-- BRIT-S014 — Version-control storage RLS for the two buckets the audit could
-- not confirm from source: `avatars` (public-read, owner-write) and
-- `landlord-documents` (fully private, owner-scoped by property folder).
--
-- The maintenance-photos / expense-receipts / property-documents buckets are
-- already covered by 20260307_epic7_property_management.sql; this mirrors that
-- exact ownership convention:
--   - avatars path scheme:            `${user.id}/avatar.ext`      -> folder[1] = auth.uid()
--   - landlord-documents path scheme: `${property_id}/...`         -> folder[1] = owned property
--   property ownership = listings.user_id = auth.uid()
--
-- IMPORTANT (S014): these may already exist in the Supabase console with
-- different names. Reconcile against Studio -> Storage -> Policies BEFORE
-- applying. DROP POLICY IF EXISTS makes re-runs safe. Local DB is broken —
-- apply + verify in STAGING.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Bucket visibility: avatars public-read, landlord-documents private.
-- ---------------------------------------------------------------------------
UPDATE storage.buckets SET public = TRUE  WHERE id = 'avatars';
UPDATE storage.buckets SET public = FALSE WHERE id = 'landlord-documents';

-- ---------------------------------------------------------------------------
-- avatars — public read; owner-only write/update/delete (folder = user id).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- landlord-documents — private; access only to objects under a property folder
-- owned by the caller. No public/anon SELECT policy => signed URLs only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners upload landlord documents" ON storage.objects;
CREATE POLICY "Owners upload landlord documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'landlord-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT property_id::text FROM public.listings WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners read landlord documents" ON storage.objects;
CREATE POLICY "Owners read landlord documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'landlord-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT property_id::text FROM public.listings WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners delete landlord documents" ON storage.objects;
CREATE POLICY "Owners delete landlord documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'landlord-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT property_id::text FROM public.listings WHERE user_id = auth.uid()
    )
  );

COMMIT;

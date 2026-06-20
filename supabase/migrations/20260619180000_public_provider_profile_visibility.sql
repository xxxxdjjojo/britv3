-- =============================================================================
-- Public (anon) visibility of the verified-provider public profile surface —
-- SECURE BY DEFAULT (row policies + column-scoped anon grant + sanctioned view).
--
-- The marketplace was designed for public/SEO visibility ("Public can view ..."
-- policies, programmatic /services-near/[service]/[postcode] SSG routes), but
-- every public-read policy was scoped to the `authenticated` role only — so a
-- logged-out visitor (the `anon` role) saw NOTHING: provider listings, profile
-- pages, and SEO pages all 404'd / rendered empty.
--
-- SECTION A adds tightly-scoped `anon` SELECT *row* policies (verified, non-deleted
-- providers and approved reviews only). SECTION B then locks the *columns*: RLS is
-- row-level, and anon held a table-wide SELECT grant on profiles, which would let
-- anon read PII (phone, is_admin, admin_role, ban_reason, banned_at,
-- suspended_until, *_preferences/privacy_settings). We REVOKE the blanket grant
-- and re-grant only the safe directory columns + the columns the dependent
-- verified-provider policies read, and expose a `public_provider_profiles` view as
-- the sanctioned anon read surface. (Folds in the security hardening that was
-- proposed separately as fix/anon-provider-profile-pii.)
-- =============================================================================

-- ============================================================================
-- SECTION A — anon row-level SELECT policies (verified providers / approved reviews)
-- ============================================================================

-- 1. Verified provider profile rows.
DROP POLICY IF EXISTS "Anon can view verified provider profiles" ON public.profiles;
CREATE POLICY "Anon can view verified provider profiles"
  ON public.profiles FOR SELECT TO anon
  USING (provider_verification_status = 'verified'::provider_verification_status
         AND deleted_at IS NULL);

-- 2. The provider listing itself (gated by the verified profile).
DROP POLICY IF EXISTS "Anon can view verified providers" ON public.service_provider_details;
CREATE POLICY "Anon can view verified providers"
  ON public.service_provider_details FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = service_provider_details.user_id
      AND p.provider_verification_status = 'verified'::provider_verification_status
      AND p.deleted_at IS NULL));

-- 3. Aggregate rating stats (already public-by-design; pure aggregates).
DROP POLICY IF EXISTS "Anon can view rating stats" ON public.provider_rating_stats;
CREATE POLICY "Anon can view rating stats"
  ON public.provider_rating_stats FOR SELECT TO anon
  USING (true);

-- 4. Approved, non-deleted reviews (mirrors "Public can view approved reviews").
DROP POLICY IF EXISTS "Anon can view approved reviews" ON public.reviews;
CREATE POLICY "Anon can view approved reviews"
  ON public.reviews FOR SELECT TO anon
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

-- 5. Services listed by verified providers.
DROP POLICY IF EXISTS "Anon can view verified provider services" ON public.provider_services;
CREATE POLICY "Anon can view verified provider services"
  ON public.provider_services FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = provider_services.provider_id
      AND p.provider_verification_status = 'verified'::provider_verification_status
      AND p.deleted_at IS NULL));

-- 6. Badges earned by verified providers.
DROP POLICY IF EXISTS "Anon can view verified provider badges" ON public.provider_badges;
CREATE POLICY "Anon can view verified provider badges"
  ON public.provider_badges FOR SELECT TO anon
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = provider_badges.provider_id
      AND p.provider_verification_status = 'verified'::provider_verification_status
      AND p.deleted_at IS NULL));

-- 7. Portfolio items of verified providers.
DROP POLICY IF EXISTS "Anon can view verified provider portfolio" ON public.provider_portfolio_items;
CREATE POLICY "Anon can view verified provider portfolio"
  ON public.provider_portfolio_items FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = provider_portfolio_items.provider_id
      AND p.provider_verification_status = 'verified'::provider_verification_status
      AND p.deleted_at IS NULL));

-- ============================================================================
-- SECTION B — column-scope anon's read of profiles (PII hardening) + sanctioned view
-- ============================================================================

-- Column-scoped anon SELECT: safe directory fields + the columns the dependent
-- verified-provider policies above read (id, provider_verification_status, deleted_at).
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id,
  display_name,
  avatar_url,
  provider_verification_status,
  verification_level,
  deleted_at
) ON public.profiles TO anon;

-- Sanctioned public read surface for provider directory cards. security_invoker so
-- it respects the caller's RLS + column grants (no privilege escalation); it can
-- only ever expose the safe columns selected here.
CREATE OR REPLACE VIEW public.public_provider_profiles
  WITH (security_invoker = true) AS
  SELECT
    id,
    display_name,
    avatar_url,
    provider_verification_status,
    verification_level
  FROM public.profiles
  WHERE provider_verification_status = 'verified'::provider_verification_status
    AND deleted_at IS NULL;

GRANT SELECT ON public.public_provider_profiles TO anon, authenticated;

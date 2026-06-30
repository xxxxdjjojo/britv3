-- ===========================================================================
-- Featured Trader / Sponsored Placement system
-- ---------------------------------------------------------------------------
-- A premium, admin-configurable advertising product that lets verified traders
-- pay for relevant visibility on property pages, search, and area pages.
-- Separate from the recurring trader subscription; no job commission.
--
-- Reuses existing systems: service_provider_details (keyed by user_id),
-- service_category enum, profiles.provider_verification_status, subscriptions,
-- provider_rating_stats, profiles.is_admin. Adds only the advertising layer.
--
-- Design note: a single type-discriminated `placement_events` table is used in
-- place of three separate impression/click/conversion tables (KISS — one
-- high-volume analytics table, counters denormalised onto sponsored_placements
-- for cheap dashboard reads).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Table 1: placement_products — admin-managed catalogue & pricing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  placement_type TEXT NOT NULL CHECK (
    placement_type IN ('town_boost', 'postcode_boost', 'property_detail_boost', 'category_leader')
  ),
  category public.service_category,          -- NULL = any category
  region_scope TEXT,                          -- e.g. 'London'; NULL = national
  town TEXT,                                  -- e.g. 'Ealing'
  postcode_district TEXT,                     -- e.g. 'W5'
  slot_limit INTEGER NOT NULL DEFAULT 3 CHECK (slot_limit >= 0),
  monthly_price_pence INTEGER NOT NULL CHECK (monthly_price_pence >= 0),
  launch_discount_pct INTEGER NOT NULL DEFAULT 0 CHECK (launch_discount_pct BETWEEN 0 AND 100),
  launch_discount_months INTEGER NOT NULL DEFAULT 0 CHECK (launch_discount_months >= 0),
  estimated_monthly_views INTEGER NOT NULL DEFAULT 0 CHECK (estimated_monthly_views >= 0),
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_products_active
  ON public.placement_products (status, placement_type) WHERE status = 'active';

CREATE TRIGGER trg_placement_products_updated_at
  BEFORE UPDATE ON public.placement_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table 2: sponsored_placements — a purchased placement
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsored_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.placement_products(id) ON DELETE SET NULL,
  placement_type TEXT NOT NULL CHECK (
    placement_type IN ('town_boost', 'postcode_boost', 'property_detail_boost', 'category_leader')
  ),
  category public.service_category,
  region_scope TEXT,
  town TEXT,
  postcode_district TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'active', 'paused', 'cancelled', 'rejected', 'expired')
  ),
  monthly_price_pence INTEGER NOT NULL DEFAULT 0 CHECK (monthly_price_pence >= 0),
  budget_cap_pence INTEGER CHECK (budget_cap_pence IS NULL OR budget_cap_pence >= 0),
  spend_pence INTEGER NOT NULL DEFAULT 0 CHECK (spend_pence >= 0),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_featured BOOLEAN NOT NULL DEFAULT false,
  priority_override INTEGER,
  impressions_count BIGINT NOT NULL DEFAULT 0,
  clicks_count BIGINT NOT NULL DEFAULT 0,
  enquiries_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_placements_provider
  ON public.sponsored_placements (provider_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_placements_active_targeting
  ON public.sponsored_placements (status, placement_type, postcode_district, town) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sponsored_placements_active_category
  ON public.sponsored_placements (category) WHERE status = 'active';

CREATE TRIGGER trg_sponsored_placements_updated_at
  BEFORE UPDATE ON public.sponsored_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table 3: placement_events — type-discriminated analytics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_events (
  id BIGSERIAL PRIMARY KEY,
  placement_id UUID NOT NULL REFERENCES public.sponsored_placements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('impression', 'click', 'profile_view', 'enquiry_started', 'enquiry_submitted')
  ),
  zone TEXT,                                  -- property_sidebar | property_financial | property_bottom | search_grid | area_page | home
  property_id UUID,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_events_placement_type
  ON public.placement_events (placement_id, event_type);
CREATE INDEX IF NOT EXISTS idx_placement_events_created
  ON public.placement_events (created_at);

-- ===========================================================================
-- RLS
-- ===========================================================================
ALTER TABLE public.placement_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_events ENABLE ROW LEVEL SECURITY;

-- placement_products: anyone may read active products (the catalogue); admins manage.
CREATE POLICY "placement_products_public_read"
  ON public.placement_products FOR SELECT
  USING (status = 'active');

CREATE POLICY "placement_products_admin_all"
  ON public.placement_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- sponsored_placements: traders see/manage ONLY their own rows; admins all.
-- Public surfacing goes exclusively through the SECURITY DEFINER RPC below, so
-- competitor spend/budget is never exposed via a public SELECT policy.
CREATE POLICY "sponsored_placements_select_own"
  ON public.sponsored_placements FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "sponsored_placements_insert_own"
  ON public.sponsored_placements FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "sponsored_placements_update_own"
  ON public.sponsored_placements FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "sponsored_placements_admin_all"
  ON public.sponsored_placements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Owner-update guard: the owner UPDATE policy is row-scoped but not column-scoped,
-- so without this trigger a trader could directly set admin_featured = true,
-- monthly_price_pence = 0, priority_override, or retarget their placement via the
-- Supabase client. This BEFORE UPDATE trigger pins protected columns to their old
-- values for non-admin callers (auth.uid() is the owner) and limits self-driven
-- status changes to pause/resume/cancel. Admins (is_admin) and the service role
-- (auth.uid() IS NULL — webhook) are unaffected.
CREATE OR REPLACE FUNCTION public.guard_sponsored_placement_owner_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    NEW.admin_featured := OLD.admin_featured;
    NEW.priority_override := OLD.priority_override;
    NEW.monthly_price_pence := OLD.monthly_price_pence;
    NEW.spend_pence := OLD.spend_pence;
    NEW.budget_cap_pence := OLD.budget_cap_pence;
    NEW.product_id := OLD.product_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.category := OLD.category;
    NEW.town := OLD.town;
    NEW.postcode_district := OLD.postcode_district;
    NEW.region_scope := OLD.region_scope;
    NEW.placement_type := OLD.placement_type;
    NEW.impressions_count := OLD.impressions_count;
    NEW.clicks_count := OLD.clicks_count;
    NEW.enquiries_count := OLD.enquiries_count;
    IF NEW.status NOT IN ('active', 'paused', 'cancelled') THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_sponsored_placement_owner_update
  BEFORE UPDATE ON public.sponsored_placements
  FOR EACH ROW EXECUTE FUNCTION public.guard_sponsored_placement_owner_update();

-- placement_events: a trader reads only events for their own placements; admins all.
-- Inserts happen server-side via the service role (createAdminClient), so there
-- is no public/owner INSERT policy (prevents impression fraud).
CREATE POLICY "placement_events_select_own"
  ON public.placement_events FOR SELECT
  USING (
    placement_id IN (SELECT id FROM public.sponsored_placements WHERE provider_id = auth.uid())
  );

CREATE POLICY "placement_events_admin_all"
  ON public.placement_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ===========================================================================
-- RPC: featured_experts_for — eligibility-filtered candidate set
-- ---------------------------------------------------------------------------
-- Returns active, eligible placements matching a location/category, with the
-- raw signals the application layer (ranking.ts) needs to score and order them.
-- SECURITY DEFINER so the public surfacing path reads sponsored_placements
-- without a public SELECT policy, exposing only display + ranking fields.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.featured_experts_for(
  p_postcode_district TEXT DEFAULT NULL,
  p_town TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 24
)
RETURNS TABLE (
  placement_id UUID,
  provider_id UUID,
  business_name TEXT,
  slug TEXT,
  avatar_url TEXT,
  services public.service_category[],
  service_postcodes TEXT[],
  category public.service_category,
  placement_type TEXT,
  region_scope TEXT,
  town TEXT,
  postcode_district TEXT,
  average_rating NUMERIC,
  total_reviews BIGINT,
  response_rate NUMERIC,
  response_time_hours NUMERIC,
  years_in_business INTEGER,
  completed_jobs_count INTEGER,
  business_description TEXT,
  qualifications TEXT[],
  portfolio_urls TEXT[],
  location_match TEXT,
  admin_featured BOOLEAN,
  priority_override INTEGER,
  budget_remaining BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.id,
    sp.provider_id,
    spd.business_name,
    spd.slug,
    p.avatar_url,
    spd.services,
    spd.service_postcodes,
    sp.category,
    sp.placement_type,
    sp.region_scope,
    sp.town,
    sp.postcode_district,
    prs.average_rating,
    prs.total_reviews,
    prs.response_rate,
    spd.response_time_hours,
    spd.years_in_business,
    spd.completed_jobs_count,
    spd.business_description,
    spd.qualifications,
    spd.portfolio_urls,
    CASE
      WHEN p_postcode_district IS NOT NULL AND sp.postcode_district = p_postcode_district THEN 'postcode'
      WHEN p_town IS NOT NULL AND sp.town IS NOT NULL AND lower(sp.town) = lower(p_town) THEN 'town'
      WHEN p_region IS NOT NULL AND sp.region_scope IS NOT NULL AND lower(sp.region_scope) = lower(p_region) THEN 'region'
      WHEN sp.postcode_district IS NULL AND sp.town IS NULL AND sp.region_scope IS NULL THEN 'region'
      ELSE 'none'
    END AS location_match,
    sp.admin_featured,
    sp.priority_override,
    (sp.budget_cap_pence IS NULL OR sp.spend_pence < sp.budget_cap_pence) AS budget_remaining
  FROM public.sponsored_placements sp
  JOIN public.service_provider_details spd ON spd.user_id = sp.provider_id
  JOIN public.profiles p ON p.id = sp.provider_id
  LEFT JOIN public.provider_rating_stats prs ON prs.provider_id = sp.provider_id
  LEFT JOIN public.subscriptions subq ON subq.user_id = sp.provider_id
  WHERE sp.status = 'active'
    AND sp.starts_at <= NOW()
    AND (sp.ends_at IS NULL OR sp.ends_at > NOW())
    AND p.provider_verification_status = 'verified'
    AND p.deleted_at IS NULL
    AND COALESCE(subq.status, '') IN ('active', 'trialing')
    AND (p_categories IS NULL OR sp.category IS NULL OR sp.category::text = ANY (p_categories))
    AND (
      (p_postcode_district IS NOT NULL AND sp.postcode_district = p_postcode_district)
      OR (p_town IS NOT NULL AND sp.town IS NOT NULL AND lower(sp.town) = lower(p_town))
      OR (p_region IS NOT NULL AND sp.region_scope IS NOT NULL AND lower(sp.region_scope) = lower(p_region))
      OR (sp.postcode_district IS NULL AND sp.town IS NULL AND sp.region_scope IS NULL)
    )
    AND (sp.budget_cap_pence IS NULL OR sp.spend_pence < sp.budget_cap_pence)
  ORDER BY sp.admin_featured DESC, COALESCE(sp.priority_override, -1) DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100);
$$;

GRANT EXECUTE ON FUNCTION public.featured_experts_for(TEXT, TEXT, TEXT, TEXT[], INTEGER) TO anon, authenticated, service_role;

-- ===========================================================================
-- RPC: record_placement_event — atomic insert + counter increment
-- ---------------------------------------------------------------------------
-- Called only from the server (service role). Inserts the event and bumps the
-- matching denormalised counter on sponsored_placements in one statement.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.record_placement_event(
  p_placement_id UUID,
  p_event_type TEXT,
  p_zone TEXT DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_viewer_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.placement_events (placement_id, event_type, zone, property_id, viewer_id, session_id, metadata)
  VALUES (p_placement_id, p_event_type, p_zone, p_property_id, p_viewer_id, p_session_id, COALESCE(p_metadata, '{}'::jsonb));

  UPDATE public.sponsored_placements SET
    impressions_count = impressions_count + (CASE WHEN p_event_type = 'impression' THEN 1 ELSE 0 END),
    clicks_count = clicks_count + (CASE WHEN p_event_type = 'click' THEN 1 ELSE 0 END),
    enquiries_count = enquiries_count + (CASE WHEN p_event_type = 'enquiry_submitted' THEN 1 ELSE 0 END)
  WHERE id = p_placement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_placement_event(UUID, TEXT, TEXT, UUID, UUID, TEXT, JSONB) TO service_role;

-- ===========================================================================
-- Seed: starter catalogue (idempotent). Prices in pence; admin-editable.
-- ===========================================================================
INSERT INTO public.placement_products
  (name, placement_type, category, region_scope, town, postcode_district, slot_limit, monthly_price_pence, launch_discount_pct, launch_discount_months, estimated_monthly_views, status)
VALUES
  ('Ealing Town Boost',                'town_boost',            NULL,            'London',             'Ealing',     NULL,  3, 9900,  50, 3, 12000, 'active'),
  ('Manchester Town Boost',           'town_boost',            NULL,            'Greater Manchester', 'Manchester', NULL,  3, 6900,  50, 3, 9000,  'active'),
  ('W5 Postcode Boost',               'postcode_boost',        NULL,            'London',             'Ealing',     'W5',  2, 14900, 0,  0, 5000,  'active'),
  ('M1 Postcode Boost',               'postcode_boost',        NULL,            'Greater Manchester', 'Manchester', 'M1',  2, 9900,  0,  0, 4000,  'active'),
  ('Ealing Property Detail Boost',    'property_detail_boost', NULL,            'London',             'Ealing',     NULL,  3, 24900, 0,  0, 8000,  'active'),
  ('Featured Conveyancer in Ealing',  'category_leader',       'conveyancing',  'London',             'Ealing',     NULL,  1, 49900, 0,  0, 6000,  'active'),
  ('Featured Plumber in Ealing',      'category_leader',       'plumber',       'London',             'Ealing',     NULL,  3, 29900, 50, 3, 6000,  'active'),
  ('London Mortgage Broker Leader',   'category_leader',       'mortgage_broker','London',            NULL,         NULL,  3, 79900, 0,  0, 20000, 'active')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- New Homes / New Build product area
-- ============================================================================
-- A developer acquisition + conversion engine for regional new-build schemes.
-- Models developers (orgs), their developments, units, media, leads, viewings
-- and a lightweight analytics event stream used to compute the headline
-- enquiry-to-reservation conversion metric.
--
-- Access model (product decision 2026-06-29): a "developer" is NOT a new
-- user_role. Any authenticated user is linked to a developer org via
-- developer_members. This keeps the existing auth/role system untouched while
-- still scoping every dashboard read to "your own developments and leads".
--
-- Tables created:
--   1. developers            — the developer organisation / brand
--   2. developer_members     — user ↔ developer org membership (dashboard access)
--   3. developments          — a new-build scheme
--   4. development_units      — individual plots/units within a development
--   5. development_media      — gallery images, floorplans, site plans, brochures
--   6. development_leads      — captured buyer demand (the product)
--   7. development_viewings   — booked/requested viewings tied to a lead
--   8. development_events     — analytics event stream (views, enquiries, …)
-- ============================================================================

-- updated_at trigger function (idempotent — earlier migrations also define it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE development_status AS ENUM ('coming_soon', 'available', 'reserved', 'sold_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE development_scheme_type AS ENUM ('houses', 'apartments', 'mixed', 'retirement', 'shared_ownership');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE development_unit_status AS ENUM ('available', 'reserved', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE development_media_type AS ENUM ('image', 'floorplan', 'site_plan', 'brochure', 'logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The four lead-capture surfaces from the public site.
DO $$ BEGIN
  CREATE TYPE development_lead_type AS ENUM ('register_interest', 'book_viewing', 'request_brochure', 'ask_question');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lead funnel stage. 'reserved' is the conversion goal.
DO $$ BEGIN
  CREATE TYPE development_lead_status AS ENUM ('new', 'qualified', 'contacted', 'viewing_booked', 'reserved', 'closed', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Analytics events that drive the conversion dashboard.
DO $$ BEGIN
  CREATE TYPE development_event_type AS ENUM (
    'development_viewed', 'unit_viewed', 'brochure_requested', 'enquiry_submitted',
    'viewing_requested', 'viewing_booked', 'reservation_requested', 'reservation_confirmed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE 1: developers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.developers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  tagline         TEXT,
  about           TEXT,
  logo_url        TEXT,
  brand_colour    TEXT,                       -- hex, used to brand cards/detail page
  website_url     TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  -- Trust signals shown on the public developer profile block.
  year_established INTEGER,
  homes_built      INTEGER,
  regions          TEXT[],
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Public can read published developers (powers the public new-homes pages).
CREATE POLICY "Published developers are publicly readable"
  ON public.developers FOR SELECT
  USING (is_published = TRUE);

-- Members of a developer org can read + manage it (incl. unpublished drafts).
CREATE POLICY "Members can read their developer"
  ON public.developers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = developers.id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can update their developer"
  ON public.developers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = developers.id AND m.user_id = auth.uid()
  ));

CREATE TRIGGER developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 2: developer_members  (defined before developers' policies run? no —
-- policies reference it, but Postgres only resolves the table at query time, so
-- ordering of CREATE TABLE is fine as long as it exists before any query.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.developer_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id  UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role   TEXT NOT NULL DEFAULT 'owner',   -- owner | manager | viewer
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (developer_id, user_id)
);

ALTER TABLE public.developer_members ENABLE ROW LEVEL SECURITY;

-- A user can see their own membership rows (used to resolve "am I a developer?").
CREATE POLICY "Users can read their own memberships"
  ON public.developer_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_developer_members_user ON public.developer_members (user_id);
CREATE INDEX idx_developer_members_developer ON public.developer_members (developer_id);

-- ============================================================================
-- TABLE 3: developments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.developments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id      UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  summary           TEXT,                       -- short card subtitle
  description       TEXT,                       -- long-form body
  -- Location
  address_line      TEXT,
  city              TEXT NOT NULL,
  postcode          TEXT,
  region            TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  -- Headline ranges (denormalised for fast card/list rendering; kept in sync
  -- with development_units by the app/seed, not a trigger, to stay simple).
  price_min         INTEGER,
  price_max         INTEGER,
  beds_min          SMALLINT,
  beds_max          SMALLINT,
  total_units       SMALLINT,
  available_units   SMALLINT,
  scheme_type       development_scheme_type NOT NULL DEFAULT 'mixed',
  status            development_status NOT NULL DEFAULT 'available',
  completion_date   DATE,                       -- expected completion
  -- Eligibility / incentives
  help_to_buy       BOOLEAN NOT NULL DEFAULT FALSE,
  first_homes       BOOLEAN NOT NULL DEFAULT FALSE,
  shared_ownership  BOOLEAN NOT NULL DEFAULT FALSE,
  incentives        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{title, detail}]
  -- Editorial content blocks
  highlights        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- "Why buyers like this" bullets
  transport         JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{name, detail, minutes}]
  schools           JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{name, detail, rating}]
  amenities         JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{name, detail}]
  hero_image_url    TEXT,
  is_published      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published developments are publicly readable"
  ON public.developments FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Members can read their developments"
  ON public.developments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = developments.developer_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can manage their developments"
  ON public.developments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = developments.developer_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = developments.developer_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_developments_developer ON public.developments (developer_id);
CREATE INDEX idx_developments_city ON public.developments (city);
CREATE INDEX idx_developments_status ON public.developments (status);
CREATE INDEX idx_developments_published ON public.developments (is_published);

CREATE TRIGGER developments_updated_at
  BEFORE UPDATE ON public.developments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 4: development_units
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.development_units (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id    UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  plot_number       TEXT NOT NULL,
  unit_type         TEXT NOT NULL,              -- e.g. "The Ashby — 3 bed townhouse"
  beds              SMALLINT NOT NULL DEFAULT 1,
  baths             SMALLINT NOT NULL DEFAULT 1,
  size_sqft         INTEGER,
  price             INTEGER,
  status            development_unit_status NOT NULL DEFAULT 'available',
  floorplan_url     TEXT,
  features          TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (development_id, plot_number)
);

ALTER TABLE public.development_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units of published developments are publicly readable"
  ON public.development_units FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    WHERE d.id = development_units.development_id AND d.is_published = TRUE
  ));

CREATE POLICY "Members can manage their units"
  ON public.development_units FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_units.development_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_units.development_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_development_units_development ON public.development_units (development_id);
CREATE INDEX idx_development_units_status ON public.development_units (status);

CREATE TRIGGER development_units_updated_at
  BEFORE UPDATE ON public.development_units
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 5: development_media
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.development_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id    UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  media_type        development_media_type NOT NULL DEFAULT 'image',
  url               TEXT NOT NULL,
  caption           TEXT,
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.development_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media of published developments are publicly readable"
  ON public.development_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    WHERE d.id = development_media.development_id AND d.is_published = TRUE
  ));

CREATE POLICY "Members can manage their media"
  ON public.development_media FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_media.development_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_media.development_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_development_media_development ON public.development_media (development_id);

-- ============================================================================
-- TABLE 6: development_leads  (the product — captured buyer demand)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.development_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id      UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  unit_id             UUID REFERENCES public.development_units(id) ON DELETE SET NULL,
  lead_type           development_lead_type NOT NULL DEFAULT 'register_interest',
  status              development_lead_status NOT NULL DEFAULT 'new',
  -- Contact + qualification
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  buyer_status        TEXT,                     -- first_time | home_mover | investor | …
  budget              INTEGER,
  desired_move_date   TEXT,                     -- free text / ISO; buyers are vague here
  mortgage_position   TEXT,                     -- agreement_in_principle | applied | cash | …
  has_property_to_sell BOOLEAN,
  preferred_plot      TEXT,
  message             TEXT,
  -- Attribution
  source_route        TEXT,
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_term            TEXT,
  utm_content         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.development_leads ENABLE ROW LEVEL SECURITY;

-- Only members of the owning developer org can read/manage leads.
-- (Inserts happen server-side via the service-role client in the lead API, so
-- no public INSERT policy is granted — leads can never be read cross-org.)
CREATE POLICY "Members can read their leads"
  ON public.development_leads FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_leads.development_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can update their leads"
  ON public.development_leads FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_leads.development_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_development_leads_development ON public.development_leads (development_id);
CREATE INDEX idx_development_leads_status ON public.development_leads (status);
CREATE INDEX idx_development_leads_created ON public.development_leads (created_at);

CREATE TRIGGER development_leads_updated_at
  BEFORE UPDATE ON public.development_leads
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 7: development_viewings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.development_viewings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id    UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES public.development_leads(id) ON DELETE SET NULL,
  unit_id           UUID REFERENCES public.development_units(id) ON DELETE SET NULL,
  scheduled_for     TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'requested',   -- requested | confirmed | completed | cancelled
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.development_viewings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their viewings"
  ON public.development_viewings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_viewings.development_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can update their viewings"
  ON public.development_viewings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_viewings.development_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_development_viewings_development ON public.development_viewings (development_id);
CREATE INDEX idx_development_viewings_lead ON public.development_viewings (lead_id);

CREATE TRIGGER development_viewings_updated_at
  BEFORE UPDATE ON public.development_viewings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 8: development_events  (analytics stream)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.development_events (
  id                BIGSERIAL PRIMARY KEY,
  development_id    UUID REFERENCES public.developments(id) ON DELETE CASCADE,
  unit_id           UUID REFERENCES public.development_units(id) ON DELETE SET NULL,
  lead_id           UUID REFERENCES public.development_leads(id) ON DELETE SET NULL,
  event_type        development_event_type NOT NULL,
  session_id        TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.development_events ENABLE ROW LEVEL SECURITY;

-- Events are written server-side via the service-role client. Members may read
-- their own development's events for analytics.
CREATE POLICY "Members can read their events"
  ON public.development_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developments d
    JOIN public.developer_members m ON m.developer_id = d.developer_id
    WHERE d.id = development_events.development_id AND m.user_id = auth.uid()
  ));

CREATE INDEX idx_development_events_development ON public.development_events (development_id);
CREATE INDEX idx_development_events_type ON public.development_events (event_type);
CREATE INDEX idx_development_events_created ON public.development_events (created_at);

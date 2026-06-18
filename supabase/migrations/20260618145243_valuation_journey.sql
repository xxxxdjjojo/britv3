-- ============================================================================
-- Value-my-property valuation journey
-- ============================================================================
-- Server-persisted anonymous valuation sessions, versioned results, comparable
-- evidence, model registry/metrics, agent handoff leads, and consent audit.
-- RLS on every table. Anonymous-stage writes go through the service role; once a
-- valuation is claimed, the owner can read their own rows via auth.uid().
-- ============================================================================

-- 1. valuation_sessions — anonymous, server-managed, expiring pending session.
CREATE TABLE IF NOT EXISTS public.valuation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE, -- sha256 of the httpOnly cookie token
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'calculated', 'claimed', 'expired')),
  postcode TEXT,
  outward_code TEXT,
  paon TEXT,
  saon TEXT,
  street TEXT,
  address_label TEXT,
  property_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  latest_result_id UUID, -- FK added after valuation_results exists
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);
COMMENT ON TABLE public.valuation_sessions IS 'Anonymous expiring valuation sessions; accessed server-side by hashed cookie token until claimed by a verified user';
CREATE INDEX IF NOT EXISTS idx_valuation_sessions_token ON public.valuation_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_valuation_sessions_expires ON public.valuation_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_valuation_sessions_user ON public.valuation_sessions (user_id);

-- 2. valuation_results — versioned indicative estimate.
CREATE TABLE IF NOT EXISTS public.valuation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.valuation_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  estimated_value BIGINT,
  estimated_low BIGINT,
  estimated_high BIGINT,
  evidence_quality TEXT NOT NULL
    CHECK (evidence_quality IN ('high', 'medium', 'low', 'unavailable')),
  fallback_level TEXT NOT NULL CHECK (fallback_level IN ('A', 'B', 'C', 'D', 'E')),
  comparable_count INTEGER NOT NULL DEFAULT 0,
  effective_comparable_count NUMERIC(10, 2) NOT NULL DEFAULT 0,
  valuation_date DATE NOT NULL,
  data_cutoff_date DATE,
  subject JSONB NOT NULL DEFAULT '{}'::jsonb,
  inputs_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.valuation_results IS 'Versioned indicative valuation results; recalculation stores a new row (auditable history)';
CREATE INDEX IF NOT EXISTS idx_valuation_results_session ON public.valuation_results (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuation_results_user ON public.valuation_results (user_id, created_at DESC);

ALTER TABLE public.valuation_sessions
  ADD CONSTRAINT fk_valuation_sessions_latest_result
  FOREIGN KEY (latest_result_id) REFERENCES public.valuation_results(id) ON DELETE SET NULL;

-- 3. valuation_comparables — evidence rows attached to a result.
CREATE TABLE IF NOT EXISTS public.valuation_comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.valuation_results(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  price BIGINT NOT NULL,
  adjusted_price BIGINT,
  sale_date DATE NOT NULL,
  postcode TEXT,
  outward_code TEXT,
  property_type TEXT,
  new_build BOOLEAN,
  tenure TEXT,
  paon TEXT,
  saon TEXT,
  street TEXT,
  distance_metres NUMERIC(10, 2),
  weight NUMERIC(12, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_valuation_comparables_result ON public.valuation_comparables (result_id);

-- 4. valuation_model_versions — model registry (publicly readable for transparency).
CREATE TABLE IF NOT EXISTS public.valuation_model_versions (
  version TEXT PRIMARY KEY,
  description TEXT,
  feature_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  training_cutoff DATE,
  deployed_at TIMESTAMPTZ,
  rollback_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. valuation_model_metrics — measured backtest metrics (publicly readable).
CREATE TABLE IF NOT EXISTS public.valuation_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL REFERENCES public.valuation_model_versions(version) ON DELETE CASCADE,
  sample_size INTEGER NOT NULL,
  metrics JSONB NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_valuation_model_metrics_version ON public.valuation_model_metrics (model_version, measured_at DESC);

-- 6. valuation_agent_leads — agent handoff, created only on explicit user request.
CREATE TABLE IF NOT EXISTS public.valuation_agent_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuation_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agency_id UUID,
  contact_email TEXT,
  contact_phone TEXT,
  contact_preference TEXT CHECK (contact_preference IN ('email', 'phone')),
  selling_timeline TEXT,
  shared_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'notified', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_valuation_agent_leads_user ON public.valuation_agent_leads (user_id, created_at DESC);

-- 7. valuation_consent_events — audit of the exact notice/consent shown.
CREATE TABLE IF NOT EXISTS public.valuation_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID REFERENCES public.valuation_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID,
  agency_id UUID,
  purpose TEXT NOT NULL, -- 'agent_contact' | 'marketing_optin' | 'third_party_marketing'
  notice_version TEXT NOT NULL,
  consent_state TEXT NOT NULL CHECK (consent_state IN ('granted', 'denied', 'withdrawn')),
  source_route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_valuation_consent_user ON public.valuation_consent_events (user_id, created_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.valuation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_agent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_consent_events ENABLE ROW LEVEL SECURITY;

-- Sessions: service-role only (anonymous access is via the server + hashed token).
-- No anon/authenticated policies => only the service role can touch them.

-- Results: owners may read their own claimed valuations.
CREATE POLICY "valuation_results_owner_read" ON public.valuation_results
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Comparables: readable when the parent result is owned by the requester.
CREATE POLICY "valuation_comparables_owner_read" ON public.valuation_comparables
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.valuation_results r
      WHERE r.id = result_id AND r.user_id = (SELECT auth.uid())
    )
  );

-- Model registry & metrics: publicly readable for transparency.
CREATE POLICY "valuation_model_versions_public_read" ON public.valuation_model_versions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "valuation_model_metrics_public_read" ON public.valuation_model_metrics
  FOR SELECT TO anon, authenticated USING (true);

-- Agent leads & consent: owners may read their own.
CREATE POLICY "valuation_agent_leads_owner_read" ON public.valuation_agent_leads
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "valuation_consent_events_owner_read" ON public.valuation_consent_events
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- Seed the current model version + its measured backtest metrics.
-- ============================================================================
INSERT INTO public.valuation_model_versions (version, description, feature_schema, training_cutoff, deployed_at)
VALUES (
  'vmp-comparables-1.0.0',
  'Explainable weighted-comparable AVM: HMLR Price Paid, robust weighted median/trimmed mean, recency/distance(proxy)/type/tenure/new-build weighting, A-E fallback.',
  '{"features": ["property_type", "tenure", "new_build", "recency", "proximity_proxy"], "data_source": "price_paid_data"}'::jsonb,
  '2026-02-27',
  NOW()
)
ON CONFLICT (version) DO NOTHING;

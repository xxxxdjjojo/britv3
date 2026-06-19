-- ============================================================================
-- Postcode centroids (for real comparable-distance weighting in the AVM)
-- ============================================================================
-- Free, downloadable open data (ONS Postcode Directory / NSPL, or OS Code-Point
-- Open converted to WGS84) — NOT an external API. Lets the valuation engine
-- compute true distance between the subject postcode and each comparable's
-- postcode instead of a same-postcode/same-street proxy.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.postcode_centroids (
  postcode TEXT PRIMARY KEY, -- normalised "OUTWARD INWARD"
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL DEFAULT 'onspd',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.postcode_centroids IS 'WGS84 centroid per UK postcode from open data (ONSPD/NSPL/Code-Point Open); used for AVM comparable-distance weighting';

CREATE INDEX IF NOT EXISTS idx_postcode_centroids_outward
  ON public.postcode_centroids (left(postcode, 4));

ALTER TABLE public.postcode_centroids ENABLE ROW LEVEL SECURITY;

-- Open data — publicly readable; only the service role writes (via the ingest).
CREATE POLICY "postcode_centroids_public_read" ON public.postcode_centroids
  FOR SELECT TO anon, authenticated USING (true);

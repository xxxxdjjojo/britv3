-- ============================================================================
-- UK House Price Index (for real time-adjustment of comparable sales)
-- ============================================================================
-- Free, downloadable open data (gov.uk UK HPI full file, OGL) — NOT an API.
-- Stores the monthly index per area, including property-type-specific indices,
-- so the AVM can restate historic sales to the valuation date by area + type.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hpi_index (
  area_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  month TEXT NOT NULL, -- 'YYYY-MM'
  index_all NUMERIC(8, 2),
  index_detached NUMERIC(8, 2),
  index_semi NUMERIC(8, 2),
  index_terraced NUMERIC(8, 2),
  index_flat NUMERIC(8, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (area_code, month)
);
COMMENT ON TABLE public.hpi_index IS 'Monthly UK House Price Index by area (incl. per property-type indices) from gov.uk UK HPI (OGL); used to time-adjust AVM comparables';

CREATE INDEX IF NOT EXISTS idx_hpi_index_region_month
  ON public.hpi_index (lower(region_name), month);

ALTER TABLE public.hpi_index ENABLE ROW LEVEL SECURITY;

-- Open data — publicly readable; only the service role writes (via the ingest).
CREATE POLICY "hpi_index_public_read" ON public.hpi_index
  FOR SELECT TO anon, authenticated USING (true);

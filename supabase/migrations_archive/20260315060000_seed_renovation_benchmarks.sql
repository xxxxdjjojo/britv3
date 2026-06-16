-- ===========================================================================
-- Seed: renovation_type_benchmarks
-- Source: Homeowners Alliance 2024 / Checkatrade 2024
-- Covers 5 renovation types × 6 UK regions = 30 rows
-- Idempotent via ON CONFLICT (renovation_type, region) DO UPDATE
-- ===========================================================================

INSERT INTO renovation_type_benchmarks
  (renovation_type, region, cost_low_per_sqm, cost_high_per_sqm, value_uplift_pct_low, value_uplift_pct_high, data_source, last_updated)
VALUES

  -- -------------------------------------------------------------------------
  -- Loft conversion
  -- -------------------------------------------------------------------------
  ('loft_conversion', 'london',     1500, 2500, 20.00, 25.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('loft_conversion', 'south_east', 1200, 2000, 15.00, 20.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('loft_conversion', 'midlands',    900, 1500, 12.00, 18.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('loft_conversion', 'north',       800, 1300, 10.00, 15.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('loft_conversion', 'wales',       800, 1200, 10.00, 14.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('loft_conversion', 'scotland',    850, 1400, 11.00, 16.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),

  -- -------------------------------------------------------------------------
  -- Kitchen refurb
  -- -------------------------------------------------------------------------
  ('kitchen', 'london',      800, 1500,  5.00, 10.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('kitchen', 'south_east',  600, 1200,  5.00,  9.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('kitchen', 'midlands',    500,  900,  4.00,  8.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('kitchen', 'north',       450,  800,  4.00,  7.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('kitchen', 'wales',       450,  750,  3.00,  7.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('kitchen', 'scotland',    500,  850,  4.00,  8.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),

  -- -------------------------------------------------------------------------
  -- Extension
  -- -------------------------------------------------------------------------
  ('extension', 'london',     2000, 3500, 10.00, 15.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('extension', 'south_east', 1600, 2800, 10.00, 14.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('extension', 'midlands',   1200, 2000,  8.00, 12.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('extension', 'north',      1000, 1800,  7.00, 11.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('extension', 'wales',      1000, 1700,  7.00, 10.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('extension', 'scotland',   1100, 1900,  8.00, 12.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),

  -- -------------------------------------------------------------------------
  -- Bathroom
  -- -------------------------------------------------------------------------
  ('bathroom', 'london',      600, 1200, 3.00, 5.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('bathroom', 'south_east',  500,  900, 3.00, 5.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('bathroom', 'midlands',    400,  700, 2.00, 4.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('bathroom', 'north',       350,  650, 2.00, 4.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('bathroom', 'wales',       350,  600, 2.00, 4.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('bathroom', 'scotland',    380,  680, 2.00, 4.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),

  -- -------------------------------------------------------------------------
  -- Full refurb
  -- -------------------------------------------------------------------------
  ('full_refurb', 'london',     1200, 2000,  8.00, 15.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('full_refurb', 'south_east',  900, 1600,  8.00, 13.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('full_refurb', 'midlands',    700, 1200,  6.00, 11.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('full_refurb', 'north',       600, 1000,  5.00, 10.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('full_refurb', 'wales',       600,  950,  5.00,  9.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01'),
  ('full_refurb', 'scotland',    650, 1100,  6.00, 11.00, 'Homeowners Alliance 2024 / Checkatrade 2024', '2024-01-01')

ON CONFLICT (renovation_type, region) DO UPDATE SET
  cost_low_per_sqm     = EXCLUDED.cost_low_per_sqm,
  cost_high_per_sqm    = EXCLUDED.cost_high_per_sqm,
  value_uplift_pct_low = EXCLUDED.value_uplift_pct_low,
  value_uplift_pct_high = EXCLUDED.value_uplift_pct_high,
  data_source          = EXCLUDED.data_source,
  last_updated         = EXCLUDED.last_updated;

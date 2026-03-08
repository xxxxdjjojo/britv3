-- Seed data: Market pricing for common UK trade categories across regions.
-- Rates are per hour in GBP based on typical 2025/2026 UK trade rates.
-- data_source: 'seed' indicates this is initial seed data, not live market data.

INSERT INTO market_pricing (service_category, region, price_low, price_median, price_high, unit, data_source, sample_size)
VALUES
  -- Plumbing
  ('plumbing', 'london', 55, 75, 110, 'per_hour', 'seed', 0),
  ('plumbing', 'south_east', 45, 65, 95, 'per_hour', 'seed', 0),
  ('plumbing', 'south_west', 40, 55, 80, 'per_hour', 'seed', 0),
  ('plumbing', 'midlands', 35, 50, 75, 'per_hour', 'seed', 0),
  ('plumbing', 'north_west', 35, 50, 70, 'per_hour', 'seed', 0),
  ('plumbing', 'north_east', 30, 45, 65, 'per_hour', 'seed', 0),
  ('plumbing', 'scotland', 35, 48, 70, 'per_hour', 'seed', 0),
  ('plumbing', 'wales', 30, 45, 65, 'per_hour', 'seed', 0),

  -- Electrical
  ('electrical', 'london', 55, 80, 120, 'per_hour', 'seed', 0),
  ('electrical', 'south_east', 50, 70, 100, 'per_hour', 'seed', 0),
  ('electrical', 'south_west', 40, 60, 85, 'per_hour', 'seed', 0),
  ('electrical', 'midlands', 38, 55, 80, 'per_hour', 'seed', 0),
  ('electrical', 'north_west', 35, 52, 75, 'per_hour', 'seed', 0),
  ('electrical', 'north_east', 32, 48, 70, 'per_hour', 'seed', 0),
  ('electrical', 'scotland', 35, 50, 72, 'per_hour', 'seed', 0),
  ('electrical', 'wales', 32, 48, 68, 'per_hour', 'seed', 0),

  -- Painting & Decorating
  ('painting', 'london', 35, 50, 75, 'per_hour', 'seed', 0),
  ('painting', 'south_east', 30, 42, 65, 'per_hour', 'seed', 0),
  ('painting', 'south_west', 25, 38, 55, 'per_hour', 'seed', 0),
  ('painting', 'midlands', 22, 35, 50, 'per_hour', 'seed', 0),

  -- Carpentry
  ('carpentry', 'london', 45, 65, 95, 'per_hour', 'seed', 0),
  ('carpentry', 'south_east', 40, 58, 85, 'per_hour', 'seed', 0),
  ('carpentry', 'midlands', 32, 48, 70, 'per_hour', 'seed', 0),
  ('carpentry', 'north_west', 30, 45, 65, 'per_hour', 'seed', 0),

  -- Roofing
  ('roofing', 'london', 50, 70, 100, 'per_hour', 'seed', 0),
  ('roofing', 'south_east', 45, 62, 90, 'per_hour', 'seed', 0),
  ('roofing', 'midlands', 38, 55, 78, 'per_hour', 'seed', 0),
  ('roofing', 'north_west', 35, 50, 72, 'per_hour', 'seed', 0),

  -- Bathroom Fitting
  ('bathroom_fitting', 'london', 50, 72, 105, 'per_hour', 'seed', 0),
  ('bathroom_fitting', 'south_east', 45, 65, 90, 'per_hour', 'seed', 0),
  ('bathroom_fitting', 'midlands', 38, 55, 80, 'per_hour', 'seed', 0),

  -- Kitchen Fitting
  ('kitchen_fitting', 'london', 55, 78, 115, 'per_hour', 'seed', 0),
  ('kitchen_fitting', 'south_east', 48, 68, 95, 'per_hour', 'seed', 0),
  ('kitchen_fitting', 'midlands', 40, 58, 82, 'per_hour', 'seed', 0),

  -- Landscaping
  ('landscaping', 'london', 35, 50, 75, 'per_hour', 'seed', 0),
  ('landscaping', 'south_east', 30, 42, 65, 'per_hour', 'seed', 0),
  ('landscaping', 'midlands', 25, 35, 55, 'per_hour', 'seed', 0),

  -- Cleaning
  ('cleaning', 'london', 18, 25, 40, 'per_hour', 'seed', 0),
  ('cleaning', 'south_east', 15, 22, 35, 'per_hour', 'seed', 0),
  ('cleaning', 'midlands', 12, 18, 28, 'per_hour', 'seed', 0),
  ('cleaning', 'north_west', 12, 17, 26, 'per_hour', 'seed', 0),

  -- Removals
  ('removals', 'london', 45, 65, 95, 'per_hour', 'seed', 0),
  ('removals', 'south_east', 38, 55, 80, 'per_hour', 'seed', 0),
  ('removals', 'midlands', 30, 45, 68, 'per_hour', 'seed', 0),
  ('removals', 'north_west', 28, 42, 62, 'per_hour', 'seed', 0)
ON CONFLICT (service_category, region) DO UPDATE SET
  price_low = EXCLUDED.price_low,
  price_median = EXCLUDED.price_median,
  price_high = EXCLUDED.price_high,
  unit = EXCLUDED.unit,
  data_source = EXCLUDED.data_source,
  sample_size = EXCLUDED.sample_size;

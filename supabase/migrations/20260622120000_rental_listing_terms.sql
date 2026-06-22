-- 20260622120000_rental_listing_terms.sql
-- Add advertised rental terms to the listings table.
-- These are LISTING-LEVEL fields (what the landlord/agent advertises),
-- NOT tenancy-level fields (the executed contract in `tenancies`).
-- Additive only — no existing columns changed, no destructive ops.

-- Furnishing status for rental listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS furnishing TEXT
    CHECK (furnishing IN ('furnished', 'unfurnished', 'part_furnished'));

-- Advertised deposit (capped at 5 weeks' rent per Tenant Fees Act 2019)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2)
    CHECK (deposit_amount >= 0);

-- Holding deposit (capped at 1 week's rent per Tenant Fees Act 2019)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS holding_deposit_amount NUMERIC(10,2)
    CHECK (holding_deposit_amount >= 0);

-- Minimum tenancy length in months
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS minimum_tenancy_months INTEGER
    CHECK (minimum_tenancy_months >= 0);

-- Maximum tenancy length in months (null = no upper limit stated)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS maximum_tenancy_months INTEGER
    CHECK (maximum_tenancy_months >= 0);

-- Whether bills are included in the rent
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS bills_included BOOLEAN DEFAULT FALSE;

-- Details of what bills are included (free text for flexibility)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS bills_included_details TEXT;

-- Pets policy
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS pets_policy TEXT
    CHECK (pets_policy IN ('allowed', 'not_allowed', 'by_arrangement', 'not_specified'))
    DEFAULT 'not_specified';

-- Students policy
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS students_policy TEXT
    CHECK (students_policy IN ('accepted', 'not_accepted', 'by_arrangement', 'not_specified'))
    DEFAULT 'not_specified';

-- Deposit protection scheme (UK statutory requirement for assured shorthold tenancies)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS deposit_scheme TEXT
    CHECK (deposit_scheme IN ('DPS', 'TDS', 'mydeposits', 'other'));

-- Add columns to the search_listings materialized view if it exists
-- (The view is rebuilt by a separate migration/job; this just ensures the
-- underlying columns are available for any future view refresh.)

-- Add a helpful comment documenting the listing vs tenancy distinction
COMMENT ON COLUMN listings.deposit_amount IS
  'Advertised deposit for rental listings (listing-level, not tenancy-level). Capped at 5 weeks rent per Tenant Fees Act 2019.';
COMMENT ON COLUMN listings.holding_deposit_amount IS
  'Advertised holding deposit (listing-level). Capped at 1 week rent per Tenant Fees Act 2019.';
COMMENT ON COLUMN listings.furnishing IS
  'Furnishing status for rental listings: furnished, unfurnished, part_furnished.';

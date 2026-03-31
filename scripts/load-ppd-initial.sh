#!/usr/bin/env bash
# Load HM Land Registry Price Paid Data into Supabase
# Usage: DATABASE_URL="postgresql://..." ./scripts/load-ppd-initial.sh [path-to-csv]
#
# Requires: psql (PostgreSQL client)
# CSV: Download from https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
#
# IMPORTANT: Use the DIRECT connection string (port 5432), NOT the pooler (port 6543).
# Find it in Supabase Dashboard → Project Settings → Database → Connection string → URI

set -euo pipefail

CSV_PATH="${1:-$HOME/Downloads/pp-complete.csv}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is required."
  echo "Usage: DATABASE_URL='postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres' ./scripts/load-ppd-initial.sh"
  exit 1
fi

if [ ! -f "$CSV_PATH" ]; then
  echo "ERROR: CSV file not found at $CSV_PATH"
  exit 1
fi

ROW_COUNT=$(wc -l < "$CSV_PATH" | tr -d ' ')
echo "=== PPD Initial Load ==="
echo "CSV: $CSV_PATH ($ROW_COUNT rows)"
echo "Target: Supabase (price_paid_transactions)"
echo ""

# Step 1: Create staging table and drop target indexes for fast load
echo "[1/6] Creating staging table and dropping indexes..."
psql "$DATABASE_URL" -c "SET statement_timeout = 0;" -c "
-- Staging table: all TEXT columns to accept raw CSV
CREATE TABLE IF NOT EXISTS ppd_staging (
  col1  TEXT, col2  TEXT, col3  TEXT, col4  TEXT,
  col5  TEXT, col6  TEXT, col7  TEXT, col8  TEXT,
  col9  TEXT, col10 TEXT, col11 TEXT, col12 TEXT,
  col13 TEXT, col14 TEXT, col15 TEXT, col16 TEXT
);
TRUNCATE ppd_staging;

-- Drop indexes on target for faster insert
DROP INDEX IF EXISTS idx_ppd_postcode;
DROP INDEX IF EXISTS idx_ppd_postcode_paon;
DROP INDEX IF EXISTS idx_ppd_postcode_area;
DROP INDEX IF EXISTS idx_ppd_date;
DROP INDEX IF EXISTS idx_ppd_type_date;
DROP INDEX IF EXISTS idx_ppd_town;
DROP INDEX IF EXISTS idx_ppd_district;
DROP INDEX IF EXISTS idx_ppd_street_gin;
"

# Step 2: Bulk load CSV into staging
echo "[2/6] Loading CSV into staging table (this may take 10-20 minutes)..."
psql "$DATABASE_URL" -c "SET statement_timeout = 0;" -c "\copy ppd_staging FROM '$CSV_PATH' WITH (FORMAT csv, QUOTE '\"')"
echo "Staging load complete."

# Step 3: Transform and insert into target table
echo "[3/6] Transforming and inserting into price_paid_transactions..."
psql "$DATABASE_URL" -c "SET statement_timeout = 0;" -c "
INSERT INTO price_paid_transactions (
  transaction_id, price, transaction_date, postcode,
  property_type, is_new_build, tenure,
  paon, saon, street, locality, town_city,
  district, county, transaction_category, record_status
)
SELECT
  REPLACE(REPLACE(col1, '{', ''), '}', ''),
  col2::INTEGER,
  col3::DATE,
  NULLIF(TRIM(col4), ''),
  NULLIF(col5, ''),
  col6 = 'Y',
  NULLIF(col7, ''),
  NULLIF(TRIM(col8), ''),
  NULLIF(TRIM(col9), ''),
  NULLIF(TRIM(col10), ''),
  NULLIF(TRIM(col11), ''),
  NULLIF(TRIM(col12), ''),
  NULLIF(TRIM(col13), ''),
  NULLIF(TRIM(col14), ''),
  NULLIF(col15, ''),
  NULLIF(col16, '')
FROM ppd_staging
ON CONFLICT (transaction_id) DO UPDATE SET
  price = EXCLUDED.price,
  transaction_date = EXCLUDED.transaction_date,
  postcode = EXCLUDED.postcode,
  property_type = EXCLUDED.property_type,
  is_new_build = EXCLUDED.is_new_build,
  tenure = EXCLUDED.tenure,
  paon = EXCLUDED.paon,
  saon = EXCLUDED.saon,
  street = EXCLUDED.street,
  locality = EXCLUDED.locality,
  town_city = EXCLUDED.town_city,
  district = EXCLUDED.district,
  county = EXCLUDED.county,
  transaction_category = EXCLUDED.transaction_category,
  record_status = EXCLUDED.record_status;
"

# Step 4: Drop staging table
echo "[4/6] Dropping staging table..."
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS ppd_staging;"

# Step 5: Recreate indexes
echo "[5/6] Recreating indexes (this may take 5-10 minutes)..."
psql "$DATABASE_URL" -c "SET statement_timeout = 0;" -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_postcode ON price_paid_transactions (postcode);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_postcode_paon ON price_paid_transactions (postcode, paon);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_postcode_area ON price_paid_transactions (postcode_area);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_date ON price_paid_transactions (transaction_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_type_date ON price_paid_transactions (property_type, transaction_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_town ON price_paid_transactions (town_city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_district ON price_paid_transactions (district);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ppd_street_gin ON price_paid_transactions
  USING gin(to_tsvector('english', coalesce(street,'') || ' ' || coalesce(paon,'') || ' ' || coalesce(postcode,'')));
"

# Step 6: Verify
echo "[6/6] Verifying..."
psql "$DATABASE_URL" -c "
SELECT 'Total rows' as metric, count(*)::TEXT as value FROM price_paid_transactions
UNION ALL
SELECT 'Category A (standard)', count(*)::TEXT FROM price_paid_transactions WHERE transaction_category = 'A'
UNION ALL
SELECT 'Category B (additional)', count(*)::TEXT FROM price_paid_transactions WHERE transaction_category = 'B'
UNION ALL
SELECT 'Null postcodes', count(*)::TEXT FROM price_paid_transactions WHERE postcode IS NULL
UNION ALL
SELECT 'Distinct districts', count(DISTINCT district)::TEXT FROM price_paid_transactions
UNION ALL
SELECT 'Date range', MIN(transaction_date)::TEXT || ' to ' || MAX(transaction_date)::TEXT FROM price_paid_transactions;
"

# Log to ppd_sync_log
psql "$DATABASE_URL" -c "
INSERT INTO ppd_sync_log (sync_type, source_file, records_added, status, completed_at)
VALUES ('initial_load', '$CSV_PATH', (SELECT count(*) FROM price_paid_transactions), 'completed', now());
"

echo ""
echo "=== PPD Initial Load Complete ==="
echo "Run district mapping query next:"
echo "  SELECT DISTINCT district, town_city FROM price_paid_transactions WHERE town_city = 'LONDON' ORDER BY district;"

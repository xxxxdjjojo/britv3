#!/bin/bash
# Master seed runner for TrueDeed demo data
# Usage: ./supabase/seed/seed.sh
# Requires: psql connected to your Supabase database

set -euo pipefail

SEED_DIR="$(cd "$(dirname "$0")" && pwd)"

# Safety gate: prevent accidental production seeding
if [ "${DEMO_MODE_ENABLED:-}" != "true" ]; then
  echo "ERROR: DEMO_MODE_ENABLED is not set to 'true'."
  echo "This prevents accidental seeding of production databases."
  echo ""
  echo "To run: DEMO_MODE_ENABLED=true ./supabase/seed/seed.sh"
  exit 1
fi

# Check psql is available
if ! command -v psql &> /dev/null; then
  echo "ERROR: psql is not installed or not in PATH."
  exit 1
fi

echo "========================================="
echo "  TrueDeed Demo Data Seeder"
echo "========================================="
echo ""

# Check for DATABASE_URL or use supabase local
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

echo "Using database: ${DB_URL%%@*}@..."
echo ""

SEED_FILES=(
  "00_demo_users.sql"
  "market_pricing.sql"
  "01_properties_listings.sql"
  "02_agent_data.sql"
  "03_provider_data.sql"
  "04_seller_data.sql"
  "05_landlord_data.sql"
  "06_buyer_renter_cross_role.sql"
)

for file in "${SEED_FILES[@]}"; do
  echo "→ Seeding: $file"
  psql "$DB_URL" -f "$SEED_DIR/$file" 2>&1 | grep -E "NOTICE|WARNING|ERROR" || true
  echo ""
done

echo "========================================="
echo "  Seed complete! Running verification..."
echo "========================================="
echo ""

psql "$DB_URL" -f "$SEED_DIR/verify.sql"

echo ""
echo "========================================="
echo "  Done!"
echo "========================================="

#!/bin/bash
# Master seed runner for Britestate demo data
# Usage: ./supabase/seed/seed.sh
# Requires: psql connected to your Supabase database

set -euo pipefail

SEED_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  Britestate Demo Data Seeder"
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
  psql "$DB_URL" -f "$SEED_DIR/$file" 2>&1 | grep -E "NOTICE|ERROR" || true
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

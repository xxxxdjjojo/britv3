#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"

ERRORS=0

echo "=== Migration Lint ==="
echo ""

# 1. Check for bare CREATE TABLE (no IF NOT EXISTS)
echo "Checking CREATE TABLE statements..."
BARE_TABLES=$(grep -rn "^CREATE TABLE [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$BARE_TABLES" ]; then
  echo "ERROR: Found CREATE TABLE without IF NOT EXISTS:"
  echo "$BARE_TABLES"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check for CREATE POLICY without preceding DROP POLICY IF EXISTS
echo "Checking CREATE POLICY statements..."
for f in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$f" ] || continue
  CREATES=$(grep -c "^CREATE POLICY" "$f" 2>/dev/null || echo 0)
  DROPS=$(grep -c "^DROP POLICY IF EXISTS" "$f" 2>/dev/null || echo 0)
  if [ "$CREATES" -gt "$DROPS" ] 2>/dev/null; then
    echo "ERROR: $(basename "$f") has $CREATES CREATE POLICY but only $DROPS DROP POLICY IF EXISTS"
    ERRORS=$((ERRORS + 1))
  fi
done

# 3. Check for CREATE INDEX without IF NOT EXISTS
echo "Checking CREATE INDEX statements..."
BARE_INDEXES=$(grep -rn "^CREATE INDEX [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
BARE_UNIQUE=$(grep -rn "^CREATE UNIQUE INDEX [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$BARE_INDEXES" ] || [ -n "$BARE_UNIQUE" ]; then
  echo "ERROR: Found CREATE INDEX without IF NOT EXISTS:"
  echo "$BARE_INDEXES"
  echo "$BARE_UNIQUE"
  ERRORS=$((ERRORS + 1))
fi

# 4. Check for duplicate timestamp prefixes
echo "Checking for duplicate timestamps..."
ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  sed 's|.*/||; s|_.*||' | \
  sort | uniq -d | while read -r dup; do
    echo "ERROR: Duplicate timestamp prefix '$dup':"
    ls "$MIGRATIONS_DIR"/"${dup}"_*.sql 2>/dev/null
    ERRORS=$((ERRORS + 1))
  done

# 5. Check for bare CREATE TYPE (no exception handler)
echo "Checking CREATE TYPE statements..."
BARE_TYPES=$(grep -rn "^CREATE TYPE.*AS ENUM" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "DO \$\$" || true)
if [ -n "$BARE_TYPES" ]; then
  echo "WARNING: Found CREATE TYPE without exception handler:"
  echo "$BARE_TYPES"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS migration lint error(s) found."
  exit 1
else
  echo "PASSED: All migrations look idempotent."
  exit 0
fi

#!/usr/bin/env bash
#
# e2e-local.sh — run the dashboard E2E smoke suite against a LOCAL Supabase.
#
# Why: the M2 Playwright suite is correct but flaky against the shared hosted DB
# (other sessions mutate it between specs — see docs/DASHBOARD_M2_FINDINGS.md).
# This script makes the suite a deterministic gate by standing up an isolated
# local Supabase, applying every migration fresh, seeding all 7 roles, and
# pointing the dev server at it via process-env overrides (which take precedence
# over .env.local in Next.js, so every other secret in .env.local still applies).
#
# Usage:
#   scripts/e2e-local.sh                       # runs the 3 gate specs, chromium
#   scripts/e2e-local.sh dashboard-smoke       # a subset
#   E2E_PROJECT=mobile scripts/e2e-local.sh    # a different Playwright project
#
# Requires: Docker running, supabase CLI, pnpm. Run from the repo root.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$#" -gt 0 ]; then SPECS=("$@"); else SPECS=(dashboard-smoke admin-smoke dashboard-access); fi
PROJECT="${E2E_PROJECT:-chromium}"
# Dedicated port so the gate never collides with a dev server from another worktree.
PORT="${E2E_PORT:-3100}"
export PORT
export E2E_BASE_URL="http://localhost:${PORT}"

SUPABASE_E2E_EXCLUDE_SERVICES="${SUPABASE_E2E_EXCLUDE_SERVICES:-realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor}"

load_supabase_env() {
  local status_env
  status_env="$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' || true)"
  eval "$status_env"
}

echo "==> [1/4] Ensuring local Supabase is running"
echo "    excluding nonessential services: $SUPABASE_E2E_EXCLUDE_SERVICES"
supabase start --exclude "$SUPABASE_E2E_EXCLUDE_SERVICES"

load_supabase_env
if [ -z "${API_URL:-}" ] || [ -z "${ANON_KEY:-}" ] || [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "[e2e-local] FATAL: Supabase local stack is not running"
  exit 1
fi

echo "==> [2/4] Resetting local DB (applies all migrations)"
supabase db reset

echo "==> [3/4] Seeding all-role test users"
# Map machine-readable local status to the names the app + seed expect.
load_supabase_env
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

# `supabase db reset` restarts the containers and returns before PostgREST has
# reloaded its schema cache for the new schema. Seeding immediately races that
# reload and the table/RPC writes fail with PGRST002 ("Could not query the
# database for the schema cache"), which leaves roles/subscriptions unseeded and
# makes the gate non-deterministic. Nudge a reload and wait until PostgREST
# answers at its schema root before seeding. Avoid table-level probes here:
# grants/RLS can return 401/403 even when PostgREST is ready.
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "NOTIFY pgrst, 'reload schema';" >/dev/null 2>&1 || true
echo "    waiting for PostgREST schema cache..."
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    "$API_URL/rest/v1/" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY")
  [ "$code" = "200" ] && break
  sleep 1
done
[ "${code:-}" = "200" ] || { echo "PostgREST not ready (last HTTP $code)"; exit 1; }

# Seed reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
SUPABASE_URL="$API_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  node supabase/seed/seed-test-users.ts

# The seed logs-and-continues on error, so a partial seed (e.g. a lingering
# PGRST002) would otherwise surface as confusing test failures instead of a loud
# seed failure. Verify the state the gate depends on: all 7 non-admin roles
# assigned and the 3 gated roles carry an active subscription.
echo "    verifying seeded state..."
LDB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
roles=$(psql "$LDB" -tAc "select count(distinct active_role) from public.profiles where active_role in ('homebuyer','renter','seller','landlord','agent','service_provider','mortgage_broker');")
subs=$(psql "$LDB" -tAc "select count(*) from public.subscriptions s join public.profiles p on p.id=s.user_id where p.active_role in ('landlord','agent','service_provider') and s.status='active';")
if [ "${roles:-0}" -lt 7 ] || [ "${subs:-0}" -lt 3 ]; then
  echo "Seed verification FAILED: distinct roles=$roles (want 7), active gated subs=$subs (want 3)"
  exit 1
fi
echo "    seed verified: 7 roles, 3 active gated subscriptions."

echo "==> [4/4] Running Playwright (${SPECS[*]} | project=$PROJECT)"
# CI=1 forces Playwright to start its OWN dev server (no reuse of a stray hosted
# server on :3000), with workers=1 + retries=2 for a stable gate. The exported
# NEXT_PUBLIC_* vars above flow into that dev server and override .env.local.
CI=1 pnpm exec playwright test "${SPECS[@]}" --project="$PROJECT"

echo "==> Done. Local-DB E2E gate complete."

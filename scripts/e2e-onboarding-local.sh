#!/usr/bin/env bash
#
# e2e-onboarding-local.sh — reset-FREE local E2E runner for the partner-ingestion
# onboarding vertical.
#
# WHY THIS EXISTS (read before modifying):
#   The canonical `scripts/e2e-local.sh` runs `supabase db reset` to get a clean
#   DB before tests. That is fine for a purely additive schema, but our local DB
#   has a pre-existing "017 reset drift": the schema_migrations history table
#   contains ~89 legacy short-token versions (e.g. "017") that pre-date the
#   14-digit prefix convention. When `supabase db reset` replays the full migration
#   history it hits the `017_service_provider_details(id)` entry and fails,
#   leaving the dev DB broken.
#
#   This runner skips db reset entirely. It uses the EXISTING migrated local DB
#   (which is already at the org-model migrations 20260619140000/140001/140002)
#   and layers only the deterministic onboarding fixture on top via
#   scripts/seed-onboarding-fixture.mjs.
#
#   See docs/PARTNER_INGESTION_NEXT_SESSION_PROMPT.md §4 ("Local DB has
#   migration-history drift") for the full context. The §6 gate's `e2e-local.sh`
#   reference is superseded for onboarding E2E by THIS script (e2e-onboarding-local.sh).
#
# Usage:
#   scripts/e2e-onboarding-local.sh                         # default onboarding spec
#   scripts/e2e-onboarding-local.sh agency-portfolio-onboarding   # explicit spec
#   E2E_PROJECT=mobile scripts/e2e-onboarding-local.sh      # different PW project
#
# Requirements: Docker running, supabase CLI, pnpm, tsx (via pnpm).
# Run from the repo root (the script cds there automatically).
set -euo pipefail

cd "$(dirname "$0")/.."

# Default to the onboarding spec. C2 will add agency-portfolio-onboarding.
if [ "$#" -gt 0 ]; then SPECS=("$@"); else SPECS=(agency-portfolio-onboarding); fi
PROJECT="${E2E_PROJECT:-chromium}"
PORT="${E2E_PORT:-3101}"   # distinct port to avoid collisions with e2e-local.sh on 3100
export PORT
export E2E_BASE_URL="http://localhost:${PORT}"

echo "==> [1/4] Ensuring local Supabase is running (NO db reset)"
# idempotent; no-op if already up; no reset — the existing migrated DB is used as-is.
supabase start >/dev/null 2>&1 || true

echo "==> [2/4] Exporting local env (overrides .env.local so Next.js hits local, not prod)"
# Grab the local API URL / keys from the running stack.
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"

# Fail loudly if supabase start didn't actually bring the stack up.
# Under `set -u` an unset var would abort with a cryptic "unbound variable" error;
# this gives a clear, actionable message instead.
if [ -z "${API_URL:-}" ] || [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "[e2e-onboarding-local] FATAL: Supabase local stack is not running — run 'supabase start'"
  exit 1
fi

# These process-env vars take precedence over .env.local in Next.js builds / dev servers.
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

# Nudge PostgREST to reload schema cache (important after container restarts).
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "NOTIFY pgrst, 'reload schema';" >/dev/null 2>&1 || true
echo "    waiting for PostgREST schema cache..."
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    "$API_URL/rest/v1/profiles?select=id&limit=1" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY")
  [ "$code" = "200" ] && break
  sleep 1
done
[ "${code:-}" = "200" ] || { echo "PostgREST not ready (last HTTP $code)"; exit 1; }
echo "    PostgREST ready."

echo "==> [2b] Ensuring set_property_coordinates RPC exists locally"
# This function exists on prod but was added out-of-band (no migration file).
# Create it idempotently so the publish pipeline works in E2E.
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" >/dev/null 2>&1 <<'SQL'
CREATE OR REPLACE FUNCTION public.set_property_coordinates(
  p_property_id uuid,
  p_lng double precision,
  p_lat double precision
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.properties
  SET coordinates = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  WHERE id = p_property_id;
$$;
SQL
echo "    set_property_coordinates: ok"

echo "==> [3/4] Seeding test users + onboarding fixture"
# Step 1: all-role users (idempotent — skips existing users).
SUPABASE_URL="$API_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  node --experimental-strip-types supabase/seed/seed-test-users.ts

# Step 2: onboarding fixture (organisation + membership + integration for test-agent).
SUPABASE_URL="$API_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  node scripts/seed-onboarding-fixture.mjs

# Verify seed state: test-agent must exist + have an org membership.
echo "    verifying seeded state..."
LDB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
agent_exists=$(psql "$LDB" -tAc "SELECT COUNT(*) FROM auth.users WHERE email='test-agent@britestate.test';")
org_exists=$(psql "$LDB" -tAc "SELECT COUNT(*) FROM public.organisations WHERE slug='e2e-onboarding-agency';")
mem_exists=$(psql "$LDB" -tAc "
  SELECT COUNT(*) FROM public.organisation_memberships m
  JOIN auth.users u ON u.id = m.user_id
  WHERE u.email = 'test-agent@britestate.test';")

if [ "${agent_exists:-0}" -lt 1 ]; then
  echo "Seed verification FAILED: test-agent@britestate.test not found in auth.users"; exit 1
fi
if [ "${org_exists:-0}" -lt 1 ]; then
  echo "Seed verification FAILED: e2e-onboarding-agency organisation not found"; exit 1
fi
if [ "${mem_exists:-0}" -lt 1 ]; then
  echo "Seed verification FAILED: test-agent has no organisation_memberships row"; exit 1
fi
echo "    seed verified: agent=${agent_exists} org=${org_exists} memberships=${mem_exists}"

echo "==> [4/4] Running Playwright (${SPECS[*]} | project=$PROJECT)"
# CI=1 forces Playwright to start its own Next.js dev server (no reuse of a stray
# server on :3000), with workers=1 + retries=2. The exported NEXT_PUBLIC_* vars
# flow into that dev server and override .env.local so it hits local Supabase.
CI=1 pnpm exec playwright test "${SPECS[@]}" --project="$PROJECT"

echo "==> Done. Onboarding local-DB E2E gate complete."

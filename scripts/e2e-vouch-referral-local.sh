#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-test}"
if [ "$MODE" != "test" ] && [ "$MODE" != "prepare-only" ]; then
  echo "Usage: scripts/e2e-vouch-referral-local.sh [test|prepare-only]" >&2
  exit 2
fi

PORT="${VOUCH_E2E_PORT:-3014}"
export VOUCH_E2E_PORT="$PORT"
export E2E_BASE_URL="http://127.0.0.1:${PORT}"
export SKIP_ENV_VALIDATION="true"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_vouch_e2e}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_vouch_e2e}"
export QUOTE_SIGNING_SECRET="${QUOTE_SIGNING_SECRET:-vouch-e2e-quote-signing-secret}"

EXCLUDE="${SUPABASE_E2E_EXCLUDE_SERVICES:-realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor}"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

load_supabase_env() {
  local status_env
  status_env="$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' || true)"
  eval "$status_env"
}

echo "==> Starting isolated local Supabase services"
supabase start --exclude "$EXCLUDE"

echo "==> Rebuilding the local database from migrations"
supabase db reset
load_supabase_env
if [ -z "${API_URL:-}" ] || [ -z "${ANON_KEY:-}" ] || [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "Local Supabase did not expose API credentials" >&2
  exit 1
fi

export SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

if [ -n "${GITHUB_ENV:-}" ]; then
  {
    echo "SUPABASE_URL=$API_URL"
    echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
    echo "SKIP_ENV_VALIDATION=true"
    echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
    echo "QUOTE_SIGNING_SECRET=$QUOTE_SIGNING_SECRET"
  } >> "$GITHUB_ENV"
fi

psql "$DB_URL" >/dev/null <<'SQL'
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
notify pgrst, 'reload schema';
SQL

echo "==> Waiting for PostgREST schema cache"
code="000"
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/rest/v1/" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY")"
  [ "$code" = "200" ] && break
  sleep 1
done
[ "$code" = "200" ] || { echo "PostgREST not ready (HTTP $code)" >&2; exit 1; }

rm -rf test-results/evidence/vouch-referral playwright-report/vouch-referral
node scripts/e2e-vouch-referral-seed.mjs
export VOUCH_FIXTURES_SEEDED="true"

echo "==> Building the exact production bundle used for browser proof"
pnpm build

if [ "$MODE" = "prepare-only" ]; then
  echo "Vouch/referral local stack, fixtures, and production build are ready."
  exit 0
fi

echo "==> Running desktop and iPhone 14 evidence projects"
CI=1 pnpm exec playwright test --config playwright.vouch-referral.config.ts

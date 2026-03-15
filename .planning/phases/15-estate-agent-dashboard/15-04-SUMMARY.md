---
phase: 15
plan: 04
subsystem: estate-agent-dashboard
tags: [services, api-routes, analytics, billing, feeds, stripe]
dependency_graph:
  requires: [src/types/agent.ts, src/lib/supabase/server.ts]
  provides:
    - src/services/agent/agent-analytics-service.ts
    - src/services/agent/agent-billing-service.ts
    - src/services/agent/agent-feed-service.ts
    - src/app/api/agent/analytics/route.ts
    - src/app/api/agent/billing/route.ts
    - src/app/api/agent/feeds/route.ts
    - src/app/api/agent/reports/route.ts
  affects: [estate-agent-dashboard]
tech_stack:
  added: [stripe@20.4.1]
  patterns:
    - Supabase client passed as first argument (testability pattern)
    - Stripe Checkout and Portal sessions via stripe@20.4.1
    - crypto.randomUUID() + SHA-256 hash for API key storage (never store plaintext)
    - Resend email with try/catch fail-safe for non-blocking invites
    - Array.from(map.entries()) for ES2017 target Map iteration
    - Recharts-shaped time series data (TimeSeriesPoint[])
key_files:
  created:
    - src/services/agent/agent-analytics-service.ts
    - src/services/agent/agent-billing-service.ts
    - src/services/agent/agent-feed-service.ts
    - src/app/api/agent/analytics/route.ts
    - src/app/api/agent/billing/route.ts
    - src/app/api/agent/feeds/route.ts
    - src/app/api/agent/reports/route.ts
  modified: []
decisions:
  - stripe package installed (pnpm add stripe) since billing service requires it
  - crypto.randomUUID() used instead of randomBytes for API key generation (native Node, no import needed)
  - key_hash excluded from getApiKeys return type by design (security: never expose hash)
  - Resend invite emails wrapped in try/catch so team member insert succeeds even if RESEND_API_KEY missing
  - CRM, team, and branches services/routes were already built in prior plan execution; only the 3 missing services and 4 missing routes created here
requirements_completed: [AGT-17, AGT-18, AGT-19, AGT-20, AGT-21, AGT-22, AGT-23, AGT-24, AGT-25, AGT-26, AGT-27, AGT-28, AGT-29, AGT-30, AGT-31, AGT-32]
metrics:
  duration: ~35m
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 7
---

# Phase 15 Plan 04: Agent Service Layer (Analytics, Billing, Feeds) Summary

**One-liner:** Three new Supabase service modules and four REST API routes for estate-agent performance analytics with Recharts-shaped data, Stripe subscription/boost billing with SHA-256 API key management, and CRM feed integrations for Reapit/Alto/Jupix.

## What Was Built

Note: `agent-crm-service.ts`, `agent-team-service.ts`, `api/agent/crm/route.ts`, and `api/agent/team/route.ts` were already created in a prior execution. This run created the remaining three services and four routes.

### Service Files

**agent-analytics-service.ts** — Agent and branch performance reports aggregating commissions, accepted offers, and lead conversion rate. Data shaped as `TimeSeriesPoint[]` for Recharts (monthly groupings). Competitor analysis groups listings by agent per postcode district. Vendor report generation persists to `agent_vendor_reports`. Market appraisal calculates avg, median, and ±10% price range from comparable active listings.

**agent-billing-service.ts** — Stripe Checkout sessions (subscription and one-time boost), Stripe Customer Portal URL generation. `getCurrentSubscription` looks up `stripe_customer_id` from profiles. `generateApiKey` uses `crypto.randomUUID()` with SHA-256 hash stored in `agent_api_keys.key_hash`; raw key returned exactly once. `getApiKeys` returns all keys with `key_hash` omitted from the response type.

**agent-feed-service.ts** — CRUD for `agent_feed_integrations` supporting Reapit/Alto/Jupix providers. API keys stored as-is in `api_key_encrypted` column (Supabase Vault encryption is a future upgrade). `getFeedSyncStatus` returns `sync_status`, `last_sync_at`, and `error_log` for a single integration.

### API Routes

All routes follow the project pattern: `createClient()` from `@/lib/supabase/server`, `supabase.auth.getUser()` auth guard, try/catch with `console.error`, `NextResponse.json()`.

| Route | Methods | Notes |
|-------|---------|-------|
| `/api/agent/analytics` | GET | ?type=agent\|branch\|competitor\|appraisal; optional ?from/to date range |
| `/api/agent/billing` | GET, POST, DELETE | GET ?type=subscription\|keys; POST ?action=checkout\|portal\|boost\|generate_key; DELETE ?keyId= |
| `/api/agent/feeds` | GET, POST, PATCH, DELETE | ?id for PATCH/DELETE; ?id&status=true for sync status only |
| `/api/agent/reports` | GET, POST | GET ?propertyId=; POST { propertyId, reportType } |

## Deviations from Plan

### Auto-fixed Issues

None.

### Deviation: Stripe was already missing but now installed

- **Found during:** Task 1 review of package.json
- **Fix:** Ran `pnpm add stripe` (installed stripe@20.4.1). Used live `import Stripe from "stripe"` with a helper `getStripe()` that throws clearly if `STRIPE_SECRET_KEY` is not set.
- **Commit:** cba0925

## Self-Check: PASSED

All 7 files confirmed present on disk. `npx tsc --noEmit --project tsconfig.json` reports zero errors in the new files (only pre-existing error in TeamMemberList.tsx unrelated to this plan). Commits 7381022, bef0062, cba0925 verified in git log.

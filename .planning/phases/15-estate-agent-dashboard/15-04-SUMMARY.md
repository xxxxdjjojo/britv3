---
phase: 15
plan: 04
subsystem: estate-agent-dashboard
tags: [services, api-routes, crm, team, analytics, billing, feeds]
dependency_graph:
  requires: [src/types/agent.ts, src/lib/supabase/server.ts]
  provides:
    - src/services/agent/agent-crm-service.ts
    - src/services/agent/agent-team-service.ts
    - src/services/agent/agent-analytics-service.ts
    - src/services/agent/agent-billing-service.ts
    - src/services/agent/agent-feed-service.ts
    - src/app/api/agent/crm/route.ts
    - src/app/api/agent/team/route.ts
    - src/app/api/agent/analytics/route.ts
    - src/app/api/agent/billing/route.ts
    - src/app/api/agent/feeds/route.ts
    - src/app/api/agent/reports/route.ts
  affects: [estate-agent-dashboard]
tech_stack:
  added: []
  patterns:
    - Supabase client passed as first argument (testability pattern)
    - Stripe stub pattern (package not installed, throws at runtime)
    - Base64 API key encoding (placeholder for Supabase Vault)
    - Resend email with try/catch fail-safe for non-blocking invites
    - SHA-256 key hashing for API key storage (never store plaintext)
key_files:
  created:
    - src/services/agent/agent-crm-service.ts
    - src/services/agent/agent-team-service.ts
    - src/services/agent/agent-analytics-service.ts
    - src/services/agent/agent-billing-service.ts
    - src/services/agent/agent-feed-service.ts
    - src/app/api/agent/crm/route.ts
    - src/app/api/agent/team/route.ts
    - src/app/api/agent/analytics/route.ts
    - src/app/api/agent/billing/route.ts
    - src/app/api/agent/feeds/route.ts
    - src/app/api/agent/reports/route.ts
  modified: []
decisions:
  - Stripe stubs used because stripe package is absent from package.json; all Stripe functions throw descriptive errors at runtime
  - Base64 encoding used as placeholder for API key encryption pending Supabase Vault integration
  - Resend invite emails wrapped in try/catch so team member insert succeeds even if email API key missing
  - key_hash excluded from getApiKeys return type by design (security: never expose hash)
metrics:
  duration: ~25m
  completed_date: "2026-03-14"
  tasks_completed: 1
  files_created: 11
---

# Phase 15 Plan 04: Agent Service Layer (CRM, Team, Analytics, Billing, Feeds) Summary

**One-liner:** Five typed Supabase service modules and six REST API routes for estate-agent CRM, team/branch management, performance analytics, billing/API-key management, and CRM feed integrations.

## What Was Built

### Service Files

**agent-crm-service.ts** — Full CRM client CRUD with ilike text search across name/email/phone/notes, client_type and tags filtering, pagination via `.range()`, and automatic `last_contact_at` timestamp when notes-related fields are updated.

**agent-team-service.ts** — Team member invite (status=pending, Resend email fire-and-forget), role updates, soft removal (status=inactive), branch CRUD, and member-to-branch assignment. Resend call is wrapped in try/catch so invite still succeeds without a configured API key.

**agent-analytics-service.ts** — Agent and branch performance reports (sold listings, time on market, revenue from commissions, lead conversion rate, monthly breakdowns). Competitor analysis grouping listings by agent in a postcode area. Vendor report generation with persistence to `agent_vendor_reports`. Market appraisal returning comparable sold listings and suggested price range.

**agent-billing-service.ts** — Stripe integration stubbed (package absent) with descriptive runtime errors. API key generation using `randomBytes(32)` with SHA-256 hash storage — full key returned only once. Key revocation and listing (key_hash excluded from all list responses).

**agent-feed-service.ts** — Feed integration CRUD for Reapit/Alto/Jupix providers. API keys base64-encoded before storage (placeholder for Supabase Vault). Sync status query returning `sync_status`, `last_sync_at`, and `error_log`.

### API Routes

All routes follow the project pattern: `createClient()` from `@/lib/supabase/server`, `supabase.auth.getUser()` auth guard, try/catch with logged errors, `NextResponse.json()`.

| Route | Methods | Notes |
|-------|---------|-------|
| `/api/agent/crm` | GET, POST, PATCH | ?search, ?client_type; id in body for PATCH |
| `/api/agent/team` | GET, POST, PATCH, DELETE | ?action=invite_member\|create_branch\|update_role\|assign_branch |
| `/api/agent/analytics` | GET | ?type=agent\|branch\|competitor\|appraisal |
| `/api/agent/billing` | GET, POST | ?action=checkout\|portal\|generate_key\|revoke_key\|boost |
| `/api/agent/feeds` | GET, POST, PATCH, DELETE | ?id for DELETE |
| `/api/agent/reports` | GET, POST | ?property_id for GET filter |

## Deviations from Plan

### Auto-fixed Issues

None.

### Intentional Deviations

**1. Stripe stubs instead of live SDK**
- **Found during:** Task start (package.json review)
- **Issue:** `stripe` package not present in package.json
- **Fix:** All Stripe functions call `stripeNotConfigured()` which throws a descriptive `Error("Stripe not configured: install the stripe package and set STRIPE_SECRET_KEY.")`. This allows TypeScript compilation to succeed and provides a clear error message when called at runtime.
- **To activate:** Run `pnpm add stripe` and replace the stub with `import Stripe from "stripe"` + initialise with `apiVersion: "2025-01-27.acacia"`.

## Self-Check: PASSED

All 11 files exist and `npx tsc --noEmit` reports zero errors in `src/services/agent/` and `src/app/api/agent/`. Commit `6593b53` verified in git log.

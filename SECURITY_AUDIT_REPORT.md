# Britestate (britv3) — Security Audit Report

**Date:** 2026-06-16
**Scope:** Full codebase at `/Users/jojominime/Documents/britv3main/britv3` (Next.js 16.2.1, React 19.2.3, Supabase, Stripe, Inngest, Resend, Anthropic SDK)
**Purpose:** Pre-launch readiness for early-user testing
**Methodology:** Read-only static review of ~180 API routes, middleware, Supabase migrations, security configs; `pnpm audit`; targeted secret/redirect/SQL scans; cross-check against existing `architecture_audit.md`

---

## 1. Executive Summary

**Overall rating: MUST NOT LAUNCH TO EARLY USERS AS-IS.**

The application's *first-party* security architecture is largely strong — fail-closed admin RBAC, signed Stripe/Inngest webhooks, nonce-based CSP, t3-env schema, server-side magic-byte upload validation, sanitized SEO JSON-LD, no hardcoded secrets in source, `.env*` correctly gitignored. The product-level security model is well thought out.

However, **three categories of pre-launch blockers** must be resolved first:

1. **Dependency vulnerabilities — 108 advisories (2 critical, 37 high, 61 moderate, 8 low)** including **multiple Next.js middleware-bypass CVEs**. Since the entire authorization model depends on `src/middleware.ts`, every middleware-bypass CVE is a direct attack on the auth gate. This alone makes the current install unsafe to expose.
2. **Cascading data destruction** — `ON DELETE CASCADE` chains rooted at `public.profiles(id)` in the marketplace tables (carried over from a prior P0 audit finding, still present). One bad profile delete wipes connected marketplace, portfolio, and review data with no recovery path.
3. **Operational unknowns** that must be verified *outside* the codebase before launch: Supabase storage bucket RLS, Sentry PII scrubbing, production env values in the hosting platform, real domain CSP report-only deployment.

Two critical caveats unrelated to security but blocking launch quality:
- A schema drift bug was observed in live logs: `column viewing_slots.starts_at does not exist` → `/api/properties/[slug]/viewing-slots` returns 500.
- A React hydration mismatch fires from `MortgageCalculator.tsx:297` on property pages.

Once dependencies are patched (`pnpm update` + targeted overrides) and the cascade-delete chain is replaced with `ON DELETE RESTRICT` + an explicit GDPR purge job, the remaining findings are tractable medium/low fixes.

**Recommended path:** fix all CRITICAL and HIGH items below → re-run `pnpm audit` to confirm clean → invite the first cohort.

---

## 2. Scope & Methodology

**Reviewed in source:**
- Authentication & authorization: `src/middleware.ts`, `src/lib/admin-guard.ts`, `src/lib/audited-admin-action.ts`, `src/lib/admin-permissions.ts`, `src/app/auth/callback/route.ts`
- API routes: `src/app/api/**/route.ts` (~180 files), with focused reads on `offers`, `seller/listings`, `reviews/list`, `push/send`, `webhooks/stripe`, `inngest`
- Database surface: `supabase/migrations/` (all files), checked for RLS, cascade deletes, SECURITY DEFINER, partitioning
- Headers / CSP / Sentry: `src/middleware.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`, `next.config.ts`
- XSS surface: every `dangerouslySetInnerHTML` callsite, DOMPurify config in `src/lib/validation/sanitize.ts`, `safeJsonLd()` in `src/lib/seo/safe-json-ld.ts`
- Secrets: env schema in `src/env.ts`, repository-wide regex scan for `sk_live_`, `sk_test_`, `sk-ant-`, `re_`, `BEGIN ... PRIVATE KEY`
- Scripts: `scripts/` (ingest, Stripe setup, audits)

**Tools used:** `pnpm audit`, `grep` over the tree (excluding `node_modules`/`.next`), `lsof`/`ps` to verify dev server, direct file reads.

**Out of scope (recommended for follow-up):**
- Penetration testing (SSRF probes against `/api/geocode` proxy, race-condition testing on offers/listings)
- Supabase console verification (storage bucket policies, dashboard RLS, JWT custom claims setup)
- Hosting platform verification (Vercel/Netlify env values, domain HSTS preload state)
- Authenticated end-to-end black-box testing

---

## 3. Findings by Severity

Each finding has an ID (`BRIT-Sxxx`), file:line evidence, impact, exploit scenario, remediation, and effort.

### CRITICAL

#### BRIT-S001 — Cascading delete chain rooted at `public.profiles(id)`
**Files:** `supabase/migrations/002_marketplace.sql:100, 129, 163, 220, 279, 309, 321`
**Evidence:**
```sql
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
```
**Impact:** A single accidental or malicious profile deletion (admin operator error, compromised admin account, or a bug in a service-role code path) silently destroys connected marketplace listings, reviews, portfolio items, and quotes with no soft-delete fallback. No way to undo. This was already flagged as a P0 in the pre-existing `architecture_audit.md` and is still present.
**Exploit scenario:** An attacker with compromised admin credentials (or simply an operator running a "purge test user" script) deletes a row from `profiles` → cascades wipe production marketplace data linked to that user. Equally bad: a buggy GDPR purge job fires CASCADE before the supposed purge logic runs.
**Remediation:** Replace `ON DELETE CASCADE` with `ON DELETE RESTRICT` on every FK from marketplace tables to `profiles(id)`. Move user deletion behind an explicit, audited GDPR purge function that nulls/anonymises rather than deletes connected data. The cascades on `auth.users(id)` elsewhere are conventional Supabase pattern and lower-risk because `auth.users` is mediated by the auth service — keep those for now, but audit the ones in `002_marketplace.sql` first.
**Effort:** Medium — migration to drop and recreate FKs, plus implementing the purge function; can be done in a single day.

#### BRIT-S002 — 2 critical and 37 high-severity dependency advisories, including multiple Next.js middleware-bypass CVEs
**Files:** `package.json`, `pnpm-lock.yaml`
**Evidence (`pnpm audit` 2026-06-16 — 108 vulnerabilities: 2 critical / 37 high / 61 moderate / 8 low):**
- **CRITICAL:** Arbitrary code execution in `protobufjs` (pulled in transitively via `@grpc/grpc-js` and instrumentation deps)
- **CRITICAL:** Vitest UI server arbitrary file read/execute when listening (dev only, but still ships in lockfile)
- **HIGH x5+:** Next.js Middleware / Proxy bypass in App Router (multiple distinct CVEs), Pages router middleware bypass, Next.js SSRF, Next.js DoS via Server Components, Next.js DoS via connection
- **HIGH:** Vite `server.fs.deny` bypass, Vite arbitrary file read via dev server, Vite Windows alternate stream bypass
- **HIGH:** Undici WebSocket overflows / memory exhaustion / unhandled exceptions
- **HIGH:** path-to-regexp ReDoS, picomatch ReDoS x2, lodash `_.template` code injection
- **HIGH:** fast-uri path traversal + host confusion (used by ajv/zod tooling), ws memory exhaustion
- **HIGH:** Happy DOM unsanitized export (test-only but in tree)
- **LOW:** 4 separate DOMPurify advisories — XSS sanitiser used to render SEO JSON-LD and user-derived content; upgrade to ≥3.4.9
**Impact:** Every Next.js middleware-bypass CVE directly defeats `src/middleware.ts`, which is the *only* gate in front of `/dashboard/*`, `/admin/*`, the subscription gate, the MFA gate, and the verification gate. An attacker who can fingerprint the framework version (trivial: header probe) can target the public CVE against the live app. This single class of issues is why the launch readiness is BLOCK rather than WARN.
**Remediation:** Run `pnpm update next` to land the patched Next.js 16.2.x build; for transitive criticals, add `pnpm.overrides` entries in `package.json` for `protobufjs`, `undici`, `lodash`, `dompurify`, `vite`, `path-to-regexp`. Re-run `pnpm audit` until criticals and highs are zero. Track the moderate set and patch within 7 days.
**Effort:** Small to medium — most patches are minor-version bumps. Allow a buffer for re-running the Vitest/Playwright suites after the Vite/Happy DOM bumps.

---

### HIGH

#### BRIT-S003 — Missing `Strict-Transport-Security` (HSTS) header
**Files:** `src/middleware.ts:49-59` (`setSecurityHeaders()`)
**Evidence:** Headers set are `Content-Security-Policy`, `x-nonce`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. There is no `Strict-Transport-Security` header on any response.
**Impact:** First-time visitors are vulnerable to TLS-stripping MITM on hostile networks (cafe Wi-Fi, hotel captive portals). Browsers that already learned HSTS for `britestate.co.uk` (via prior visits or preload) are fine, but launch traffic to an early-tester cohort will mostly be first-visit traffic.
**Remediation:** Add `response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");` in `setSecurityHeaders()`. After 30 days of clean deploys, submit the domain to the HSTS preload list at https://hstspreload.org.
**Effort:** Trivial — one line.

#### BRIT-S004 — Open-redirect bypass risk in OAuth callback
**Files:** `src/app/auth/callback/route.ts:18-19`
**Evidence:**
```ts
const rawNext = searchParams.get("next");
const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
```
**Impact:** The prefix check blocks `//evil.com` (protocol-relative), but `/\evil.com` and various backslash/whitespace combinations are normalised differently across browsers. Chromium has historically treated `/\` as `//` in URL parsing, allowing redirect to `evil.com`. The redirect target `${origin}${next}` is then a phishing landing page after a successful OAuth flow — extremely high-trust context.
**Exploit scenario:** Attacker sends victim a phishing link to `/login?next=/\evil.com/login`. Victim authenticates with Google (legitimate), is then redirected to `evil.com/login` which mirrors the Britestate login page; victim assumes they need to "log in again", re-enters credentials → attacker has them.
**Remediation:** Replace prefix check with an allow-list:
```ts
const ALLOWED_NEXT = /^\/(dashboard|register|onboarding|search|properties|providers)(\/|$)/;
const next = rawNext && ALLOWED_NEXT.test(rawNext) ? rawNext : "/dashboard";
```
Also strip backslashes/whitespace explicitly before testing.
**Effort:** Trivial.

#### BRIT-S005 — Sentry config does not pin PII handling or scrub sensitive payloads
**Files:** `sentry.server.config.ts:1-9`, `sentry.edge.config.ts:1-9`, `src/instrumentation-client.ts:1-11`
**Evidence:** Each config is a 5–8 line `Sentry.init` with `tracesSampleRate: 0.1` and (client only) `replaysOnErrorSampleRate: 1.0`. There is no `sendDefaultPii: false`, no `beforeSend` hook, no `denyUrls`, no PII scrubber.
**Impact:** `@sentry/nextjs` v10's default for `sendDefaultPii` is now `false`, so headers/IPs are not auto-attached — but the project also captures replays on errors. Replay traffic can include sensitive form fields (mortgage figures, offer amounts, contact info, KYC/AIP file metadata) unless the replay integration is explicitly configured to mask. This is a leak risk for the marketplace.
**Remediation:** Set both configs explicitly:
```ts
Sentry.init({
  dsn: ...,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  beforeSend(event) {
    if (event.request?.headers) delete event.request.headers["cookie"];
    if (event.request?.headers) delete event.request.headers["authorization"];
    return event;
  },
});
```
Also document a quarterly review of what Sentry has been ingesting.
**Effort:** Small.

---

### MEDIUM

#### BRIT-S006 — `/api/seller/listings` POST has no body validation
**Files:** `src/app/api/seller/listings/route.ts:23-39`
**Evidence:**
```ts
const body = await request.json();
const listing = await createListing(supabase, body);
```
The downstream `createListing()` (`src/services/seller/listing-service.ts:94-130`) types its `input` parameter but performs no runtime validation; user-supplied JSON is spread directly into the Supabase insert with `seller_id: user.id` overriding only that one field.
**Impact:** An authenticated user can submit unexpected columns in the body. Whether those land in the database depends on the Supabase column allow-list and PostgREST's behaviour for unknown fields; at minimum, malformed types (e.g. `postcode: { $ne: null }`) can cause uncaught errors that leak to the 500 response message at line 37 (`error: err.message` on the duplicate-listing branch returns the raw error).
**Remediation:** Add a Zod schema mirroring the `Readonly<{...}>` shape in `createListing`. Parse with `safeParse` and 400 on failure.
**Effort:** Trivial.

#### BRIT-S007 — `/api/offers` POST uses manual `typeof` checks instead of Zod
**Files:** `src/app/api/offers/route.ts:53-71`
**Evidence:**
```ts
const { listingId, amountGBP, agentId, aipDocumentId } = body as { ... };
if (!listingId || typeof listingId !== "string") { ... }
if (amountGBP === undefined || typeof amountGBP !== "number" || amountGBP <= 0) { ... }
```
**Impact:** Validation is inconsistent across the rest of the API (most other routes use Zod). `listingId` and `agentId` are not validated as UUIDs — a non-UUID string reaches the service layer and may surface a 500 with a leaky Postgres error message. The amount-cap at line 75 (`AIP_THRESHOLD_GBP = 250000`) is a business gate, not a security gate; there is no maximum-amount validation, so a user can submit a £999,999,999 offer.
**Remediation:** Convert to a Zod schema:
```ts
const offerSchema = z.object({
  listingId: z.string().uuid(),
  amountGBP: z.number().int().positive().max(50_000_000),
  agentId: z.string().uuid(),
  aipDocumentId: z.string().uuid().optional(),
});
```
**Effort:** Trivial.

#### BRIT-S008 — `/api/push/send` gated only by a single static bearer token
**Files:** `src/app/api/push/send/route.ts:16-23`
**Evidence:**
```ts
const pushSecret = process.env.PUSH_SECRET;
const authHeader = request.headers.get("authorization");
if (!authHeader || authHeader !== `Bearer ${pushSecret}`) { 403 }
```
**Impact:** Anyone holding `PUSH_SECRET` (a single, long-lived string) can dispatch arbitrary titled/bodied push notifications to any user by `userId` (UUID is the only addressing). If leaked once — Sentry trace, CI log, error message — every Britestate subscriber's device can be spammed indefinitely until rotation. There's also no per-user rate limit on the dispatch endpoint and no signature over the payload, so the secret is both the authn and authz primitive.
**Exploit scenario:** Static secret leaks via accidental log line → attacker sends "Your Britestate offer was accepted — confirm here: bit.ly/…" to all subscribers.
**Remediation:** (a) Require the call to be Inngest-signed (HMAC over the payload + timestamp + userId) instead of a static bearer, and dispatch only via Inngest jobs; (b) add Upstash rate limiting keyed on `userId`; (c) add a server-side allow-list of notification "types" rather than free-text title/body; (d) document a rotation procedure for `PUSH_SECRET`.
**Effort:** Small — wire the HMAC via the existing Inngest client and the `payload + timestamp` pattern already used for unsubscribe tokens (`src/lib/auth/reauth-token.ts` is the closest pattern).

#### BRIT-S009 — `activity_log` partitions hard-coded, end Feb 2027
**Files:** `supabase/migrations/` (partition CREATE statements; not pg_partman-managed)
**Evidence:** No `pg_partman` or `pg_cron`-driven partition creation present; partitions are declared inline through Feb 2027.
**Impact:** Silent insert failures (or growth into the default partition with degraded performance) once the calendar passes Feb 2027 — a year out, but a launch-day decision to defer this guarantees an outage in 8 months unless a calendar reminder is set.
**Remediation:** Install `pg_partman` extension, register `activity_log` with `partman.create_parent`, set a `pg_cron` job to auto-create the next 12 months. Alternatively, schedule an Inngest cron that runs the partition `CREATE` ahead of time.
**Effort:** Small.

#### BRIT-S010 — `/api/inngest` signing key not asserted at runtime
**Files:** `src/app/api/inngest/route.ts`, `src/inngest/client.ts`
**Evidence:** The Inngest `serve()` handler enforces signature verification when `INNGEST_SIGNING_KEY` is set in env, but there is no startup-time assertion that the key is present in production. If the env var is missing in the hosting platform, Inngest's behaviour depends on its mode (cloud vs dev) — in dev mode no signature is required.
**Impact:** A misconfigured production deployment could expose the Inngest endpoint without signature checks, letting an attacker invoke any registered function with arbitrary payloads. Functions include billing operations, push dispatch, and email send — high blast radius.
**Remediation:** Add `INNGEST_SIGNING_KEY` to the required `server` block in `src/env.ts` (`@t3-oss/env-nextjs`) so the app fails to boot without it. Verify in CI that `pnpm build` against an empty env throws the schema error.
**Effort:** Trivial.

---

### LOW

#### BRIT-S011 — `/api/reviews/list` accepts unbounded `limit`/`offset` and unvalidated `provider_id`
**Files:** `src/app/api/reviews/list/route.ts:12-29`
**Evidence:** `provider_id` is required but not validated as UUID; `limit`/`offset` are coerced via `Number(...)` with no bounds.
**Impact:** A caller can request `?limit=1000000` and force the database to do unbounded work, or pass `provider_id=NaN`/non-UUID and surface a Postgres error in the 500 response message. Read-only, no auth bypass, but a soft-DoS surface and a small info leak.
**Remediation:** Zod schema with `z.string().uuid()` for `provider_id`, `z.number().int().min(1).max(100)` for `limit`, `z.number().int().min(0).max(10_000)` for `offset`.
**Effort:** Trivial.

#### BRIT-S012 — Admin permission map hardcoded (no audit trail on changes)
**Files:** `src/lib/admin-permissions.ts` (ADMIN_ROUTE_PERMISSIONS map)
**Impact:** Granting or revoking an admin permission requires a code change + deploy. There is no audit log of *who* changed the map and when, only of admin actions taken with it (`admin_audit_log`). For early users this is fine; before broader launch it should move to a DB-backed permission table with its own audit log.
**Remediation:** Tracked in the existing `architecture_remediation_plan.md`; defer past early-user launch.
**Effort:** Medium; defer.

#### BRIT-S013 — Subscription gate fails open on DB error
**Files:** `src/middleware.ts` (subscription-gate block)
**Impact:** If the subscription lookup throws, the user is allowed through. This is intentional per code comments — the alternative would lock everyone out on a transient DB blip. Documenting as INFO rather than HIGH because the worst-case outcome (gated feature briefly accessible) is a billing/UX issue, not a data-exposure issue. *Confirm this assumption: if any subscription-gated route can read or write data that a non-subscriber should not see, downgrade to MEDIUM.*
**Remediation:** Add explicit Sentry capture inside the fail-open branch so the team is alerted when it fires. Optionally circuit-break: if the same user trips fail-open more than N times in M minutes, hard-deny.
**Effort:** Small.

#### BRIT-S014 — Supabase storage bucket policies not in migrations
**Files:** `supabase/migrations/` (no storage policies found)
**Impact:** Storage buckets (`avatars`, `landlord-documents`, and any others) may be policy-configured via the Supabase dashboard rather than as code. Code review can't confirm:
- Are `landlord-documents` and other private buckets actually private?
- Are signed URLs the only access path?
- Do upload policies validate `user_id` ownership of the path?
The code-side handling looks correct (`src/app/api/landlord/compliance/upload/route.ts` does path-traversal checks, ownership verification, and 1-hour signed URLs), but the bucket policy itself is the last line of defence.
**Remediation:** Verify in the Supabase console (Storage → Policies) for each bucket; export the policies into a migration file so they are version-controlled.
**Effort:** Small (manual verification + paste into a migration).

---

### INFO (acknowledged, no action required)

#### BRIT-S015 — Live schema bug: `viewing_slots.starts_at does not exist`
**Files:** Migration drift — column missing relative to the code at `src/app/api/properties/[id]/viewing-slots/route.ts`
**Impact:** Not a security issue, but currently 500s on every property page's viewing-slot widget. Listed here because it surfaced in the dev-server logs during this audit and would degrade the early-user experience.

#### BRIT-S016 — Live React hydration mismatch in `MortgageCalculator.tsx:297`
**Files:** `src/components/calculators/MortgageCalculator.tsx:297`
**Impact:** Not security; UX. Listed for the same reason.

#### BRIT-S017 — Next.js deprecates `middleware` filename
**Files:** `src/middleware.ts`
**Impact:** Next.js 16.2 warned at boot: *"The 'middleware' file convention is deprecated. Please use 'proxy' instead."* — Plan a follow-up rename. No security impact today.

---

## 4. Verified-Secure Areas

These areas were specifically inspected and pass:

| Area | Why it passes | Evidence |
|---|---|---|
| **Stripe webhook signature verification** | Uses `stripe.webhooks.constructEvent` against raw body before any processing. Idempotency table guards replays via `INSERT … ON CONFLICT (stripe_event_id)`. Prices are server-side from `PLANS_BY_ROLE`, not client input. | `src/app/api/webhooks/stripe/route.ts`, `src/lib/billing-config.ts`, `supabase/migrations/20260516000000_phase_a_billing_and_offer_safety.sql` |
| **Admin RBAC fail-closed** | `is_admin = true` AND `admin_role IS NOT NULL` required; permission-checked per route; every action audited with IP + outcome. | `src/lib/audited-admin-action.ts`, `src/lib/admin-guard.ts`, `src/middleware.ts:321-340` |
| **Nonce-based CSP** | Per-request base64 nonce on script-src, no `'unsafe-inline'` on scripts (only on styles, which is unavoidable for Tailwind v4). `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. | `src/middleware.ts:29-44` |
| **XSS via `dangerouslySetInnerHTML`** | All ~20 occurrences are SEO JSON-LD scripts wrapped in `safeJsonLd()` which escapes `<` to `<`. No user-content rendering via `dangerouslySetInnerHTML` found. | `src/lib/seo/safe-json-ld.ts`, layouts and detail pages |
| **DOMPurify sanitisers** | Used through wrapper functions with explicit allow-lists (b, i, a, p, br, ul, ol, li) — not deny-lists. *Caveat: dependency itself has 4 open advisories (BRIT-S002).* | `src/lib/validation/sanitize.ts` |
| **No hardcoded secrets in source** | Repo-wide grep for `sk_live_`, `sk_test_`, `sk-ant-`, `re_`, `BEGIN ... PRIVATE KEY` returned zero matches. Scripts reference `process.env.STRIPE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` only. | `scripts/stripe-setup/*.ts:184`, `scripts/backfill-coordinates.ts:53` |
| **`.env*` files gitignored** | `.env*` plus `!.env.example` in `.gitignore`. Repo has its own `.git` (4 `.env*` files present locally are not tracked). | `britv3/.gitignore` |
| **t3-env typed schema** | Server vs client secrets categorised; required keys cause boot-time failure if missing. | `src/env.ts` |
| **AI input sanitisation + spend caps** | `sanitizeAiInput()` strips control chars, 10K-char cap. Global 100/min + per-user 10/hr + daily $-cap. Outputs validated against Zod when JSON-shaped. | `src/services/ai/claude-service.ts` |
| **File-upload validation server-side** | Magic-byte check (`FF D8 FF`, `89 50 4E 47`) + size cap + extension allow-list. Private bucket uses signed URLs (1-hour TTL). Path-traversal rejected. | `src/app/api/settings/profile/avatar/route.ts`, `src/app/api/landlord/compliance/upload/route.ts` |
| **SQL via parameterised RPCs only** | 8 `.rpc()` calls, no string interpolation. `sanitizePostgrestInput()` strips PostgREST/ILIKE metacharacters. | `src/lib/validation/sanitize.ts` and call sites |
| **CORS not loosened** | No `Access-Control-Allow-Origin` set anywhere in the app. Default Next.js same-origin posture. | repo-wide grep returned no matches |
| **Webhook auth (Stripe / Inngest / Supabase OAuth)** | Each verifies the caller via signature or built-in mechanism before any work. | `src/app/api/webhooks/stripe/route.ts:73`, `src/app/api/inngest/route.ts`, `src/app/auth/callback/route.ts:26` |
| **Service role key isolation** | Used only in `src/lib/supabase/admin.ts`, the Stripe webhook handler, the HMAC-validated unsubscribe handler, the reauth-token service, and admin-only batch services. No reachable path from a public route. | grep audit of `SUPABASE_SERVICE_ROLE_KEY` / `createAdminClient` |

---

## 5. OWASP Top 10 (2021) Mapping

| OWASP Category | Status | Notes |
|---|---|---|
| **A01: Broken Access Control** | ⚠ Partial | Per-route checks and RBAC are strong; **BRIT-S001 (cascade delete)** is the headline gap. |
| **A02: Cryptographic Failures** | ⚠ Partial | HMAC tokens use proper secrets via env; **BRIT-S003 (no HSTS)** leaves first-visit traffic exposed to TLS stripping. |
| **A03: Injection** | ✅ OK | Parameterised RPCs only, sanitisers in place, no `eval`/`Function`. |
| **A04: Insecure Design** | ⚠ Partial | **BRIT-S008 (push static bearer)** is a single-secret design that should be HMAC-per-payload. **BRIT-S001 (cascade chain)** is also a design fault. |
| **A05: Security Misconfiguration** | ⚠ Partial | **BRIT-S005 (Sentry PII)**, **BRIT-S010 (Inngest signing key not asserted)**, **BRIT-S014 (storage policies not in migrations)**. |
| **A06: Vulnerable Components** | ❌ **BLOCK** | **BRIT-S002 — 108 advisories incl. 2 critical / 37 high incl. multiple Next.js middleware-bypass CVEs.** |
| **A07: Identification & Authentication Failures** | ✅ OK | Supabase Auth + MFA enforcement in middleware; sessions via `getUser()` not `getSession()`. |
| **A08: Software & Data Integrity Failures** | ✅ OK | Stripe + Inngest webhooks signature-verified; idempotency tables in place. |
| **A09: Logging & Monitoring** | ⚠ Partial | `admin_audit_log` strong; **BRIT-S005** Sentry config thin; **BRIT-S013** (subscription fail-open) not alerted. |
| **A10: SSRF** | ⚠ Unknown | `/api/geocode` proxies external requests — not fully exercised in this audit, recommended for pen-test. |

---

## 6. Cross-Check Against Existing `architecture_audit.md`

Status of each prior P0/P1 finding as of this review:

| Prior finding | Then | Now |
|---|---|---|
| RLS gap on `agent_leads` / `agent_offers` | P0 | ✅ Fixed — policies use `auth.uid()` correctly |
| Stripe webhook idempotency | P0 | ✅ Fixed — `ON CONFLICT (stripe_event_id)` present in `20260516000000_phase_a_billing_and_offer_safety.sql` |
| Sentry wiring | P0 | ⚠ Partial — initialised, **PII scrubbing missing (BRIT-S005)** |
| `ON DELETE CASCADE` on profiles | P0 | ❌ **Still present (BRIT-S001)** |
| JWT-authoritative middleware gate | P1 | ⚠ In progress — feature-flagged dual-path, JWT fast path + DB fallback |
| `activity_log` partition maintenance | P2 | ❌ **Still inline through Feb 2027 (BRIT-S009)** |
| `ADMIN_ROUTE_PERMISSIONS` hardcoded | P2 | ⚠ Acknowledged — defer past early-user launch (BRIT-S012) |

---

## 7. Dependency Audit Summary

**Snapshot (`pnpm audit`, 2026-06-16):**

```
108 vulnerabilities found
Severity: 8 low | 61 moderate | 37 high | 2 critical
```

**Critical (2):**
1. Arbitrary code execution in `protobufjs` (transitive via `@grpc/grpc-js` instrumentation)
2. Vitest UI server arbitrary file read/execute when listening (dev-only but in lockfile)

**High (37) — selected:** Next.js middleware/proxy bypass × 5+, Next.js SSRF, Next.js DoS via Server Components, Next.js DoS via connection, Vite `server.fs.deny` bypass, Vite arbitrary file read, Vite Windows alternate stream bypass, Undici WebSocket overflows, Undici memory exhaustion, path-to-regexp ReDoS, picomatch ReDoS × 2, lodash `_.template` code injection, fast-uri path traversal + host confusion, ws memory exhaustion, Happy DOM unsanitized export, protobuf.js code injection + denial of service, esbuild missing binary integrity check, @grpc/grpc-js malformed request crashes.

**Top remediation paths (in order):**
1. `pnpm update next` → eliminates the Next.js highs and lowers the framework-bypass risk to zero
2. `pnpm.overrides` in `package.json` for: `protobufjs`, `undici`, `lodash`, `dompurify` (→3.4.9+), `vite`, `path-to-regexp`, `picomatch`, `ws`, `fast-uri`, `happy-dom`
3. Re-run `pnpm audit` and target zero critical + zero high before launch.
4. Re-run the test suites (`pnpm test`, `pnpm test:e2e`) and the build (`pnpm build`) after the bumps.

---

## 8. Pre-Launch Punch List (priority order)

**Before inviting any early user:**
- [ ] **BRIT-S002** — Patch all 2 criticals + 37 highs. Re-run `pnpm audit` to confirm clean. Re-run tests + build.
- [ ] **BRIT-S001** — Migrate marketplace FKs from `ON DELETE CASCADE` to `ON DELETE RESTRICT` rooted at `profiles(id)`. Ship the audited GDPR purge function alongside.
- [ ] **BRIT-S003** — Add HSTS header (one line).
- [ ] **BRIT-S004** — Replace OAuth callback `next` prefix check with an allow-list regex.
- [ ] **BRIT-S005** — Add `sendDefaultPii: false` + replay masking + `beforeSend` cookie/auth scrubber to all three Sentry configs.
- [ ] **BRIT-S010** — Mark `INNGEST_SIGNING_KEY` required in the `server` block of `src/env.ts`.

**Before broader launch (1–2 week follow-up):**
- [ ] **BRIT-S006 / BRIT-S007 / BRIT-S011** — Add Zod schemas to `seller/listings` POST, `offers` POST, `reviews/list` GET.
- [ ] **BRIT-S008** — Replace static `PUSH_SECRET` bearer with HMAC-per-payload and route through Inngest. Add user-keyed rate limiting + notification-type allow-list.
- [ ] **BRIT-S009** — Install `pg_partman` (or scheduled Inngest job) to auto-create `activity_log` partitions.
- [ ] **BRIT-S014** — Verify Supabase storage bucket policies in the console; mirror them into a migration file.
- [ ] **BRIT-S013** — Add Sentry capture inside the subscription fail-open branch.
- [ ] **BRIT-S015 / BRIT-S016** — Fix the `viewing_slots.starts_at` schema drift and the MortgageCalculator hydration mismatch (not security, but customer-facing).
- [ ] **BRIT-S017** — Rename `middleware.ts` → `proxy.ts` per Next.js 16.2 deprecation.

**Quarterly going forward:**
- [ ] Re-run `pnpm audit` and budget time to land patches within 7 days of disclosure.
- [ ] Review Sentry ingestion to confirm PII scrubbers are still effective as the codebase evolves.
- [ ] Audit any new admin route that wraps `auditedAdminAction` — confirm the correct permission key.
- [ ] Verify HSTS preload status if/when applied.

---

## 9. Manual Verification Required (Outside Codebase)

Items that *cannot* be confirmed by source review alone and must be checked by an operator with console access before launch:

1. **Supabase Storage policies** — Open each bucket in Supabase Studio → Storage → Policies. Confirm `landlord-documents` is private (no `SELECT` policy for anon), `avatars` is public-read but write-restricted, and any other buckets follow least-privilege. Export the policies to a migration file.
2. **Supabase RLS spot-check in Studio** — For each table referenced in `002_marketplace.sql`, `003_property_portal.sql`, and `010_admin.sql`, confirm RLS is enabled in the dashboard (the migration text and the runtime state can drift). Use `scripts/audit/rls-policy-audit.ts` if it has been kept current.
3. **Production env values** — In Vercel (or wherever the app is hosted), confirm presence of: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `INNGEST_SIGNING_KEY`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `PUSH_SECRET`, `REAUTH_HMAC_SECRET`, `QUOTE_SIGNING_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client). Confirm none are committed to the lockfile.
4. **Stripe dashboard** — Confirm the webhook secret in the dashboard matches `STRIPE_WEBHOOK_SECRET` in production env. Confirm the registered endpoint is HTTPS.
5. **Domain TLS / HSTS** — After deploying BRIT-S003, verify the header lands in production with `curl -I https://britestate.co.uk`. Plan HSTS preload submission 30 days post-deploy.
6. **JWT custom-claims trigger in Supabase Auth** — The middleware fast path expects `app_metadata.role / plan / is_admin` to be on the JWT. Confirm the Auth trigger that populates these claims fires on signup and on subscription state changes.
7. **Sentry project settings** — After applying BRIT-S005 in code, confirm in the Sentry project that PII inbound filters and IP scrubbing are set as defence-in-depth.
8. **CSP report-only on a real domain** — Deploy a `Content-Security-Policy-Report-Only` variant first against the staging domain to catch any inline-style or third-party script regressions before turning the enforcing CSP loose on early users.

---

*End of report. Generated 2026-06-16. Cross-reference with `architecture_audit.md` and `architecture_remediation_plan.md` for engineering history.*

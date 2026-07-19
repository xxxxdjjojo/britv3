# Vouch Gate + Referral Engine — Phase 0 Audit

## Gate 0 status

Audit date: 2026-07-16

Canonical baseline: origin/main at 33daa9e0161a222965d9b2a0acfc9a7e594be1bb

Audit branch: codex/vouch-referral-audit

Scope: read-only source, migration, local-database, test-collection, and deployment-configuration audit

This report is the only tracked change in Phase 0. No failing tracer, migration, feature code, deployment, or screenshot was created. Implementation must stop at Gate 0 until this report is reviewed.

### Required Gate 0 answers

1. **Current page gate:** src/proxy.ts, lines 354–520. It is incomplete and internally inconsistent.
2. **Permanent enforcement locations:** one pure provider-access policy consumed by src/proxy.ts, src/app/(protected)/dashboard/provider/layout.tsx, a new shared provider API guard used by every protected provider business handler, and src/services/provider/provider-transaction-gate.ts. None may invent a second definition of gate completion.
3. **Canonical identity references:** auth.users.id → profiles.id → service_provider_details.user_id. Vouch subjects and authenticated peer vouchers must reference profiles.id. Existing provider_references remains read-only legacy evidence and must not be converted into trusted vouches.
4. **Existing tables that additive migrations must reference or preserve:** auth.users, profiles, user_roles, service_provider_details, provider_documents, provider_verifications, provider_references, verification_vouch_rules, subscriptions, stripe_connect_accounts, referrals, referral_codes_v2, referral_rewards, legacy referral_codes, referral_conversions and provider_referrals, billing_events, and provider_badges.
5. **New canonical tables required:** vouch_requests, vouches, referral_credits, and fraud_flags; service_provider_details also needs vouch_gate_grandfathered_at.
6. **Deployment prerequisite:** repository configuration does not prove an isolated Supabase preview branch or Vercel preview project. Implementation must not apply a migration to a remote database until those resources and their separation from production are independently confirmed.

## Executive findings

The approved remediation direction is sound, but two issue-ledger statements are stale on current origin/main and must not be reintroduced:

- The canonical proxy comparison is already provider_verification_status === "verified" at src/proxy.ts:425–426.
- July migration 20260712100002_vouching_provider_references_columns_rls.sql already drops authenticated insert, update, and delete policies for provider_references and retains read-only ownership plus admin review. The older base migration was forgeable, but current migration order closes that hole.

The following defects are confirmed:

- JWT role claims bypass the verification query and verification gate. src/proxy.ts queries provider verification only when dashboard claims are absent (lines 285–321), then executes the verification gate only when !hasClaims (lines 399–436).
- Provider access is split across proxy exemptions, provider layout role checks, individual APIs, and the transaction guard. The provider layout checks authentication, active_role, provider identity, and Stripe Connect display data, but not verification, subscription, or vouch state.
- All API routes bypass proxy auth and gate policy. Of 27 /api/provider handlers, only invoice create, invoice send, and quote send call checkProviderCanTransact; none can check canonical vouch state because it does not exist.
- Current no-claims policy deliberately opens jobs, quotes, reviews, payments, and boost before verification and subscription. Verification pages are verification-exempt but subscription-gated, so an incomplete unsubscribed provider is redirected away from the very flow needed to progress.
- The referral cookie is attached to an initial response, but Supabase session refresh replaces that response and redirects create another fresh response. The cookie can be lost.
- Referral attribution is invoked immediately after signUp, before a confirmed session normally exists. The component ignores unsuccessful HTTP statuses.
- Even with a session, attribution uses a caller-scoped Supabase client. RLS prevents reading another member’s referral code and prevents inserting a row whose referrer_id differs from auth.uid(). The service ignores insert errors; the API reports success and deletes the cookie.
- Generated referral URLs point at /join, which does not exist. /vouch/[token] and /vouched/[slug] also do not exist. Only the legacy /reference/[token] flow exists.
- Legacy peer-reference acceptance is token-based and does not require peer login, provider role, seven-day account age, active/not-suspended state, completed/grandfathered gate, verified invited email, or reciprocal detection.
- Referral conversion and two-party rewards run from checkout.session.completed. The first paid invoice path does not perform referral conversion.
- Existing credit application has stable Stripe idempotency keys and a reward uniqueness index, but no one-referrer-only contract, rolling cap, per-member lock, durable applying state, balance transaction reference, attempt history, or retry worker. Errors are marked failed and swallowed inside an already-processed webhook.
- Provider subscriptions use Stripe. GoCardless is confined to the separate TrueDeed estate-agent/organisation success-fee invoice rail and must not be introduced into provider subscription credits.
- Provider verification services use columns that do not match the schema: provider_documents is defined with user_id, verification_status, file_name, file_url, file_size, mime_type, and reviewer_notes, while current provider verification paths query or write provider_id, status, rejection_reason, and storage_path. Generated database types are incomplete and helped hide this drift.
- Relevant tests and database contracts are outside normal gates; feature link tests, Lighthouse, and the claimed production smoke are not enforcing the stated contract.
- Production and preview backfill counts cannot be verified from this repository or the available stale local database.

## Assumptions and contradictions

- The product term “tradesperson” maps to active_role = service_provider and URL role segment provider.
- The user-approved plan supersedes the original prompt where they conflict: provider subscription conversion is Stripe invoice-paid, client token acceptance may be immediate after invited-email OTP, established peer eligibility is seven-day age plus 3+3 or grandfathering, and only the referrer earns one month.
- The existing July provider_references hardening is retained as legacy history. It is not proof of a trusted vouch because legacy rows lack a reliably authenticated voucher identity and the new fraud checks.
- Exact target-database grandfather and historical-migration counts remain a pre-migration prerequisite. “I cannot confirm this” applies to production and preview counts because no connected target database or preview environment is proven.
- The local database is not authoritative: its migration head is 20260618160000, behind the repository’s July migrations. It contains 2 verified provider profiles, 2 service_provider_details rows, 0 provider_references, 0 referrals, 0 referral_rewards, and 6 subscriptions. These are non-authoritative local developer-database counts from a possibly stale or partially reset database, not production, preview, or guaranteed seed counts.
- The tracked seed declares 3 legacy references (2 client, 1 peer; 2 verified). Under current vouch-count rules, the verified peer counts but client rows without work_date do not. This is fixture evidence, not a migration/backfill count.

## Route and rendering audit

### Inventory summary

- 387 page entrypoints.
- 25 layouts.
- 286 route-handler entrypoints: 284 route.ts and 2 route.tsx.
- Route groups: (protected) 185 pages, (main) 138, (admin) 38, (auth) 15, (splash) 2, and 9 page entrypoints outside those groups.
- 71 page entrypoints are client components and 316 are server components.
- 26 pages explicitly force dynamic rendering; one explicitly forces static rendering; 13 pages use revalidate and/or generateStaticParams.
- No parallel-route directory or intercepting-route directory exists.
- No Pages Router application remnant exists. The only tracked directory named pages is src/__tests__/pages, and it contains tests rather than a Pages Router application.

The appendix lists every page and handler URL, its entrypoint boundary, source-derived delivery mode, route groups, and complete layout chain. “use client” identifies the React component boundary; it does not by itself prove client-side-only rendering. “Static candidate” and “dynamic path (automatic)” are source classifications, not build-manifest claims. Phase 0 did not install dependencies or run a production build, so automatic Next.js prerender outcomes remain build-unverified. That uncertainty must be closed by the later production build gate.

The two route.tsx handlers, /api/emails/preview/[template] and /api/og/[kind], are included and should receive build verification because route.ts is the conventional App Router filename.

## Auth, role, and access enforcement

### Session reads and layout boundaries

- src/proxy.ts calls Supabase auth.getUser for matched requests and protects non-public, non-auth pages. Unauthenticated /api requests explicitly pass through for handler-level enforcement.
- src/app/(protected)/layout.tsx reads auth.getUser and redirects to /login. All 185 protected pages inherit this runtime authentication read.
- src/app/(admin)/layout.tsx reads auth and a database-backed admin profile; all admin pages inherit it. src/proxy.ts separately enforces admin role permissions.
- src/app/(protected)/dashboard/provider/layout.tsx reads auth, database active_role, provider identity, and Stripe Connect state. It does not enforce admin verification, vouch state, or subscription state.
- src/app/(protected)/dashboard/[role]/layout.tsx independently performs a database role check. Shared provider URLs in that subtree do not inherit the provider-specific layout.
- Route handlers read sessions independently. There is no shared provider API authorization policy.

### Proxy behavior

Matcher: all paths except Next static/image assets, favicon, sitemap, robots, opengraph-image, map JSON, and common static image/manifest extensions (src/proxy.ts:528–541).

Response mutation:

- Adds a per-request CSP nonce, Content-Security-Policy, x-nonce, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy, and a correlation ID.
- Supports maintenance redirect, Supabase session-cookie refresh, MFA enforcement, auth redirects, admin permission redirects, role-dashboard redirects, verification redirects, and subscription redirects.
- When Supabase environment variables are absent, auth checks are skipped entirely.
- Non-admin MFA lookup failure fails open; admin fails closed.
- Subscription database lookup failure also fails open.
- redirectTo contains pathname only, so query-bearing token/deep links lose their query.
- /auth/callback is absent from PUBLIC_ROUTES and AUTH_ROUTES. Source control flow therefore risks redirecting an unauthenticated PKCE callback to /login before the handler exchanges its code. This requires browser confirmation in the first auth tracer.

### Exact incomplete-provider page reachability

The application has 55 unique /dashboard/provider page URL patterns: provider-specific pages plus shared /dashboard/[role] pages. The count is generated after expanding the shared role segment to provider and de-duplicating overlapping overview, billing, referrals, documents, and services URLs.

Always reachable before admin verification and without an active subscription (24):

- /dashboard/provider
- /dashboard/provider/billing
- /dashboard/provider/billing/checkout/one-time
- /dashboard/provider/billing/checkout/subscription
- /dashboard/provider/billing/confirmation
- /dashboard/provider/billing/failed
- /dashboard/provider/billing/invoices
- /dashboard/provider/billing/payment-methods
- /dashboard/provider/billing/refund
- /dashboard/provider/billing/subscription
- /dashboard/provider/referrals
- /dashboard/provider/boost
- /dashboard/provider/payments
- /dashboard/provider/payments/[id]
- /dashboard/provider/quotes
- /dashboard/provider/quotes/builder
- /dashboard/provider/quotes/[id]/invoice
- /dashboard/provider/jobs/[id]
- /dashboard/provider/jobs/[id]/certificates
- /dashboard/provider/jobs/active
- /dashboard/provider/jobs/completed
- /dashboard/provider/jobs/leads
- /dashboard/provider/reviews
- /dashboard/provider/reviews/[id]/respond

Verification-exempt but subscription-dependent without JWT claims (5):

- /dashboard/provider/verification
- /dashboard/provider/verification/badges
- /dashboard/provider/verification/client-references
- /dashboard/provider/verification/credentials
- /dashboard/provider/verification/peer-references

Verification-redirected without JWT claims when incomplete (26):

- /dashboard/provider/analytics
- /dashboard/provider/availability
- /dashboard/provider/documents
- /dashboard/provider/field
- /dashboard/provider/field/jobs
- /dashboard/provider/field/payments
- /dashboard/provider/portfolio
- /dashboard/provider/profile
- /dashboard/provider/services
- /dashboard/provider/services/areas
- /dashboard/provider/ai-match
- /dashboard/provider/applications
- /dashboard/provider/applications/apply/[listingId]
- /dashboard/provider/calculators
- /dashboard/provider/listings
- /dashboard/provider/listings/new
- /dashboard/provider/listings/[id]
- /dashboard/provider/listings/[id]/analytics
- /dashboard/provider/moving
- /dashboard/provider/offers
- /dashboard/provider/saved
- /dashboard/provider/searches
- /dashboard/provider/tenancy
- /dashboard/provider/viewings
- /dashboard/provider/viewings/book
- /dashboard/provider/viewings/[id]/reschedule
JWT consequences:

- hasClaims requires only a nonempty app_metadata.role.
- With empty plan, the same 24 open URLs render and all remaining URLs redirect to billing.
- With any nonempty plan, all 55 URLs render regardless of database provider_verification_status because the verification query and check are skipped.
- Prefix matching makes any future descendant of an open prefix open unless the policy is redesigned around explicit route decisions.

### Exact provider API surface requiring the shared gate

Every protected business method below must call the shared provider API guard. Read-only methods may be deliberately classified by the canonical policy, but they must not silently escape it.

| Handler | Methods | Existing transaction guard |
|---|---|---|
| /api/provider/availability | GET, POST | no |
| /api/provider/boost | GET, POST | no; boost has only action-specific eligibility |
| /api/provider/certificates | POST | no |
| /api/provider/invoices | POST | yes |
| /api/provider/invoices/[id]/paid | PATCH | no |
| /api/provider/invoices/[id]/pdf | GET | no |
| /api/provider/invoices/[id]/send | POST | yes |
| /api/provider/jobs/[id]/status | PATCH | no |
| /api/provider/payments/onsite | POST | no |
| /api/provider/payments/onsite/confirm | POST | no |
| /api/provider/placements | GET, POST | no |
| /api/provider/placements/[id] | PATCH | no |
| /api/provider/portfolio | GET, POST | no |
| /api/provider/portfolio/[id] | PATCH, DELETE | no |
| /api/provider/portfolio/reorder | PATCH | no |
| /api/provider/quotes | GET, POST | no |
| /api/provider/quotes/suggest-items | POST | no |
| /api/provider/quotes/[id]/accept | POST | no |
| /api/provider/quotes/[id]/pdf | GET | no |
| /api/provider/quotes/[id]/send | POST | yes |
| /api/provider/references | POST | no; legacy vouch flow must be replaced/frozen |
| /api/provider/references/[id]/cancel | POST | no; legacy vouch flow |
| /api/provider/references/[id]/resend | POST | no; legacy vouch flow |
| /api/provider/reviews/[id]/respond | POST | no |
| /api/provider/service-areas | GET, POST, DELETE | no |
| /api/provider/services | GET, POST | no |
| /api/provider/services/[id] | PATCH, DELETE | no |

Other provider-affecting handlers outside /api/provider—Stripe Connect, marketplace review, service-provider profile, bookings, maintenance assignment, and quote AI—must be classified against the same policy during the API tracer. The route namespace alone is not a sufficient authorization boundary.

## Supabase surface

### Identity, role, provider, and billing

- profiles.id references auth.users.id. profiles.active_role is the active product role and profiles.provider_verification_status is the canonical admin-verification enum.
- user_roles stores assigned roles; proxy currently relies on active_role or JWT app_metadata.role.
- service_provider_details.user_id is both provider identity and a foreign key to profiles.id. There is no canonical service_provider_details.id.
- subscriptions is a service-written cache of Stripe state keyed by user_id, with Stripe customer/subscription identifiers and status. Users read their own row.
- stripe_connect_accounts stores charges_enabled and payouts_enabled for provider transaction readiness.
- GoCardless mandate state exists in the separate estate-agent/organisation flow, not provider subscriptions.

### Current partial vouch/reference system

Current origin/main contains no vouch_requests, vouches, referral_credits, fraud_flags, vouch_gate_grandfathered_at, vouch_gate_status, or canonical transactional acceptance/credit RPC.

The July legacy-table flow adds token hashes, expiry/send metadata, client work date, rating, decline/revoke/review fields, unique active invitations, read-only provider RLS, admin review RLS, and 3+3 configuration. Its remaining weaknesses are structural:

- accepted evidence still has no authenticated voucher_id;
- peer submission does not enforce authenticated provider eligibility;
- count and state transitions are application-side, not locked atomic functions;
- no reciprocal-vouch fraud ledger exists;
- no grandfathering exists;
- no token-bound email OTP acceptance contract exists;
- client work-date recency and admin review are not the requested immediate signup-lite acceptance semantics;
- prevent_provider_reference_identity_change has no fixed search_path or explicit EXECUTE revocation;
- explicit table grants/revokes are absent from the July migration.

### Verification schema drift

Actual provider_documents columns are user_id, document_type, file_name, file_url, file_size, mime_type, verification_status, expiry_date, reviewer_notes, reviewed_by, reviewed_at, created_at, and updated_at.

Confirmed incorrect consumers include:

- src/services/provider/provider-verification-service.ts
- src/services/provider/provider-dashboard-service.ts
- src/app/(protected)/dashboard/provider/verification/credentials/page.tsx

The correct column pattern is already demonstrated in src/services/marketplace/provider-service.ts. src/types/database.types.ts includes provider_documents but omits provider_references, provider_services, provider_badges, provider_invoices, provider_referrals, and verification_vouch_rules. Types must be regenerated after migrations; hand-written casts must not substitute for schema verification.

### Referral and credit state

Current referrals supports only pending → rewarded. referral_codes_v2 is one code per user. referral_rewards supports earned/applied/failed/voided for arbitrary recipients; current Checkout application code creates rewards for both referrer and referee. The system lacks per-invite tokens, the five requested provider states, atomic forward transitions, one-referrer credit ownership, rolling cap, and durable Stripe application state.

Existing RLS and caller behavior are incompatible with attribution:

1. The referred member’s session cannot read the referrer’s referral_codes_v2 row.
2. The referred member cannot insert referrals with referrer_id belonging to someone else.
3. Conversely, any authenticated referrer can insert a row with its own referrer_id and an arbitrary referred_id. Because referred_id is globally unique, this allows attribution squatting that can pre-empt the legitimate referrer.
4. The service ignores the normal attribution insertion error.
5. The route returns attributed=true and deletes the cookie.

advanceReferralStatus claims row locking in comments but performs an unlocked read and update, ignores update errors, and recalculates tier/cache separately.

Legacy provider_referrals remains caller-writable: the owner policy permits referrers to insert and update their own rows without column restrictions, including status, rewarded_at, and referred_user_id. This is a forgeable legacy reward/status surface. Writes must be revoked immediately if consumer audit proves it unused; otherwise the compatibility transition must move all mutation behind a verified service-only function before the legacy grants are removed.

### Required migration safety decisions

- Add only additive canonical tables and columns.
- Backfill vouch_gate_grandfathered_at only for providers verified in the actual target database at migration time.
- Do not convert provider_references rows into vouches.
- Preserve legacy referral statuses and non-provider tracks while adding provider invite tokens/states.
- Audit live consumers of provider_referrals, move any required mutation behind a verified service-only transition, and revoke caller writes; do not leave the current forgeable status/reward fields writable.
- Use explicit grants plus RLS.
- Service-only SECURITY DEFINER functions require fixed search_path and EXECUTE revoked from PUBLIC, anon, and authenticated.
- Lock vouch transitions, referral advancement, and per-member credit issuance in PostgreSQL.
- Count pending, applying, applied, and failed non-void credits toward the rolling cap.
- Regenerate database types and run migration checks plus database advisors.

## Test collection, CI, performance, and deployment

### Collection gaps

- Default Vitest collects only src/**/*.test.{ts,tsx}.
- Real-Postgres Vitest separately collects db-tests/**/*.test.ts. Sixteen DB files exist, but no PR workflow invokes pnpm test:db.
- Playwright collects only ./e2e.
- tests/e2e/referral-system.spec.ts and tests/security/rls-audit.test.ts are therefore uncollected.
- Two repo-local Bun tests under test/gstack are also outside these roots. They import bun:test, while gstack-pre-deploy invokes one through pnpm test/Vitest even though Vitest excludes it; package.json also points the Bun script at ../test/gstack rather than the repo-local directory. They are unrelated to vouch/referral but require an explicit allowlist or corrected runner in the collection guard.
- No CI contract enumerates test-looking files and fails on unexpected locations.
- The existing RLS audit silently returns when credentials are absent and relies on exec_sql; it is not a dependable security gate.

### CI and production smoke gaps

- App CI typecheck, lint, default Vitest, and build are gating.
- Link E2E is continue-on-error.
- App CI comments name e2e/production-smoke.spec.ts as the ship gate, but no workflow invokes that file.
- Production Link Health runs only e2e/link-health.spec.ts on Desktop Chrome. It lacks /join, /vouch, /vouched, provider gate flows, mobile, and authenticated state.
- Production Link Health uploads only its HTML report and only on failure; it does not upload test-results, screenshots, or traces on every run. App CI separately uploads its report and test-results on every run. Global Playwright traces remain on-first-retry.
- Current production link assertions generally reject only HTTP 404, so 400, 401, 403, and 500 responses can pass despite the required under-400 contract. Production homepage crawling is capped at the first ten internal links, so it is not a complete link sweep.
- The deterministic local Supabase runner resets migrations, seeds roles/subscriptions, and runs Playwright, but CI currently uses it only for a landlord smoke. No deterministic vouch/referral state fixtures are wired.

### Lighthouse gaps

- Lighthouse covers only homepage and one property detail page.
- It runs three times, but all thresholds are warnings.
- Performance threshold is 0.80 rather than 0.90.
- The workflow is report-only and continue-on-error.
- No public vouch routes or authenticated provider-progress harness exists.

### Preview and production availability

Repository evidence does not prove:

- a linked Vercel project or current preview URL;
- a Supabase branch database;
- separation of preview and production Supabase credentials;
- preview-specific secrets;
- exact prebuilt artifact promotion;
- a current green deployment;
- production or preview legacy-row counts.

There is no tracked vercel.json or .vercel project metadata, no preview deployment workflow, no Supabase branch creation/link step, and only one generic Supabase environment variable set in .env.example. The deployment_status workflow suggests Vercel may report production deployments to GitHub, but it is not proof of linkage, artifact identity, or database isolation.

supabase/config.toml is local CLI configuration (project_id britv3-m2tests, localhost ports, and local migration/seed behavior), not a hosted Supabase branch link. lib/deployment/config.ts names development, staging, and production resources but has no repository consumers; it is legacy/aspirational configuration, not evidence that those environments exist.

## Risk-ranked implementation constraints

### P0 — authorization, integrity, and money

- Eliminate JWT verification bypass; claims may optimize role lookup only.
- Fail closed with typed 503 behavior when canonical access-state lookup fails.
- Apply the same access decision to proxy, provider layout, APIs, and transaction guard.
- Use database-owned identity-bound vouch acceptance and referral-credit issuance.
- Move conversion to the first positive paid provider invoice.
- Credit only the referrer, exactly once, with cap accounting and durable retries.
- Preserve consent-safe public projections; never expose voucher IDs, contact data, evidence, IP, device, payment, or fraud details.

### P1 — bootstrap and migration correctness

- Grandfather verified providers explicitly.
- Permit eligible grandfathered peers to break the 3+3 bootstrap deadlock.
- Bind client acceptance to the invited email through OTP without a seven-day age rule.
- Query and record exact target-database cohort counts before applying the migration.
- Preserve July reference RLS hardening and the correct “verified” enum comparison.

### P2 — operability

- Add collection guard, deterministic fixtures, route/link contract, DB suite CI, feature Playwright, hard Lighthouse budgets, invoked production smoke, and evidence manifest.
- Prove preview database isolation before remote migration testing.
- Keep VOUCH_GATE_BYPASS server-only, false by default, and limited to the new vouch condition.

## Gate 0 decisions required before Phase 1

Approval to continue should confirm:

- Legacy provider_references remains read-only history and is never trusted/backfilled into vouches.
- Canonical IDs are profiles.id; service_provider_details.user_id is the provider join.
- Existing verified providers are grandfathered based on an execution-time target-database query.
- Provider subscription/referral credits use Stripe; GoCardless remains estate-agent-only.
- The permanent access policy is shared across the four enforcement layers named above.
- Preview work cannot proceed until an isolated Supabase branch and Vercel preview are proven.
- The auth-callback public-route risk receives an early behavioral tracer.
- Existing July hardening and canonical verified comparison are preserved.

## Appendix A — Complete App Router endpoint inventory

Layout chains are relative to src/app. Route groups are shown even though they are omitted from URLs.

| URL | Entry | Component | Delivery | Route groups | Layout chain | Source |
|---|---|---|---|---|---|---|
| / | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/page.tsx |
| /about | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/about/page.tsx |
| /account-deletion-confirm | page | client | dynamic (request/auth, inherited) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/account-deletion-confirm/page.tsx |
| /account-locked | page | client | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/account-locked/page.tsx |
| /account-suspended | page | client | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/account-suspended/page.tsx |
| /admin | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/page.tsx |
| /admin/analytics/behaviour | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/analytics/behaviour/page.tsx |
| /admin/analytics/platform | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/analytics/platform/page.tsx |
| /admin/analytics/revenue | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/analytics/revenue/page.tsx |
| /admin/analytics/search | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/analytics/search/page.tsx |
| /admin/api-usage | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/api-usage/page.tsx |
| /admin/audit-log | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/audit-log/page.tsx |
| /admin/cms/blog | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/blog/page.tsx |
| /admin/cms/blog/[id] | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/blog/[id]/page.tsx |
| /admin/cms/help | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/help/page.tsx |
| /admin/cms/help/[id] | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/help/[id]/page.tsx |
| /admin/cms/landing | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/landing/page.tsx |
| /admin/cms/landing/[id] | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/cms/landing/[id]/page.tsx |
| /admin/data-wire | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/data-wire/page.tsx |
| /admin/email-campaigns | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/email-campaigns/page.tsx |
| /admin/feature-flags | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/feature-flags/page.tsx |
| /admin/fraud | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/fraud/page.tsx |
| /admin/gdpr | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/gdpr/page.tsx |
| /admin/moderation | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/moderation/page.tsx |
| /admin/placement-products | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/placement-products/page.tsx |
| /admin/placements | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/placements/page.tsx |
| /admin/pricing-review | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/pricing-review/page.tsx |
| /admin/promo-codes | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/promo-codes/page.tsx |
| /admin/reported | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/reported/page.tsx |
| /admin/reviews | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/reviews/page.tsx |
| /admin/roles | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/roles/page.tsx |
| /admin/sdr | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/sdr/page.tsx |
| /admin/seo | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/seo/page.tsx |
| /admin/subscriptions | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/subscriptions/page.tsx |
| /admin/system-health | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/system-health/page.tsx |
| /admin/team | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/team/page.tsx |
| /admin/truedeed/disputes | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/truedeed/disputes/page.tsx |
| /admin/truedeed/invoice-candidates | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/truedeed/invoice-candidates/page.tsx |
| /admin/truedeed/rebuttals | page | server | dynamic (explicit) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/truedeed/rebuttals/page.tsx |
| /admin/users | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/users/page.tsx |
| /admin/users/[id] | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/users/[id]/page.tsx |
| /admin/verifications | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/verifications/page.tsx |
| /admin/verifications/[userId] | page | server | dynamic (request/auth, inherited) | (admin) | layout.tsx<br>(admin)/layout.tsx | src/app/(admin)/admin/verifications/[userId]/page.tsx |
| /agent-briefing | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/agent-briefing/page.tsx |
| /agent-briefing/archive | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/agent-briefing/archive/page.tsx |
| /agent-briefing/archive/[slug] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/agent-briefing/archive/[slug]/page.tsx |
| /agents | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/agents/page.tsx |
| /agents/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/agents/[slug]/page.tsx |
| /api/address/autocomplete | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/address/autocomplete/route.ts |
| /api/address/resolve | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/address/resolve/route.ts |
| /api/admin/audit-log/export | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/audit-log/export/route.ts |
| /api/admin/billing/replay/[event_id] | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/billing/replay/[event_id]/route.ts |
| /api/admin/campaigns | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/campaigns/route.ts |
| /api/admin/campaigns/[id]/send | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/campaigns/[id]/send/route.ts |
| /api/admin/cms/[id] | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/cms/[id]/route.ts |
| /api/admin/cms/[id]/seo | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/cms/[id]/seo/route.ts |
| /api/admin/data-wire/pack | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/data-wire/pack/route.ts |
| /api/admin/feature-flags/[key]/rollout | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/feature-flags/[key]/rollout/route.ts |
| /api/admin/feature-flags/[key]/toggle | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/feature-flags/[key]/toggle/route.ts |
| /api/admin/gdpr/[id]/delete | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/gdpr/[id]/delete/route.ts |
| /api/admin/gdpr/[id]/export | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/gdpr/[id]/export/route.ts |
| /api/admin/gdpr/[id]/fulfil | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/gdpr/[id]/fulfil/route.ts |
| /api/admin/listings/[listingId]/approve | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/listings/[listingId]/approve/route.ts |
| /api/admin/listings/[listingId]/flag | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/listings/[listingId]/flag/route.ts |
| /api/admin/listings/[listingId]/reject | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/listings/[listingId]/reject/route.ts |
| /api/admin/placement-products | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/placement-products/route.ts |
| /api/admin/placement-products/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/placement-products/[id]/route.ts |
| /api/admin/placements | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/placements/route.ts |
| /api/admin/placements/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/placements/[id]/route.ts |
| /api/admin/promo-codes | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/promo-codes/route.ts |
| /api/admin/promo-codes/[id] | DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/promo-codes/[id]/route.ts |
| /api/admin/references/[id]/review | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/references/[id]/review/route.ts |
| /api/admin/reports/resolve | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/reports/resolve/route.ts |
| /api/admin/roles/[userId]/demote | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/roles/[userId]/demote/route.ts |
| /api/admin/roles/[userId]/promote | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/roles/[userId]/promote/route.ts |
| /api/admin/sdr | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/sdr/route.ts |
| /api/admin/sdr/process | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/sdr/process/route.ts |
| /api/admin/subscriptions/[id]/cancel | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/subscriptions/[id]/cancel/route.ts |
| /api/admin/team/invite | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/team/invite/route.ts |
| /api/admin/truedeed/disputes | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/truedeed/disputes/route.ts |
| /api/admin/truedeed/invoice-candidates | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/truedeed/invoice-candidates/route.ts |
| /api/admin/truedeed/rebuttals | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/truedeed/rebuttals/route.ts |
| /api/admin/users/[userId]/activate | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/users/[userId]/activate/route.ts |
| /api/admin/users/[userId]/ban | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/users/[userId]/ban/route.ts |
| /api/admin/users/[userId]/suspend | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/users/[userId]/suspend/route.ts |
| /api/admin/verifications/review | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/verifications/review/route.ts |
| /api/admin/vouch-rules | PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/admin/vouch-rules/route.ts |
| /api/agent/analytics | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/analytics/route.ts |
| /api/agent/billing | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/billing/route.ts |
| /api/agent/branches | GET,POST,PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/branches/route.ts |
| /api/agent/crm | GET,POST,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/crm/route.ts |
| /api/agent/dashboard | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/dashboard/route.ts |
| /api/agent/feed-imports/[runId]/approve | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/feed-imports/[runId]/approve/route.ts |
| /api/agent/feed-imports/[runId]/publish | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/feed-imports/[runId]/publish/route.ts |
| /api/agent/feeds | GET,POST,PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/feeds/route.ts |
| /api/agent/feeds/[id]/sync | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/feeds/[id]/sync/route.ts |
| /api/agent/feeds/[id]/test | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/feeds/[id]/test/route.ts |
| /api/agent/leads | GET,POST,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/leads/route.ts |
| /api/agent/leads/activities | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/leads/activities/route.ts |
| /api/agent/leads/export | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/leads/export/route.ts |
| /api/agent/listings | POST,GET | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/listings/route.ts |
| /api/agent/listings/[id] | PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/listings/[id]/route.ts |
| /api/agent/listings/generate-description | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/listings/generate-description/route.ts |
| /api/agent/offers | GET,POST,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/offers/route.ts |
| /api/agent/offers/[id]/history | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/offers/[id]/history/route.ts |
| /api/agent/reports | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/reports/route.ts |
| /api/agent/reviews | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/reviews/route.ts |
| /api/agent/reviews/[id]/respond | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/reviews/[id]/respond/route.ts |
| /api/agent/sales | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/sales/route.ts |
| /api/agent/sales/chain | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/sales/chain/route.ts |
| /api/agent/team | GET,POST,PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/team/route.ts |
| /api/agent/viewings | GET,POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/viewings/route.ts |
| /api/agent/viewings/feedback | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/agent/viewings/feedback/route.ts |
| /api/ai-match | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/ai-match/route.ts |
| /api/ai/generate-description | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/ai/generate-description/route.ts |
| /api/ai/quote-draft | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/ai/quote-draft/route.ts |
| /api/analytics/event | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/analytics/event/route.ts |
| /api/area-prices/postcode-detail | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/area-prices/postcode-detail/route.ts |
| /api/attachments | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/attachments/route.ts |
| /api/auth/email-code/request | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/auth/email-code/request/route.ts |
| /api/auth/email-code/verify | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/auth/email-code/verify/route.ts |
| /api/awards/nominations | POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/awards/nominations/route.ts |
| /api/billing/checkout | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/checkout/route.ts |
| /api/billing/invoices | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/invoices/route.ts |
| /api/billing/methods | GET,POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/methods/route.ts |
| /api/billing/plans | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/plans/route.ts |
| /api/billing/proration | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/proration/route.ts |
| /api/billing/refund | POST,GET | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/refund/route.ts |
| /api/billing/session/[sessionId] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/billing/session/[sessionId]/route.ts |
| /api/bookings/[id] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/bookings/[id]/route.ts |
| /api/bookings/[id]/status | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/bookings/[id]/status/route.ts |
| /api/bookings/create | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/bookings/create/route.ts |
| /api/bookings/list | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/bookings/list/route.ts |
| /api/contact | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/contact/route.ts |
| /api/dashboard | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/dashboard/route.ts |
| /api/documents | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/documents/route.ts |
| /api/documents/[id] | DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/documents/[id]/route.ts |
| /api/email/digest | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/email/digest/route.ts |
| /api/emails/preview/[template] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/emails/preview/[template]/route.tsx |
| /api/experiments/exposure | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/experiments/exposure/route.ts |
| /api/gdpr/cancel-deletion | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/gdpr/cancel-deletion/route.ts |
| /api/gdpr/delete | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/gdpr/delete/route.ts |
| /api/gdpr/export | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/gdpr/export/route.ts |
| /api/geocode | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/geocode/route.ts |
| /api/health | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/health/route.ts |
| /api/inngest | handler | HTTP handler | dynamic HTTP | — | — | src/app/api/inngest/route.ts |
| /api/invites/[code] | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/invites/[code]/route.ts |
| /api/landlord/applications | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/applications/route.ts |
| /api/landlord/applications/[id]/decision | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/applications/[id]/decision/route.ts |
| /api/landlord/applications/[id]/referencing | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/applications/[id]/referencing/route.ts |
| /api/landlord/batch/reminders | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/batch/reminders/route.ts |
| /api/landlord/compliance/upload | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/compliance/upload/route.ts |
| /api/landlord/deposits | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/deposits/route.ts |
| /api/landlord/deposits/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/deposits/[id]/route.ts |
| /api/landlord/finance/entries | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/finance/entries/route.ts |
| /api/landlord/finance/entries/[id] | PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/finance/entries/[id]/route.ts |
| /api/landlord/inventory | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/inventory/route.ts |
| /api/landlord/inventory/[reportId] | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/inventory/[reportId]/route.ts |
| /api/landlord/maintenance | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/maintenance/route.ts |
| /api/landlord/maintenance/[id]/assign | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/maintenance/[id]/assign/route.ts |
| /api/landlord/maintenance/[id]/notes | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/maintenance/[id]/notes/route.ts |
| /api/landlord/maintenance/[id]/status | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/maintenance/[id]/status/route.ts |
| /api/landlord/properties | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/properties/route.ts |
| /api/landlord/rent | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/rent/route.ts |
| /api/landlord/rent/[entryId]/mark-paid | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/landlord/rent/[entryId]/mark-paid/route.ts |
| /api/landlords/deadline-diary/[token]/calendar.ics | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/landlords/deadline-diary/[token]/calendar.ics/route.ts |
| /api/landlords/deadline-diary/profile | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/landlords/deadline-diary/profile/route.ts |
| /api/landlords/fair-landlord-pledge | POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/landlords/fair-landlord-pledge/route.ts |
| /api/legal/gdpr-request | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/legal/gdpr-request/route.ts |
| /api/listings | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/listings/route.ts |
| /api/listings/[id] | GET,PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/listings/[id]/route.ts |
| /api/listings/[id]/media | POST,DELETE,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/listings/[id]/media/route.ts |
| /api/maintenance/[id] | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/maintenance/[id]/route.ts |
| /api/market-map | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/route.ts |
| /api/market-map/area/[level]/[areaId] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/area/[level]/[areaId]/route.ts |
| /api/market-map/card | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/card/route.ts |
| /api/market-map/postcode-card | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/postcode-card/route.ts |
| /api/market-map/sold/[z]/[x]/[y] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/sold/[z]/[x]/[y]/route.ts |
| /api/market-map/tiles/[z]/[x]/[y] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/tiles/[z]/[x]/[y]/route.ts |
| /api/market-map/version | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-map/version/route.ts |
| /api/market-search | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/market-search/route.ts |
| /api/messages | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/route.ts |
| /api/messages/[conversationId] | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/[conversationId]/route.ts |
| /api/messages/[conversationId]/archive | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/[conversationId]/archive/route.ts |
| /api/messages/[conversationId]/block | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/[conversationId]/block/route.ts |
| /api/messages/[conversationId]/draft | GET,PUT,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/[conversationId]/draft/route.ts |
| /api/messages/[conversationId]/read | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/messages/[conversationId]/read/route.ts |
| /api/milestones/job | GET,POST,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/milestones/job/route.ts |
| /api/milestones/transaction | GET,POST,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/milestones/transaction/route.ts |
| /api/moving-checklist | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/moving-checklist/route.ts |
| /api/moving-checklist/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/moving-checklist/[id]/route.ts |
| /api/new-homes/events | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/new-homes/events/route.ts |
| /api/new-homes/leads | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/new-homes/leads/route.ts |
| /api/newsletter | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/newsletter/route.ts |
| /api/newsletter/confirm | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/newsletter/confirm/route.ts |
| /api/newsletter/unsubscribe | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/newsletter/unsubscribe/route.ts |
| /api/notifications | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/notifications/route.ts |
| /api/notifications/preferences | GET,PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/notifications/preferences/route.ts |
| /api/notifications/read | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/notifications/read/route.ts |
| /api/notifications/unsubscribe | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/notifications/unsubscribe/route.ts |
| /api/offers | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/offers/route.ts |
| /api/offers/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/offers/[id]/route.ts |
| /api/og/[kind] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/og/[kind]/route.tsx |
| /api/pay/[token] | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/pay/[token]/route.ts |
| /api/placements/events | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/placements/events/route.ts |
| /api/placements/featured | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/placements/featured/route.ts |
| /api/portfolio | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/portfolio/route.ts |
| /api/profile | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/profile/route.ts |
| /api/profile/picture | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/profile/picture/route.ts |
| /api/properties/[id]/book-viewing | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/book-viewing/route.ts |
| /api/properties/[id]/contact | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/contact/route.ts |
| /api/properties/[id]/documents | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/documents/route.ts |
| /api/properties/[id]/financials | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/financials/route.ts |
| /api/properties/[id]/maintenance | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/maintenance/route.ts |
| /api/properties/[id]/report | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/report/route.ts |
| /api/properties/[id]/request-viewing | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/request-viewing/route.ts |
| /api/properties/[id]/save | POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/save/route.ts |
| /api/properties/[id]/tenancies | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/tenancies/route.ts |
| /api/properties/[id]/view | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/view/route.ts |
| /api/properties/[id]/viewing-slots | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/properties/[id]/viewing-slots/route.ts |
| /api/provider/availability | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/availability/route.ts |
| /api/provider/boost | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/boost/route.ts |
| /api/provider/certificates | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/certificates/route.ts |
| /api/provider/invoices | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/invoices/route.ts |
| /api/provider/invoices/[id]/paid | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/invoices/[id]/paid/route.ts |
| /api/provider/invoices/[id]/pdf | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/invoices/[id]/pdf/route.ts |
| /api/provider/invoices/[id]/send | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/invoices/[id]/send/route.ts |
| /api/provider/jobs/[id]/status | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/jobs/[id]/status/route.ts |
| /api/provider/payments/onsite | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/payments/onsite/route.ts |
| /api/provider/payments/onsite/confirm | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/payments/onsite/confirm/route.ts |
| /api/provider/placements | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/placements/route.ts |
| /api/provider/placements/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/placements/[id]/route.ts |
| /api/provider/portfolio | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/portfolio/route.ts |
| /api/provider/portfolio/[id] | PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/portfolio/[id]/route.ts |
| /api/provider/portfolio/reorder | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/portfolio/reorder/route.ts |
| /api/provider/quotes | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/quotes/route.ts |
| /api/provider/quotes/[id]/accept | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/quotes/[id]/accept/route.ts |
| /api/provider/quotes/[id]/pdf | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/quotes/[id]/pdf/route.ts |
| /api/provider/quotes/[id]/send | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/quotes/[id]/send/route.ts |
| /api/provider/quotes/suggest-items | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/quotes/suggest-items/route.ts |
| /api/provider/references | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/references/route.ts |
| /api/provider/references/[id]/cancel | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/references/[id]/cancel/route.ts |
| /api/provider/references/[id]/resend | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/references/[id]/resend/route.ts |
| /api/provider/reviews/[id]/respond | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/reviews/[id]/respond/route.ts |
| /api/provider/service-areas | GET,POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/service-areas/route.ts |
| /api/provider/services | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/services/route.ts |
| /api/provider/services/[id] | PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/provider/services/[id]/route.ts |
| /api/providers/[slug] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/[slug]/route.ts |
| /api/providers/availability | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/availability/route.ts |
| /api/providers/compare | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/compare/route.ts |
| /api/providers/documents/upload | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/documents/upload/route.ts |
| /api/providers/nearby | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/nearby/route.ts |
| /api/providers/search | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/providers/search/route.ts |
| /api/push/send | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/push/send/route.ts |
| /api/push/subscribe | POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/push/subscribe/route.ts |
| /api/quotes/[id] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/quotes/[id]/route.ts |
| /api/quotes/[id]/accept | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/quotes/[id]/accept/route.ts |
| /api/quotes/create | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/quotes/create/route.ts |
| /api/references/[token]/decline | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/references/[token]/decline/route.ts |
| /api/references/[token]/submit | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/references/[token]/submit/route.ts |
| /api/referrals/v2 | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/referrals/v2/route.ts |
| /api/referrals/v2/attribute | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/referrals/v2/attribute/route.ts |
| /api/reports/reality-gap/csv | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/reports/reality-gap/csv/route.ts |
| /api/reviews/[id]/edit | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/[id]/edit/route.ts |
| /api/reviews/[id]/flag | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/[id]/flag/route.ts |
| /api/reviews/[id]/helpful | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/[id]/helpful/route.ts |
| /api/reviews/[id]/respond | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/[id]/respond/route.ts |
| /api/reviews/aggregate | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/aggregate/route.ts |
| /api/reviews/create | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/create/route.ts |
| /api/reviews/list | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/list/route.ts |
| /api/reviews/moderation/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/moderation/[id]/route.ts |
| /api/reviews/reviewable | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/reviews/reviewable/route.ts |
| /api/rfq/[id] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/rfq/[id]/route.ts |
| /api/rfq/create | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/rfq/create/route.ts |
| /api/rfq/list | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/rfq/list/route.ts |
| /api/saved/properties | GET,POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/saved/properties/route.ts |
| /api/saved/searches | GET,POST,DELETE,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/saved/searches/route.ts |
| /api/search | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/search/route.ts |
| /api/search/instant | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/search/instant/route.ts |
| /api/seller/agents | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/agents/route.ts |
| /api/seller/describe | POST,GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/describe/route.ts |
| /api/seller/listings | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/listings/route.ts |
| /api/seller/listings/[id] | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/listings/[id]/route.ts |
| /api/seller/listings/[id]/analytics | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/listings/[id]/analytics/route.ts |
| /api/seller/offers | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/offers/route.ts |
| /api/seller/offers/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/offers/[id]/route.ts |
| /api/seller/sale-progress/[id] | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/sale-progress/[id]/route.ts |
| /api/seller/valuation | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/valuation/route.ts |
| /api/seller/viewings | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/viewings/route.ts |
| /api/seller/viewings/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/seller/viewings/[id]/route.ts |
| /api/service-provider/profile | GET,PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/service-provider/profile/route.ts |
| /api/services | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/services/route.ts |
| /api/settings/change-email | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/change-email/route.ts |
| /api/settings/change-password | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/change-password/route.ts |
| /api/settings/connected | GET,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/connected/route.ts |
| /api/settings/login-history | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/login-history/route.ts |
| /api/settings/mfa/backup-codes | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/mfa/backup-codes/route.ts |
| /api/settings/mfa/enroll | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/mfa/enroll/route.ts |
| /api/settings/mfa/unenroll | DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/mfa/unenroll/route.ts |
| /api/settings/mfa/verify | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/mfa/verify/route.ts |
| /api/settings/notifications | GET,PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/notifications/route.ts |
| /api/settings/prefs | GET,PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/prefs/route.ts |
| /api/settings/privacy | GET,PUT | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/privacy/route.ts |
| /api/settings/profile | GET,PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/profile/route.ts |
| /api/settings/profile/avatar | POST,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/profile/avatar/route.ts |
| /api/settings/profile/role-data | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/profile/role-data/route.ts |
| /api/settings/reauth | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/reauth/route.ts |
| /api/settings/sessions | GET,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/settings/sessions/route.ts |
| /api/stripe/connect/create-account | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/stripe/connect/create-account/route.ts |
| /api/stripe/connect/onboarding-link | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/stripe/connect/onboarding-link/route.ts |
| /api/tenancies/[id] | PATCH | HTTP handler | dynamic HTTP | — | — | src/app/api/tenancies/[id]/route.ts |
| /api/truedeed/billing/mandate-setup | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/truedeed/billing/mandate-setup/route.ts |
| /api/truedeed/disputes | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/truedeed/disputes/route.ts |
| /api/truedeed/introductions | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/truedeed/introductions/route.ts |
| /api/truedeed/outcomes | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/truedeed/outcomes/route.ts |
| /api/truedeed/rebuttals | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/truedeed/rebuttals/route.ts |
| /api/valuations/[id]/agent-lead | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/valuations/[id]/agent-lead/route.ts |
| /api/valuations/address | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/valuations/address/route.ts |
| /api/valuations/calculate | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/valuations/calculate/route.ts |
| /api/valuations/details | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/valuations/details/route.ts |
| /api/valuations/session | GET,POST | HTTP handler | dynamic HTTP | — | — | src/app/api/valuations/session/route.ts |
| /api/verification/company | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/verification/company/route.ts |
| /api/viewings | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/viewings/route.ts |
| /api/viewings/[id] | PATCH,DELETE | HTTP handler | dynamic HTTP | — | — | src/app/api/viewings/[id]/route.ts |
| /api/viewings/book | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/viewings/book/route.ts |
| /api/viewings/requests/[id] | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/viewings/requests/[id]/route.ts |
| /api/viewings/slots | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/viewings/slots/route.ts |
| /api/waitlist | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/waitlist/route.ts |
| /api/waitlist/[code] | GET | HTTP handler | dynamic HTTP | — | — | src/app/api/waitlist/[code]/route.ts |
| /api/webhooks/gocardless | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/webhooks/gocardless/route.ts |
| /api/webhooks/referencing | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/webhooks/referencing/route.ts |
| /api/webhooks/resend | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/webhooks/resend/route.ts |
| /api/webhooks/stripe | POST | HTTP handler | dynamic HTTP | — | — | src/app/api/webhooks/stripe/route.ts |
| /architects | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/architects/page.tsx |
| /architects/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/architects/[slug]/page.tsx |
| /area-prices | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/area-prices/page.tsx |
| /areas | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/areas/page.tsx |
| /areas/[city] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/areas/[city]/page.tsx |
| /areas/[city]/[area] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/areas/[city]/[area]/page.tsx |
| /areas/[city]/stats | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/areas/[city]/stats/page.tsx |
| /auth/callback | GET | HTTP handler | dynamic HTTP | — | — | src/app/auth/callback/route.ts |
| /awards | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/awards/page.tsx |
| /awards/methodology | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/awards/methodology/page.tsx |
| /blog | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/blog/layout.tsx | src/app/(main)/blog/page.tsx |
| /blog/[slug] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/blog/layout.tsx | src/app/(main)/blog/[slug]/page.tsx |
| /blog/category/[slug] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/blog/layout.tsx | src/app/(main)/blog/category/[slug]/page.tsx |
| /blog/first-time-buyers | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/blog/layout.tsx | src/app/(main)/blog/first-time-buyers/page.tsx |
| /careers | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/careers/page.tsx |
| /coming-soon | page | server | static candidate (automatic; build-unverified) | (splash) | layout.tsx<br>(splash)/layout.tsx | src/app/(splash)/coming-soon/page.tsx |
| /compare | page | client | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/compare/layout.tsx | src/app/(main)/compare/page.tsx |
| /compliance | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/compliance/page.tsx |
| /compliance/pre-launch-audit-2026 | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/compliance/pre-launch-audit-2026/page.tsx |
| /contact | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/contact/page.tsx |
| /conveyancers | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/conveyancers/page.tsx |
| /conveyancers/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/conveyancers/[slug]/page.tsx |
| /dashboard | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/page.tsx |
| /dashboard/[role] | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/page.tsx |
| /dashboard/[role]/ai-match | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/ai-match/page.tsx |
| /dashboard/[role]/applications | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/applications/page.tsx |
| /dashboard/[role]/applications/apply/[listingId] | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/applications/apply/[listingId]/page.tsx |
| /dashboard/[role]/billing | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/page.tsx |
| /dashboard/[role]/billing/checkout/one-time | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/checkout/one-time/page.tsx |
| /dashboard/[role]/billing/checkout/subscription | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/checkout/subscription/page.tsx |
| /dashboard/[role]/billing/confirmation | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/confirmation/page.tsx |
| /dashboard/[role]/billing/failed | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/failed/page.tsx |
| /dashboard/[role]/billing/invoices | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/invoices/page.tsx |
| /dashboard/[role]/billing/payment-methods | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/payment-methods/page.tsx |
| /dashboard/[role]/billing/refund | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/refund/page.tsx |
| /dashboard/[role]/billing/subscription | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/billing/subscription/page.tsx |
| /dashboard/[role]/calculators | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/calculators/page.tsx |
| /dashboard/[role]/documents | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/documents/page.tsx |
| /dashboard/[role]/listings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/listings/page.tsx |
| /dashboard/[role]/listings/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/listings/[id]/page.tsx |
| /dashboard/[role]/listings/[id]/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/listings/[id]/analytics/page.tsx |
| /dashboard/[role]/listings/new | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/listings/new/page.tsx |
| /dashboard/[role]/moving | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/moving/page.tsx |
| /dashboard/[role]/offers | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/offers/page.tsx |
| /dashboard/[role]/referrals | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/referrals/page.tsx |
| /dashboard/[role]/saved | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/saved/page.tsx |
| /dashboard/[role]/searches | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/searches/page.tsx |
| /dashboard/[role]/services | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/services/page.tsx |
| /dashboard/[role]/tenancy | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/tenancy/page.tsx |
| /dashboard/[role]/viewings | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/viewings/page.tsx |
| /dashboard/[role]/viewings/[id]/reschedule | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/viewings/[id]/reschedule/page.tsx |
| /dashboard/[role]/viewings/book | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/[role]/layout.tsx | src/app/(protected)/dashboard/[role]/viewings/book/page.tsx |
| /dashboard/agent | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/page.tsx |
| /dashboard/agent/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/analytics/page.tsx |
| /dashboard/agent/analytics/branch | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/analytics/branch/page.tsx |
| /dashboard/agent/analytics/competitors | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/analytics/competitors/page.tsx |
| /dashboard/agent/billing | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/billing/page.tsx |
| /dashboard/agent/billing/boost | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/billing/boost/page.tsx |
| /dashboard/agent/billing/truedeed | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/billing/truedeed/page.tsx |
| /dashboard/agent/crm | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/crm/page.tsx |
| /dashboard/agent/crm/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/crm/[id]/page.tsx |
| /dashboard/agent/integrations | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/integrations/page.tsx |
| /dashboard/agent/integrations/feeds | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/integrations/feeds/page.tsx |
| /dashboard/agent/introductions | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/introductions/page.tsx |
| /dashboard/agent/leads | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/leads/page.tsx |
| /dashboard/agent/leads/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/leads/[id]/page.tsx |
| /dashboard/agent/listings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/listings/page.tsx |
| /dashboard/agent/listings/[id]/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/listings/[id]/analytics/page.tsx |
| /dashboard/agent/listings/archived | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/listings/archived/page.tsx |
| /dashboard/agent/listings/create | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/listings/create/page.tsx |
| /dashboard/agent/listings/sold | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/listings/sold/page.tsx |
| /dashboard/agent/offers | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/offers/page.tsx |
| /dashboard/agent/offers/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/offers/[id]/page.tsx |
| /dashboard/agent/profile | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/profile/page.tsx |
| /dashboard/agent/profile/branding | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/profile/branding/page.tsx |
| /dashboard/agent/revenue | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/revenue/page.tsx |
| /dashboard/agent/reviews | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/reviews/page.tsx |
| /dashboard/agent/reviews/[id]/respond | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/reviews/[id]/respond/page.tsx |
| /dashboard/agent/sales | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/sales/page.tsx |
| /dashboard/agent/sales/appraisal | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/sales/appraisal/page.tsx |
| /dashboard/agent/sales/reports | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/sales/reports/page.tsx |
| /dashboard/agent/team | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/team/page.tsx |
| /dashboard/agent/team/branches | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/team/branches/page.tsx |
| /dashboard/agent/team/roles | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/team/roles/page.tsx |
| /dashboard/agent/viewings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/viewings/page.tsx |
| /dashboard/agent/viewings/feedback | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/agent/layout.tsx | src/app/(protected)/dashboard/agent/viewings/feedback/page.tsx |
| /dashboard/bookings | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/bookings/page.tsx |
| /dashboard/bookings/[id] | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/bookings/[id]/page.tsx |
| /dashboard/broker | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/page.tsx |
| /dashboard/broker/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/analytics/page.tsx |
| /dashboard/broker/billing | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/billing/page.tsx |
| /dashboard/broker/calculators | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/calculators/page.tsx |
| /dashboard/broker/fca-verification | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/fca-verification/page.tsx |
| /dashboard/broker/leads | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/leads/page.tsx |
| /dashboard/broker/pipeline | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/pipeline/page.tsx |
| /dashboard/broker/products | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/products/page.tsx |
| /dashboard/broker/profile | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/profile/page.tsx |
| /dashboard/broker/reviews | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/broker/layout.tsx | src/app/(protected)/dashboard/broker/reviews/page.tsx |
| /dashboard/developer | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/developer/page.tsx |
| /dashboard/developer/developments | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/developer/developments/page.tsx |
| /dashboard/developer/leads | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/developer/leads/page.tsx |
| /dashboard/developer/viewings | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/developer/viewings/page.tsx |
| /dashboard/landlord | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/page.tsx |
| /dashboard/landlord/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/analytics/page.tsx |
| /dashboard/landlord/compliance | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/compliance/page.tsx |
| /dashboard/landlord/compliance-guide | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/compliance-guide/page.tsx |
| /dashboard/landlord/compliance/alerts | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/compliance/alerts/page.tsx |
| /dashboard/landlord/compliance/matrix | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/compliance/matrix/page.tsx |
| /dashboard/landlord/compliance/upload | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/compliance/upload/page.tsx |
| /dashboard/landlord/deposits | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/deposits/page.tsx |
| /dashboard/landlord/finance/expenses | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/finance/expenses/page.tsx |
| /dashboard/landlord/finance/report | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/finance/report/page.tsx |
| /dashboard/landlord/finance/tax | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/finance/tax/page.tsx |
| /dashboard/landlord/find-agent | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/find-agent/page.tsx |
| /dashboard/landlord/find-tradespeople | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/find-tradespeople/page.tsx |
| /dashboard/landlord/insurance | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/insurance/page.tsx |
| /dashboard/landlord/inventory/[propertyId]/check-in | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/inventory/[propertyId]/check-in/page.tsx |
| /dashboard/landlord/inventory/[propertyId]/check-out | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/inventory/[propertyId]/check-out/page.tsx |
| /dashboard/landlord/legal/notices | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/legal/notices/page.tsx |
| /dashboard/landlord/maintenance | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/maintenance/page.tsx |
| /dashboard/landlord/maintenance/[id] | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/maintenance/[id]/page.tsx |
| /dashboard/landlord/maintenance/[id]/assign | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/maintenance/[id]/assign/page.tsx |
| /dashboard/landlord/maintenance/new | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/maintenance/new/page.tsx |
| /dashboard/landlord/properties | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/page.tsx |
| /dashboard/landlord/properties/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/page.tsx |
| /dashboard/landlord/properties/[id]/documents | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/documents/page.tsx |
| /dashboard/landlord/properties/[id]/financials | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/financials/page.tsx |
| /dashboard/landlord/properties/[id]/listing | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/listing/page.tsx |
| /dashboard/landlord/properties/[id]/maintenance | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/maintenance/page.tsx |
| /dashboard/landlord/properties/[id]/maintenance/[requestId] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/maintenance/[requestId]/page.tsx |
| /dashboard/landlord/properties/[id]/maintenance/new | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/maintenance/new/page.tsx |
| /dashboard/landlord/properties/[id]/overview | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/overview/page.tsx |
| /dashboard/landlord/properties/[id]/tenancies | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/tenancies/page.tsx |
| /dashboard/landlord/properties/[id]/tenancies/[tenancyId] | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/page.tsx |
| /dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease/page.tsx |
| /dashboard/landlord/properties/add | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/properties/add/page.tsx |
| /dashboard/landlord/rent | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/rent/page.tsx |
| /dashboard/landlord/rent/[propertyId] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/rent/[propertyId]/page.tsx |
| /dashboard/landlord/tenants | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/tenants/page.tsx |
| /dashboard/landlord/tenants/[applicationId] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/tenants/[applicationId]/page.tsx |
| /dashboard/landlord/tenants/[applicationId]/decision | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/tenants/[applicationId]/decision/page.tsx |
| /dashboard/landlord/tenants/[applicationId]/tenancy/agreement | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/tenants/[applicationId]/tenancy/agreement/page.tsx |
| /dashboard/landlord/tools/yield-calculator | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/tools/yield-calculator/page.tsx |
| /dashboard/landlord/viewings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/landlord/layout.tsx | src/app/(protected)/dashboard/landlord/viewings/page.tsx |
| /dashboard/provider | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/page.tsx |
| /dashboard/provider/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/analytics/page.tsx |
| /dashboard/provider/availability | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/availability/page.tsx |
| /dashboard/provider/billing | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/billing/page.tsx |
| /dashboard/provider/boost | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/boost/page.tsx |
| /dashboard/provider/documents | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/documents/page.tsx |
| /dashboard/provider/field | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx<br>(protected)/dashboard/provider/field/layout.tsx | src/app/(protected)/dashboard/provider/field/page.tsx |
| /dashboard/provider/field/jobs | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx<br>(protected)/dashboard/provider/field/layout.tsx | src/app/(protected)/dashboard/provider/field/jobs/page.tsx |
| /dashboard/provider/field/payments | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx<br>(protected)/dashboard/provider/field/layout.tsx | src/app/(protected)/dashboard/provider/field/payments/page.tsx |
| /dashboard/provider/jobs/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/jobs/[id]/page.tsx |
| /dashboard/provider/jobs/[id]/certificates | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/jobs/[id]/certificates/page.tsx |
| /dashboard/provider/jobs/active | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/jobs/active/page.tsx |
| /dashboard/provider/jobs/completed | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/jobs/completed/page.tsx |
| /dashboard/provider/jobs/leads | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/jobs/leads/page.tsx |
| /dashboard/provider/payments | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/payments/page.tsx |
| /dashboard/provider/payments/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/payments/[id]/page.tsx |
| /dashboard/provider/portfolio | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/portfolio/page.tsx |
| /dashboard/provider/profile | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/profile/page.tsx |
| /dashboard/provider/quotes | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/quotes/page.tsx |
| /dashboard/provider/quotes/[id]/invoice | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/quotes/[id]/invoice/page.tsx |
| /dashboard/provider/quotes/builder | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/quotes/builder/page.tsx |
| /dashboard/provider/referrals | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/referrals/page.tsx |
| /dashboard/provider/reviews | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/reviews/page.tsx |
| /dashboard/provider/reviews/[id]/respond | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/reviews/[id]/respond/page.tsx |
| /dashboard/provider/services | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/services/page.tsx |
| /dashboard/provider/services/areas | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/services/areas/page.tsx |
| /dashboard/provider/verification | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/verification/page.tsx |
| /dashboard/provider/verification/badges | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/verification/badges/page.tsx |
| /dashboard/provider/verification/client-references | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/verification/client-references/page.tsx |
| /dashboard/provider/verification/credentials | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/verification/credentials/page.tsx |
| /dashboard/provider/verification/peer-references | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/provider/layout.tsx | src/app/(protected)/dashboard/provider/verification/peer-references/page.tsx |
| /dashboard/reviews | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/reviews/page.tsx |
| /dashboard/rfqs | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/rfqs/page.tsx |
| /dashboard/rfqs/[id] | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/rfqs/[id]/page.tsx |
| /dashboard/rfqs/create | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/rfqs/create/page.tsx |
| /dashboard/saved | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx | src/app/(protected)/dashboard/saved/page.tsx |
| /dashboard/seller | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/page.tsx |
| /dashboard/seller/agents | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/agents/page.tsx |
| /dashboard/seller/agents/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/agents/[id]/page.tsx |
| /dashboard/seller/agents/compare | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/agents/compare/page.tsx |
| /dashboard/seller/analytics | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/analytics/page.tsx |
| /dashboard/seller/enquiries | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/enquiries/page.tsx |
| /dashboard/seller/listings | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/listings/page.tsx |
| /dashboard/seller/listings/[id]/analytics | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/listings/[id]/analytics/page.tsx |
| /dashboard/seller/listings/[id]/edit | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/listings/[id]/edit/page.tsx |
| /dashboard/seller/listings/create | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/listings/create/page.tsx |
| /dashboard/seller/offers | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/offers/page.tsx |
| /dashboard/seller/sale-progress/[id] | page | server | dynamic (explicit) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/sale-progress/[id]/page.tsx |
| /dashboard/seller/valuation | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/valuation/page.tsx |
| /dashboard/seller/viewings | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/dashboard/layout.tsx<br>(protected)/dashboard/seller/layout.tsx | src/app/(protected)/dashboard/seller/viewings/page.tsx |
| /developers | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/developers/page.tsx |
| /fair-landlord-register | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/fair-landlord-register/page.tsx |
| /fee-transparency | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/fee-transparency/page.tsx |
| /forbidden | page | server | static candidate (automatic; build-unverified) | — | layout.tsx | src/app/forbidden/page.tsx |
| /forgot-password | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/forgot-password/page.tsx |
| /guides/landlord-guide | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/guides/landlord-guide/page.tsx |
| /help | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/help/page.tsx |
| /help/[slug] | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/help/[slug]/page.tsx |
| /help/contact | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/help/contact/layout.tsx | src/app/(main)/help/contact/page.tsx |
| /how-it-works | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/how-it-works/layout.tsx | src/app/(main)/how-it-works/page.tsx |
| /inbox | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/inbox/page.tsx |
| /inbox/[conversationId] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/inbox/[conversationId]/page.tsx |
| /investors | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/investors/page.tsx |
| /jobs | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/jobs/page.tsx |
| /landlords/clinics | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/landlords/clinics/page.tsx |
| /landlords/deadline-diary | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/landlords/deadline-diary/page.tsx |
| /legal | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/page.tsx |
| /legal/acceptable-use | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/acceptable-use/page.tsx |
| /legal/accessibility | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/accessibility/page.tsx |
| /legal/ai-transparency | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/ai-transparency/page.tsx |
| /legal/aml-policy | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/aml-policy/page.tsx |
| /legal/complaints | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/complaints/page.tsx |
| /legal/cookies | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/cookies/page.tsx |
| /legal/data-processing | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/data-processing/page.tsx |
| /legal/disclaimer | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/disclaimer/page.tsx |
| /legal/fair-housing | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/fair-housing/page.tsx |
| /legal/fee-transparency | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/fee-transparency/page.tsx |
| /legal/gdpr-rights | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/gdpr-rights/page.tsx |
| /legal/modern-slavery | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/modern-slavery/page.tsx |
| /legal/privacy | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/privacy/page.tsx |
| /legal/professional-standards | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/professional-standards/page.tsx |
| /legal/refunds | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/refunds/page.tsx |
| /legal/regulatory | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/regulatory/page.tsx |
| /legal/review-policy | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/review-policy/page.tsx |
| /legal/terms | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/terms/page.tsx |
| /legal/third-party-services | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/legal/layout.tsx | src/app/(main)/legal/third-party-services/page.tsx |
| /login | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/login/page.tsx |
| /maintenance | page | client | static candidate (automatic; build-unverified) | — | layout.tsx<br>maintenance/layout.tsx | src/app/maintenance/page.tsx |
| /market-trends | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/market-trends/page.tsx |
| /market-trends/national | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/market-trends/national/page.tsx |
| /marketplace | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/marketplace/page.tsx |
| /marketplace/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/marketplace/[slug]/page.tsx |
| /metrics | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/metrics/page.tsx |
| /milestones/job/[bookingId] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/milestones/job/[bookingId]/page.tsx |
| /milestones/transaction/[id] | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/milestones/transaction/[id]/page.tsx |
| /mortgage-brokers | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/mortgage-brokers/page.tsx |
| /mortgage-brokers/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/mortgage-brokers/[slug]/page.tsx |
| /new-homes | page | server | dynamic (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/new-homes/page.tsx |
| /new-homes/[developmentSlug] | page | server | dynamic (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/new-homes/[developmentSlug]/page.tsx |
| /notifications | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/notifications/page.tsx |
| /offline | page | client | static candidate (automatic; build-unverified) | — | layout.tsx<br>offline/layout.tsx | src/app/offline/page.tsx |
| /overview | page | server | static candidate (automatic; build-unverified) | — | layout.tsx | src/app/overview/page.tsx |
| /partners | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/partners/page.tsx |
| /pay/[token] | page | server | dynamic path (automatic) | — | layout.tsx | src/app/pay/[token]/page.tsx |
| /pledges | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/pledges/page.tsx |
| /pledges/no-premium-placement | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/pledges/no-premium-placement/page.tsx |
| /pledges/your-data-your-leads | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/pledges/your-data-your-leads/page.tsx |
| /post-a-job | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/post-a-job/page.tsx |
| /press | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/press/page.tsx |
| /press/portal-fees-briefing | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/press/portal-fees-briefing/page.tsx |
| /pricing | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/pricing/layout.tsx | src/app/(main)/pricing/page.tsx |
| /professionals | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/professionals/page.tsx |
| /professionals/[town]/[category] | page | server | dynamic (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/professionals/[town]/[category]/page.tsx |
| /profile | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/profile/page.tsx |
| /profile/settings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx | src/app/(protected)/profile/settings/page.tsx |
| /properties/[slug] | page | server | dynamic (explicit) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/properties/[slug]/layout.tsx | src/app/(main)/properties/[slug]/page.tsx |
| /queue | page | server | static candidate (automatic; build-unverified) | (splash) | layout.tsx<br>(splash)/layout.tsx | src/app/(splash)/queue/page.tsx |
| /rate-limited | page | client | static (explicit) | — | layout.tsx | src/app/rate-limited/page.tsx |
| /reference/[token] | page | server | dynamic (explicit) | — | layout.tsx | src/app/reference/[token]/page.tsx |
| /register | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/register/page.tsx |
| /register/onboarding/[role] | page | server | dynamic path (automatic) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/register/onboarding/[role]/page.tsx |
| /register/role-select | page | client | dynamic (explicit) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/register/role-select/page.tsx |
| /renter-tools | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/renter-tools/page.tsx |
| /reports | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/page.tsx |
| /reports/portal-cost-passthrough | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/portal-cost-passthrough/page.tsx |
| /reports/portal-cost-passthrough/methodology | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/portal-cost-passthrough/methodology/page.tsx |
| /reports/reality-gap | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/reality-gap/page.tsx |
| /reports/reality-gap/league | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/reality-gap/league/page.tsx |
| /reports/reality-gap/methodology | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/reality-gap/methodology/page.tsx |
| /reports/time-to-sell | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/time-to-sell/page.tsx |
| /reports/time-to-sell/methodology | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reports/time-to-sell/methodology/page.tsx |
| /reset-password | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/reset-password/page.tsx |
| /reviews | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reviews/page.tsx |
| /reviews/[area] | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reviews/[area]/page.tsx |
| /reviews/[area]/[provider] | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reviews/[area]/[provider]/page.tsx |
| /reviews/[area]/category/[category] | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/reviews/[area]/category/[category]/page.tsx |
| /search | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/search/page.tsx |
| /search/map | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/search/map/page.tsx |
| /search/market-map/[areaId] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/search/market-map/[areaId]/page.tsx |
| /sellers | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/sellers/page.tsx |
| /services | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/page.tsx |
| /services-near/[service]/[postcode] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services-near/[service]/[postcode]/page.tsx |
| /services/[category]/[slug] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/[category]/[slug]/page.tsx |
| /services/architects | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/architects/page.tsx |
| /services/conveyancers | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/conveyancers/page.tsx |
| /services/mortgage-brokers | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/mortgage-brokers/page.tsx |
| /services/pro/[slug] | page | server | dynamic (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/pro/[slug]/page.tsx |
| /services/surveyors | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/surveyors/page.tsx |
| /services/tradespeople | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/tradespeople/page.tsx |
| /services/tradespeople/[category]/[location] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/services/tradespeople/[category]/[location]/page.tsx |
| /session-expired | page | server | static candidate (automatic; build-unverified) | — | layout.tsx | src/app/session-expired/page.tsx |
| /settings | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/page.tsx |
| /settings/account | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/account/page.tsx |
| /settings/notifications | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/notifications/page.tsx |
| /settings/preferences | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/preferences/page.tsx |
| /settings/privacy | page | client | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/privacy/page.tsx |
| /settings/security | page | server | dynamic (request/auth, inherited) | (protected) | layout.tsx<br>(protected)/layout.tsx<br>(protected)/settings/layout.tsx | src/app/(protected)/settings/security/page.tsx |
| /signup | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/signup/page.tsx |
| /sitemap-page | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/sitemap-page/page.tsx |
| /sold-prices | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/sold-prices/page.tsx |
| /sold-prices/[area] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/sold-prices/[area]/page.tsx |
| /sold-prices/[area]/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/sold-prices/[area]/[slug]/page.tsx |
| /surveyors | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/surveyors/page.tsx |
| /surveyors/[slug] | page | server | dynamic path (automatic) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/surveyors/[slug]/page.tsx |
| /tools | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/page.tsx |
| /tools/affordability-calculator | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/affordability-calculator/page.tsx |
| /tools/buy-vs-rent-calculator | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/buy-vs-rent-calculator/page.tsx |
| /tools/energy-bill-estimator | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/energy-bill-estimator/page.tsx |
| /tools/first-time-buyer-guide | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/first-time-buyer-guide/page.tsx |
| /tools/mortgage-calculator | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/mortgage-calculator/page.tsx |
| /tools/mortgage-comparison | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/mortgage-comparison/page.tsx |
| /tools/moving-cost-estimator | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/moving-cost-estimator/page.tsx |
| /tools/portal-cost-calculator | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/portal-cost-calculator/page.tsx |
| /tools/remortgage-calculator | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/remortgage-calculator/page.tsx |
| /tools/rent-affordability-calculator | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/rent-affordability-calculator/page.tsx |
| /tools/rental-yield-calculator | page | client | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/rental-yield-calculator/page.tsx |
| /tools/renters-rights-checker | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/renters-rights-checker/page.tsx |
| /tools/stamp-duty-calculator | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/stamp-duty-calculator/page.tsx |
| /tools/true-equity-checker | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx<br>(main)/tools/layout.tsx | src/app/(main)/tools/true-equity-checker/page.tsx |
| /top-properties | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/top-properties/page.tsx |
| /top-properties/[slug] | page | server | static/ISR (explicit) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/top-properties/[slug]/page.tsx |
| /traders | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/traders/page.tsx |
| /two-factor | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/two-factor/page.tsx |
| /two-factor-setup | page | client | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/two-factor-setup/page.tsx |
| /unsubscribe | page | server | static candidate (automatic; build-unverified) | — | layout.tsx | src/app/unsubscribe/page.tsx |
| /valuation | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/valuation/page.tsx |
| /value-my-property | page | server | static candidate (automatic; build-unverified) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/page.tsx |
| /value-my-property/address | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/address/page.tsx |
| /value-my-property/details | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/details/page.tsx |
| /value-my-property/result/[valuationId] | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/result/[valuationId]/page.tsx |
| /value-my-property/result/[valuationId]/expert | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/result/[valuationId]/expert/page.tsx |
| /value-my-property/review | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/review/page.tsx |
| /value-my-property/verify-email | page | server | dynamic (request/auth, inherited) | (main) | layout.tsx<br>(main)/layout.tsx | src/app/(main)/value-my-property/verify-email/page.tsx |
| /verify-email | page | client | dynamic (request/auth, inherited) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/verify-email/page.tsx |
| /verify-email/confirmed | page | client | dynamic (request/auth, inherited) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/verify-email/confirmed/page.tsx |
| /welcome | page | server | static candidate (automatic; build-unverified) | (auth) | layout.tsx<br>(auth)/layout.tsx | src/app/(auth)/welcome/page.tsx |

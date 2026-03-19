# TODOs

## Wave 1 Pricing Foundation — Deferred TODOs

### Error logging in getUserEntitlements
**What:** Add error logging when the Supabase query in `getUserEntitlements` fails.
**Why:** Currently returns empty entitlements silently on DB errors — indistinguishable from "no subscription". A console.error or Sentry breadcrumb would make outages debuggable.
**Depends on:** Sentry integration (if available). Can use console.error as interim.
**Where to start:** `src/services/billing/entitlements-service.ts` — wrap the Supabase query in try/catch.

### Quota enforcement for feature limits
**What:** Add usage tracking + enforcement for quantitative limits (3 quotes/month, 25 listings, etc).
**Why:** Entitlements are currently boolean (has/doesn't have), not quantitative. The "3 quotes" in QUOTES_BASIC is display text only — nothing enforces the count.
**Depends on:** Quote and listing features being built. Requires a `usage_counts` table.
**Where to start:** Add `getFeatureLimit(planId, feature): number | 'unlimited'` to `plan-entitlements.ts`. Build enforcement layer when quote/listing features land.

### Env var rename coordination
**What:** Document the full old → new env var mapping for the plan ID rename.
**Why:** billing-config.ts changed env var names (STRIPE_AGENT_BASIC_PRICE_ID → STRIPE_AGENT_PERF_PRICE_ID, etc). All deployment environments need simultaneous update.
**Mapping:**
- `STRIPE_AGENT_BASIC_PRICE_ID` → `STRIPE_AGENT_PERF_PRICE_ID`
- `STRIPE_AGENT_BASIC_ANNUAL_PRICE_ID` → `STRIPE_AGENT_PERF_ANNUAL_PRICE_ID`
- `STRIPE_PROVIDER_STARTER_PRICE_ID` → `STRIPE_PROVIDER_MEMBER_PRICE_ID`
- `STRIPE_PROVIDER_STARTER_ANNUAL_PRICE_ID` → `STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID`
- `STRIPE_PROVIDER_GROWTH_PRICE_ID` → `STRIPE_PROVIDER_PRO_PRICE_ID`
- `STRIPE_PROVIDER_GROWTH_ANNUAL_PRICE_ID` → `STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID`
- NEW: `STRIPE_PROVIDER_ELITE_PRICE_ID`, `STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID`
**Where to start:** Update `.env.example`, Vercel project settings, and any staging env configs.

### Stripe $0 subscription manual verification
**What:** Manually verify in Stripe test mode that a £0 price ID creates a real subscription.
**Why:** The agent Performance plan is £0. If Stripe doesn't fire `checkout.session.completed` for $0, the user gets no subscription row and middleware blocks their dashboard.
**Verify:** (1) $0 checkout creates a subscription object, (2) webhook fires, (3) row created with status='active'.
**Depends on:** Stripe test mode price IDs being configured.

### /api/billing/plans response shape change
**What:** Document that the public `/api/billing/plans` API response changes with new plan names and prices.
**Why:** Any consumers of this API (future mobile app, external docs, partner integrations) need to handle the new plan structure.
**Where to start:** The endpoint auto-updates from PLANS_BY_ROLE — no code change needed. Document the breaking change in API changelog if one exists.

## Wave 2 Referral System — Deferred TODOs

### Stripe balance credit retry mechanism
**What:** Cron job or retry queue that picks up `referral_rewards` with `status='failed'` and retries Stripe `customer.balance_transactions` application.
**Why:** Critical gap from eng review — when Stripe balance API fails after reward row creation, credits are tracked but never applied. Users miss their discount silently.
**Effort:** M | **Priority:** P1
**Where to start:** Edge function or cron job querying `referral_rewards WHERE status = 'failed'`, retrying Stripe balance call, updating status on success.
**Depends on:** Wave 2 referral system being shipped.

### Referral analytics admin dashboard
**What:** Admin dashboard showing aggregate referral metrics (k-factor, conversion funnel, top referrers, reward costs).
**Why:** Without this, growth engine health is invisible. Current workaround: Supabase dashboard queries.
**Effort:** M | **Priority:** P2
**Where to start:** New admin page at `/admin/referrals` with server-side aggregation queries.

### Referral fraud detection cron
**What:** Automated weekly scan for referral rings (A→B→C→A), churn-and-rejoin patterns, and burst referrals from single IP.
**Why:** 3+3 verification is the main gate, but edge cases exist at scale.
**Effort:** M | **Priority:** P2
**Where to start:** Edge function or cron job querying referral patterns.

### Referral link click tracking
**What:** Redirect endpoint `/r/[code]` that logs clicks before redirecting to `/join?ref=[code]`.
**Why:** Dashboard shows referral stats but not link click counts. Needed for conversion funnel visibility.
**Effort:** S | **Priority:** P2
**Where to start:** Create redirect API route + `click_count` column on `referral_codes_v2`.

### Track B: Tradesperson-to-homeowner referrals
**What:** Second referral track where tradespeople share /hire/[slug] links and earn £25 per homeowner booking.
**Why:** Builds demand side of marketplace via existing member network.
**Effort:** L | **Priority:** P3
**Depends on:** Homeowner booking system being built.

### Partner tier revenue share payouts
**What:** Automated monthly payout of 5% revenue share to Partner tier members (10+ referrals).
**Why:** Revenue share is the top-tier incentive. Currently tracked but not paid out.
**Effort:** XL | **Priority:** P3
**Depends on:** Legal review, Stripe Connect or manual payout process, tax reporting.

### "Referred by" profile badge
**What:** Show "Referred by [Name]" on new member profiles with link to referrer's profile.
**Why:** Social proof + referrer recognition. Doc specifies this in Connector reward package.
**Effort:** S | **Priority:** P3
**Where to start:** Add `referred_by_display` column to profiles, render in profile page.

## Responsive Design System — Deferred TODOs

### Add `sizes` prop to all Next.js Image components
**What:** Audit ~20 files using `next/image` and add appropriate `sizes` prop for responsive image loading.
**Why:** Without `sizes`, images download full-resolution on mobile, wasting bandwidth and hurting LCP (Largest Contentful Paint). Example: a 1440px hero image downloaded on a 375px phone.
**Pattern:** `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"` — adjust per component.
**Effort:** M | **Priority:** P2
**Where to start:** `grep -r "from \"next/image\"" src/ --include="*.tsx" -l` to find all files.
**Depends on:** Nothing — can be done independently.

### Add Playwright viewport regression tests
**What:** E2E tests that load each dashboard role at 375px, 768px, and 1280px viewports. Assert: (a) no horizontal overflow, (b) navigation accessible, (c) main content visible and not obscured.
**Why:** Catches responsive regressions in CI. Without automated tests, mobile breakage is only caught by manual QA.
**Effort:** M | **Priority:** P1
**Where to start:** Install Playwright, create `e2e/responsive/` test directory. One test per dashboard role × 3 viewports.
**Depends on:** Playwright being installed (currently planned but not set up).

### Migrate existing pages to Container component
**What:** Replace ad-hoc `px-4 sm:px-6 lg:px-8` + `max-w-*` + `mx-auto` patterns with `<Container>` component across ~30 pages.
**Why:** DRY — Container enforces consistent responsive padding. Currently 30+ pages each define their own padding.
**Effort:** L | **Priority:** P2
**Where to start:** `grep -r "mx-auto.*max-w" src/app/ --include="*.tsx" -l` to find candidates.
**Depends on:** Container component from responsive design system (now built).

### Add container query support to Card components
**What:** Use Tailwind v4 `@container` to make Cards adapt to their container width, not viewport width.
**Why:** A Card in a 2-col grid at 1280px should behave like a Card on a 640px viewport. Currently all Cards use viewport breakpoints, so Cards in narrow containers look cramped.
**Effort:** M | **Priority:** P3
**Where to start:** Add `@container` to Card parent, use `@sm:`, `@md:` etc. in Card component.
**Depends on:** Responsive design system + Tailwind v4 container query setup.

### Swipe-to-navigate mobile dashboard tabs (vision)
**What:** Swipe left/right to move between dashboard tabs (Overview → Listings → Viewings).
**Why:** Makes the app feel native on mobile. Like iOS tab swiping.
**Effort:** M | **Priority:** P3
**Where to start:** Use gesture library (e.g., `@use-gesture/react`) on dashboard wrapper.
**Depends on:** Responsive sidebar system (now built).

### Responsive morphing stat cards (vision)
**What:** Dashboard stat cards that morph on mobile: Desktop shows grid with icon + label + value + sparkline. Mobile shows horizontal scroll strip with value + mini label.
**Why:** Users see more data in less space on mobile. Swipeable horizontal scroll feels native.
**Effort:** M | **Priority:** P3
**Where to start:** New `ResponsiveStatCard` component wrapping existing `StatCard`.
**Depends on:** Responsive design system.

### Haptic feedback on mobile interactions (vision)
**What:** Subtle vibration via `navigator.vibrate(10)` on key interactions: nav taps, sidebar toggle, form submit.
**Why:** Makes the web app feel native. Progressive enhancement — no-op on unsupported browsers.
**Effort:** S | **Priority:** P3
**Where to start:** Create `useHaptics()` hook, apply to BottomTabBar and ResponsiveSidebar.
**Depends on:** Nothing.

### Responsive empty states (vision)
**What:** Mobile-optimized empty state illustrations + CTAs that fill the screen when a dashboard section has no data.
**Why:** Current empty states show a small centered message. On mobile, full-screen empty states feel intentional, not broken.
**Effort:** M | **Priority:** P3
**Where to start:** Create `<EmptyState>` component with responsive illustration sizing.
**Depends on:** Nothing — can be done independently.

## Backend Blueprint v2 — Eng Review Additions

_From engineering plan review, 2026-03-19. 14 decisions locked._

### pgvector embedding pipeline for semantic property similarity
**What:** Build property embedding generation (Claude API call per listing), add vector column to properties/search_listings, create backfill job for existing listings, add Inngest function for incremental embedding on listing create/update, implement pgvector similarity query (`ORDER BY embedding <=> query_embedding LIMIT N`).
**Why:** Current SimilarProperties uses heuristic (postcode + ±20% price range). pgvector gives true semantic matching — "properties like this" based on description, features, and structured attributes. Zillow uses embeddings for their similar homes feature.
**Effort:** L | **Priority:** P2
**Depends on:** AI budget approval for embedding costs (~$0.01 per listing via Claude Haiku).
**Where to start:** Add `embedding vector(1536)` column to search_listings MV. Create `src/services/ai/embedding-service.ts`. Backfill via Inngest batch job.

### Stripe webhook handler DRY refactor
**What:** Extract duplicated subscription upsert logic (identical between `checkout.session.completed` and `customer.subscription.updated` handlers) into `upsertSubscription()` helper. Extract referral conversion block (~150 lines) into `processReferralConversion()`. Reduce webhook from 605 lines to ~300.
**Why:** Two copies of the same upsert means bugs must be fixed in two places. The referral block is deeply nested and hard to test independently.
**Effort:** M | **Priority:** P2
**Depends on:** Nothing — pure refactor.
**Where to start:** `src/app/api/webhooks/stripe/route.ts`. Extract helpers into `src/services/billing/webhook-handlers.ts`.

### Edge-case tests for backend blueprint features (10 branches)
**What:** Write tests for: (b) stale JWT claims race condition, (g) LLM input exceeds max length, (h) control chars in JSON-embedded strings, (m) instant search query < 2 chars, (n) instant search Redis unavailable fallback, (o) instant search DB timeout, (r) price drop with no matching saved searches, (s) price drop email send failure, (t) large result set batching (1000+ drops), (x) Inngest unavailable during webhook DLQ emit.
**Why:** 12 critical tests are in the blueprint build. These 10 edge cases are lower risk but increase coverage.
**Effort:** S | **Priority:** P2
**Where to start:** `src/__tests__/backend-blueprint/` — extend existing test files with additional cases.

### JWT claims Sentry Performance integration
**What:** When Sentry Performance is set up, add tracing spans for: JWT hook execution time, claims-present ratio in middleware, fallback-to-DB rate. Create alert for fallback rate > 10%.
**Why:** The jwt_claims_errors table + Inngest monitor catches hard failures. Sentry catches degradation (e.g., hook is slow, or claims are present but stale).
**Effort:** S | **Priority:** P1
**Depends on:** Sentry Performance setup (separate P1 TODO in blueprint v1).
**Where to start:** Add `Sentry.startSpan()` in middleware JWT decode path. Track `claims_present` vs `claims_missing` as custom metrics.

### Remaining 12 Inngest functions
**What:** Build these Inngest functions incrementally (3-4 per sprint):
- **Billing:** cache-invalidation-on-mutation, webhook-retry-monitor
- **Search:** cache-warming-popular-prefixes, search-analytics-rollup
- **Compliance:** compliance-reminder-checker, stale-listing-cleanup
- **Notifications:** email-digest-weekly, booking-reminders, quote-expiry-checker
- **Analytics:** analytics-aggregation-daily
- **Security:** referral-fraud-scan-weekly
- **Data:** MV-refresh-backup (fallback if pg_cron fails)
**Why:** Event-driven architecture decouples services, enables retry/replay, and makes the system observable. Currently 4 functions (rfq-notify, price-drop, webhook-dlq, jwt-monitor).
**Effort:** L (total) | **Priority:** P1 (incremental)
**Where to start:** `src/inngest/functions/` — start with cache-invalidation-on-mutation and stale-listing-cleanup as they have the most immediate value.

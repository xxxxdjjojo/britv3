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

## Launch Readiness — Deferred TODOs

### Analytics event taxonomy document
**What:** Map all business-critical events to PostHog event names with required properties.
**Why:** Prevents event name drift across developers. Without this, analytics data is inconsistent.
**Effort:** S | **Priority:** P1
**Where to start:** Create `docs/analytics-event-taxonomy.md` with event name, properties, trigger location.

### Sentry error capture verification
**What:** Confirm Sentry DSN is configured, errors are captured, source maps uploaded.
**Why:** Sentry is installed but unverified. Errors may be silently lost.
**Effort:** S | **Priority:** P2
**Where to start:** Throw a test error, check Sentry dashboard. Verify `SENTRY_DSN` in env.

### Operational runbooks
**What:** Runbooks for Redis outage, Supabase outage, PostHog outage.
**Why:** First incident response will be faster with documented procedures.
**Effort:** S | **Priority:** P2
**Where to start:** Create `docs/runbooks/` with one markdown file per scenario.

### Performance budget enforcement
**What:** Set Lighthouse CI budgets per route (LCP < 2.5s, CLS < 0.1, INP < 200ms).
**Why:** Prevents performance regressions from slipping in via PRs.
**Effort:** M | **Priority:** P2
**Depends on:** Wave 5 client→server conversion (need post-conversion baseline).

### WCAG 2.2 AA formal audit
**What:** Full axe-core + manual audit, update accessibility statement page.
**Why:** Legal compliance under Equality Act 2010. Self-assessment is insufficient.
**Effort:** M | **Priority:** P2
**Depends on:** All a11y fixes from Wave 2.

### SEO preview cards in admin
**What:** Live preview of Google/social card appearance when editing pages.
**Why:** Content creators can't see how their pages appear in search results.
**Effort:** S | **Priority:** P3 (vision)

### Accessibility badge in footer
**What:** "Built to WCAG 2.2 AA" badge linking to accessibility statement.
**Why:** Trust signal for accessibility-conscious users.
**Effort:** S | **Priority:** P3 (vision)
**Depends on:** Formal a11y audit passing.

### Visual regression testing
**What:** Playwright screenshot comparison on PRs for key pages.
**Why:** Catches unintended visual changes from CSS/component refactors.
**Effort:** M | **Priority:** P2
**Depends on:** Stable visual baseline after all fixes.

### Error page polish verification
**What:** Verify Phase 21 error pages meet launch quality bar.
**Why:** Error pages are brand touchpoints — should feel crafted.
**Effort:** S | **Priority:** P3

## Services Hub — Deferred TODOs

### Shared service categories constant (DRY)
**What:** Extract category data (label, href, icon, description, count) into `src/lib/providers/service-categories.ts` shared by homepage, `/services`, and search pages.
**Why:** Currently duplicated in 3 places — homepage `SERVICE_CATEGORIES`, services page `POPULAR_CATEGORIES`, tradespeople page `TRADESPERSON_CATEGORIES`.
**Effort:** S | **Priority:** P2
**Where to start:** Create shared constant, update 3 consumers.

### Reusable HowItWorks component
**What:** Extract the 3-step "How It Works" pattern into a shared `<HowItWorksSection steps={[...]} />` component.
**Why:** Homepage and services page both have 3-step flows with identical layout. Currently duplicated markup.
**Effort:** S | **Priority:** P2
**Where to start:** Create `src/components/shared/HowItWorksSection.tsx`, update both pages.

### Live search autocomplete on services search bar
**What:** Add typeahead/autocomplete to the services search bar — suggest categories and locations as user types.
**Why:** Reduces friction, prevents "0 results" dead ends from typos.
**Effort:** M | **Priority:** P2
**Depends on:** Services hub page being built (done).
**Where to start:** Add combobox with static category list, later add Supabase full-text search for locations.

### Dynamic category ordering by click popularity
**What:** Use PostHog event data to reorder category cards — most-clicked categories appear first.
**Why:** Self-optimizing UX, seasonal adaptation (boiler repair rises in winter).
**Effort:** M | **Priority:** P3
**Depends on:** PostHog events collecting sufficient data.

### Seasonal category badge
**What:** "Popular this month" chip on top 2 most-requested categories.
**Why:** Social proof + urgency signal.
**Effort:** S | **Priority:** P3

### Scroll-snap carousel with dot indicators
**What:** Add dot position indicators to the mobile pro carousel + scroll-snap physics.
**Why:** Better touch UX — users know how many cards exist and where they are.
**Effort:** S | **Priority:** P3

### Provider availability indicator
**What:** "Open now" green dot on providers currently accepting quotes.
**Why:** Real-time signal reduces friction — users know the provider is responsive.
**Effort:** M | **Priority:** P3
**Depends on:** Provider availability/status feature being built.

## Dashboard Demo Data & Testing System — CEO Review TODOs

_From CEO plan review, 2026-03-21. EXPANSION mode. 11 items._

### Install and configure Playwright for E2E testing
**What:** Add `@playwright/test` to devDependencies, create `playwright.config.ts` with baseURL, auth setup, and screenshot config. Add `pnpm test:e2e` script to package.json.
**Why:** Required foundation for all 8 E2E dashboard scenarios and screenshot automation. Currently "planned but not installed."
**Effort:** S | **Priority:** P1
**Depends on:** Nothing.
**Where to start:** `cd britv3.0 && pnpm add -D @playwright/test && npx playwright install`

### Post-seed verification SQL script
**What:** `supabase/seed/verify.sql` that runs `SELECT COUNT(*)` on every seeded table, then queries AS each demo user (via `SET LOCAL role`) to verify RLS allows the expected rows.
**Why:** Without this, seed data can silently fail — you INSERT rows but RLS hides them. This is the exact problem currently plaguing all dashboards. The verification script catches "data exists but is invisible" before you waste time debugging UI.
**Effort:** S | **Priority:** P1
**Depends on:** Seed SQL files being written.
**Where to start:** Create `supabase/seed/verify.sql`. For each demo user UUID, run: `SET LOCAL role 'authenticated'; SET LOCAL request.jwt.claims = '{"sub":"<uuid>"}'; SELECT COUNT(*) FROM listings;`

### Merge unmerged dashboard feature branches to main
**What:** Merge 5 feature branches to main: `feature/15-estate-agent-dashboard` (78 files, 13K lines), `feature/phase-16-tradesperson-dashboard` (25+ pages), `feature/buyer-renter-dashboard` (viewings/offers/docs), `feature/phase-18-payments-billing` (billing flows), `feature/phase-19-account-settings` (settings pages).
**Why:** Seed data populates tables that these branches' services query. If the dashboard code isn't on main, seed data is useless — the pages that would show the data don't exist in the deployed app. This is a hard prerequisite.
**Effort:** L (conflict resolution across 5 branches) | **Priority:** P1
**Depends on:** Code review of each branch.
**Where to start:** Merge in dependency order: buyer-renter first (lowest conflict risk), then agent, then provider, then payments, then settings.

### Demo mode UI banner
**What:** Dismissible banner at top of dashboards: "You are viewing sample data. Add your first property to see real data." Controlled by `NEXT_PUBLIC_DEMO_MODE` env var. Component: `src/components/demo/DemoBanner.tsx`.
**Why:** Without this, users and demo audiences can't distinguish sample data from real data. Prevents confusion during estate agent demos and video recordings.
**Effort:** S | **Priority:** P2
**Depends on:** Seed data being in place.
**Where to start:** Create `src/components/demo/DemoBanner.tsx`, add to dashboard layouts. Check `process.env.NEXT_PUBLIC_DEMO_MODE === 'true'`.

### Seed data cleanup script
**What:** `supabase/seed/cleanup.sql` that DELETEs all rows associated with demo user UUIDs. Uses cascading deletes via FK relationships. One command to remove all demo data without dropping the database.
**Why:** When done demoing or need to reset to clean state, this is the safe way to remove demo data. Alternative (`supabase db reset`) wipes everything including real data.
**Effort:** S | **Priority:** P2
**Depends on:** Seed SQL files with known demo UUIDs.
**Where to start:** DELETE FROM auth.users WHERE id IN ('11111111-...', '22222222-...', ...); — FKs cascade.

### CI pipeline: seed validation after migrations
**What:** GitHub Action that spins up Supabase local (`supabase start`), runs all migrations, runs seed SQL, then runs `verify.sql`. Fails CI if any seed INSERT errors or verification counts are zero.
**Why:** Without this, a migration that renames a column silently breaks seed data. You discover it only when someone tries to demo — likely at the worst possible time.
**Effort:** M | **Priority:** P2
**Depends on:** Seed SQL + verify.sql being written, Supabase CLI in CI.
**Where to start:** `.github/workflows/seed-check.yml`. Use `supabase/setup-cli` action.

### Coherent property story in seed data
**What:** Design seed data as a narrative: "12 Kensington Gardens" listed by Agent Sarah → 3 viewings booked → 2 offers received → "under offer". Buyer James saved it, booked viewing, made winning offer. Provider Mike quoted for a boiler repair at the property.
**Why:** During estate agent demos, the data makes sense as a realistic property journey. Random disconnected data looks like test noise. A coherent story makes the platform feel real and demonstrates the full value chain.
**Effort:** S (thoughtful data design, not extra code) | **Priority:** P2
**Where to start:** Map the story BEFORE writing SQL. Define characters (7 demo users with names/roles), properties (5-6 with addresses), and the relationships between them.

### Real UK property photos for demo
**What:** Source 20-30 royalty-free UK property images from Unsplash/Pexels. Store in `public/images/demo/`. Update seed SQL `property_media` URLs to reference these images.
**Why:** Current seed references `/images/properties/property-1.jpg` which 404s. Broken image placeholders make dashboards look broken, not empty. Real photos make screenshots and videos look professional.
**Effort:** S | **Priority:** P1
**Where to start:** Search Unsplash for "UK house exterior", "London flat interior", "Victorian terrace". Download 4-5 per property (exterior, kitchen, bedroom, bathroom, garden).

### One-command screenshot pipeline
**What:** Playwright script (`e2e/screenshots/capture-all.spec.ts`) that logs in as each role, navigates to dashboard home + 2-3 key pages, captures high-res screenshots. Output: `e2e/screenshots/output/agent-dashboard.png`, etc.
**Why:** Every UI update, run one command and get fresh screenshots for website, pitch deck, and social media. No more manual screenshotting. Reuses E2E test infrastructure.
**Effort:** M | **Priority:** P2
**Depends on:** Playwright installed, seed data in place, E2E auth setup.
**Where to start:** Create `e2e/screenshots/capture-all.spec.ts`. Loop through demo users, navigate to key pages, `page.screenshot({ fullPage: true })`.

### Demo role switcher (floating button)
**What:** Floating button (bottom-right, only when `NEXT_PUBLIC_DEMO_MODE=true`) showing current role + dropdown to instantly switch between demo users. Calls `supabase.auth.signInWithPassword()` with the selected demo user's credentials.
**Why:** During live demos or video recordings, switching roles is: logout → login → enter credentials → navigate. The switcher makes it instant — one click to see the platform from any role's perspective.
**Effort:** M | **Priority:** P3
**Depends on:** Demo mode env var, demo user credentials constants.
**Where to start:** `src/components/demo/DemoRoleSwitcher.tsx`. Import demo user credentials from shared constants.

### Time-series analytics seed data
**What:** Use SQL `generate_series` to create 30 days of realistic daily_views, click_through_rate, and enquiry counts for property analytics. Use `sin()` + `random()` for realistic-looking trends (weekday peaks, weekend dips).
**Why:** Agent and seller dashboards have Recharts chart components that show flat lines or nothing with no data. 30 days of trending data makes analytics pages look like an active, live platform.
**Effort:** S | **Priority:** P2
**Depends on:** Properties and listings being seeded first.
**Where to start:** Add to `supabase/seed/05_seller_data.sql` or `03_agent_data.sql`. Use: `generate_series(CURRENT_DATE - 30, CURRENT_DATE, '1 day') AS d`.

## Navigation Architecture — Deferred TODOs

_From CEO plan review, 2026-03-21. 7 items._

### CMS-driven navigation editing
**What:** Admin dashboard page where navigation items can be reordered, added, or removed without code deploys.
**Why:** Currently navigation is defined in static TypeScript config (navigation.ts). Content/marketing teams need to update nav without engineering.
**Effort:** XL | **Priority:** P3
**Where to start:** Create `navigation_items` Supabase table, admin CRUD UI at `/admin/navigation`, API endpoint to serve dynamic config.
**Depends on:** Admin dashboard (Phase 20).

### Personalized navigation from PostHog behavioral data
**What:** Mega-menus surface most-clicked items per role (e.g., landlords see "Compliance" promoted in dropdown).
**Why:** Generic nav treats all users the same. Personalization increases engagement with relevant features.
**Effort:** L | **Priority:** P3
**Where to start:** PostHog event query for top nav clicks per role, override mechanism in navigation config, A/B test framework.
**Depends on:** PostHog analytics data accumulation (30+ days of usage).

### AI-powered command palette natural language search
**What:** Instead of fuzzy matching route names, users type "find me a plumber near Camden" and Claude interprets intent.
**Why:** Natural language removes the need to know exact page names. Differentiator vs all competitors.
**Effort:** L | **Priority:** P3
**Where to start:** Add Claude API call in CommandPalette search path, intent classification for property search vs service search vs tool search.
**Depends on:** Command palette (now built), Claude API integration.

### Recently viewed properties in mega-menu
**What:** When user hovers "Buy" dropdown, show their last 3 viewed properties with thumbnails in a sidebar panel.
**Why:** Makes navigation feel alive and personal, like Amazon's "Recently Viewed".
**Effort:** S | **Priority:** P3
**Where to start:** Track views in localStorage or Supabase, add panel to MegaMenu Buy/Rent sections.
**Depends on:** Property detail pages, view tracking.

### Keyboard shortcut navigation (G+B, G+R, etc.)
**What:** Two-key shortcuts: G then B = Go to Buy, G then R = Go to Rent, G then S = Go to Services, etc. With visible hint labels in mega-menu.
**Why:** Power users (agents, landlords) who use the platform daily benefit from keyboard-first navigation. Linear and Figma do this.
**Effort:** M | **Priority:** P3
**Where to start:** Create `useKeyboardShortcuts()` hook with chord detection, add kbd hint components to MegaMenu items.
**Depends on:** MegaMenu (now built).

### Geo-dynamic footer area links
**What:** If geolocation available, replace static "Popular Areas" footer column with areas near the user's location.
**Why:** Increases relevance of footer links. User in Manchester sees Manchester areas, not London.
**Effort:** S | **Priority:** P3
**Where to start:** Geolocation API + area slug mapping, client component island in Footer for dynamic column.
**Depends on:** Area guides data, geolocation permission UX.

### Navigation debug overlay (?debug=nav)
**What:** Hidden mode that overlays link targets on the page, showing href values next to each navigation link. Triggered by query param.
**Why:** Useful for QA teams and content managers verifying link integrity after nav changes.
**Effort:** S | **Priority:** P3
**Where to start:** Create `NavDebugOverlay` component that reads all `<a>` tags and overlays their href. Mount conditionally on `?debug=nav`.
**Depends on:** Nothing.

## Agent Dashboard Enhancements — CEO Review TODOs

_From CEO plan review, 2026-03-22. EXPANSION mode. 12 items (10 TODOs + 2 build-now)._

### Extract shared compliance service from landlord module
**What:** Move `compliance-service.ts` from `src/services/landlord/` to `src/services/shared/compliance-service.ts`. Update landlord imports. Add agent-compatible interface.
**Why:** Bridge model (agent_managed_properties) means agents need compliance data. Currently landlord-only. DRY violation if duplicated.
**Effort:** M | **Priority:** P1
**Depends on:** Nothing.
**Where to start:** Copy service, update imports in landlord dashboard, add SupabaseClient parameter pattern matching existing agent services.

### Extract shared maintenance service from landlord module
**What:** Move `maintenance-service.ts` from `src/services/landlord/` to `src/services/shared/maintenance-service.ts`. Same pattern as compliance extraction.
**Why:** Agents managing lettings need maintenance workflows. Same service, different RLS context.
**Effort:** M | **Priority:** P1
**Depends on:** Nothing.
**Where to start:** Same pattern as compliance extraction. Both can be done in one PR.

### Extract AI description service to shared
**What:** Move `ai-description-service.ts` from `src/services/seller/` to `src/services/shared/ai-description-service.ts`. Add agent-specific tone options.
**Why:** Research: 'AI descriptions save 20-30 min per listing, perceived as magic.' Currently seller-only. Agents create more listings than sellers.
**Effort:** S | **Priority:** P2
**Depends on:** Nothing.
**Where to start:** Move file, update seller imports, add `tone: 'professional' | 'luxury' | 'friendly'` parameter for agent use.

### Build agent_managed_properties bridge table migration
**What:** Create Supabase migration for `agent_managed_properties` table (agent_id, property_id, landlord_id, management_type, fee_percentage, started_at, ended_at). Add agent-aware RLS policies to `compliance_certificates`, `rent_payments`, `maintenance_requests`, `tenancies` — OR clauses allowing agents with active management agreements to read/write.
**Why:** Foundation for ALL lettings features. Bridge model chosen over separate tables to maintain single source of truth. CRITICAL: without agent-aware RLS, compliance queries return empty results silently (Section 2 GAP 1).
**Effort:** M | **Priority:** P1
**Depends on:** Nothing. This is the FIRST migration to write.
**Where to start:** `supabase/migrations/YYYYMMDD_agent_managed_properties.sql`. Schema: agent_id FK → agent_profiles, property_id FK → properties, landlord_id FK → landlord_profiles, management_type ENUM ('full', 'lettings_only', 'rent_collect'), fee_percentage DECIMAL. RLS: landlord-only write on management_type.

### Build AI suggestions engine (Inngest + Claude)
**What:** Create `src/services/agent/agent-ai-service.ts`, `agent_ai_suggestions` table, and Inngest `ai-suggestions-compute` function. Hybrid compute: nightly batch + event-triggered recompute on critical events (new offer, chain break, arrears > 7 days). Claude Haiku for cost efficiency (~$0.02/agent/day). Validate all entity IDs against DB before writing suggestions.
**Why:** The "3 things to do now" is the #1 differentiator from research. All 3 personas ranked AI-prioritised actions as Critical or High. Pre-computed for sub-100ms dashboard reads.
**Effort:** L | **Priority:** P1
**Depends on:** Bridge table (lettings suggestions need arrears/compliance data), Inngest setup.
**Where to start:** Design prompt template that takes agent's leads, listings, sales, compliance alerts, and arrears as context. Output: JSON array of 3 suggestions with action_type, entity_id, urgency, message. Store in `agent_ai_suggestions` with `computed_at` timestamp.

### Build comms timeline (V1 — manual logging)
**What:** Create `comms_timeline` table + `src/services/agent/agent-comms-service.ts` + unified timeline UI on contact/property detail pages. V1: manual logging — agent taps 'Log call', 'Log WhatsApp', 'Log email' and records metadata (timestamp, channel, direction, contact_id, subject) + optional body (opt-in per message for GDPR compliance).
**Why:** Centralised comms was called "the holy grail" by Marcus. Foundation for WhatsApp Business API V2. Even manual logging gives agents one timeline per contact — currently scattered across WhatsApp, Outlook, and phone notes.
**Effort:** M | **Priority:** P1
**Depends on:** Nothing.
**Where to start:** Migration: `comms_timeline` table with columns: id, agent_id, contact_id, property_id (nullable), channel ENUM ('phone', 'whatsapp', 'email', 'sms', 'in_person'), direction ENUM ('inbound', 'outbound'), subject, body (nullable), created_at. RLS: agent_id = auth.uid().

### Smart viewing diary clustering / route optimization
**What:** Add route optimization layer to `ViewingCalendar.tsx`. Use MapTiler geocoding (already in stack) to get lat/lng per viewing property, cluster by proximity using haversine distance, generate optimized route order, show Google Maps link with waypoints.
**Why:** Jade: "AI schedules viewings based on location clustering so I'm not driving back and forth." Saves fuel and time. Feels genuinely futuristic.
**Effort:** M | **Priority:** P2
**Depends on:** Property geocoding data (lat/lng on properties table — check if exists).
**Where to start:** `src/services/agent/agent-viewing-service.ts` — add `optimizeViewingRoute(viewingIds: string[])` that geocodes, sorts by nearest-neighbor, returns ordered list + Maps URL.

### Listing health scoring (Inngest daily function)
**What:** Build `listing-health-scorer` Inngest function that computes daily health scores per listing (green/amber/red) based on views vs comparable properties, days on market, enquiry rate. Store scores in `listing_health_scores` table. Surface as traffic-light indicators on ActiveListings page and dashboard home.
**Why:** Jade: "traffic-light indicators for each active listing: green (performing well), amber (needs attention), red (stale)." Proactive stock management instead of reactive.
**Effort:** M | **Priority:** P2
**Depends on:** Listing analytics data (partially exists in ListingAnalyticsCharts).
**Where to start:** Define thresholds: green = views above area median, amber = 20-50% below, red = 50%+ below or 21+ days with no viewings.

### Morning briefing email (delight)
**What:** 7am Inngest cron → Resend email with: today's 3 AI priorities, today's diary summary, weather for outdoor viewings (OpenWeatherMap API — free tier), motivational stat. React Email template.
**Why:** Makes agents feel the CRM is working FOR them before they even open it. Low effort, high perceived value.
**Effort:** S | **Priority:** P3 (vision/delight)
**Depends on:** AI suggestions engine, Resend integration.
**Where to start:** Inngest cron at 7am UK time. Query agent_ai_suggestions + today's viewings. Render React Email template. Send via Resend.

### Hot lead "Ready to offer" badges (delight)
**What:** On LeadPipelineKanban, show flame badge + "Ready to offer" label when applicant has 3+ viewings with interest_level >= 4. Pure frontend conditional rendering on LeadCard.tsx.
**Why:** Makes the Kanban feel alive. Agents instantly see which leads are closest to converting.
**Effort:** S | **Priority:** P3 (vision/delight)
**Depends on:** Viewing feedback data linked to leads.
**Where to start:** `src/components/dashboard/agent/leads/LeadCard.tsx` — add conditional Badge.

### Stale listing amber glow (delight)
**What:** Listing cards get amber border-glow CSS + tooltip when views decline 40%+ week-over-week. Tooltip suggests: "Refresh photos, reduce price, or boost on portal."
**Why:** Visual nudge for underperforming stock. Agents often miss declining listings until it's too late.
**Effort:** S | **Priority:** P3 (vision/delight)
**Depends on:** Listing health scoring (TODO above).
**Where to start:** `src/components/dashboard/agent/listings/ActiveListings.tsx` — conditional className + Tooltip.

### Voice-to-CRM viewing notes (delight)
**What:** Mic icon on ViewingFeedbackForm. Agent records 30-second voice note. Web Speech API transcribes. Claude extracts structured fields (interest_level, price_opinion, notes) and pre-fills form.
**Why:** Jade: "I take notes on my phone during a viewing, then re-type them into Alto when I get home." Eliminates the phone-to-laptop context switch.
**Effort:** M | **Priority:** P3 (vision/delight)
**Depends on:** AI service, ViewingFeedbackForm (already built).
**Where to start:** Add `useVoiceRecorder()` hook with Web Speech API. Send transcript to Claude for structured extraction. Pre-fill form fields.

### One-click "confirm all tomorrow's viewings" (delight)
**What:** Button on dashboard home that batch-sends confirmation emails to all viewers for next day's viewings. Query tomorrow's viewings, iterate, send via Resend with property details + time + address.
**Why:** All 3 research personas identified this as a desired one-click action. Currently agents send confirmations individually.
**Effort:** S | **Priority:** P3 (vision/delight)
**Depends on:** Viewing data, Resend email templates.
**Where to start:** Add button to AgentDashboardHome. API route `/api/agent/confirm-viewings` that queries tomorrow's viewings and batch-sends.

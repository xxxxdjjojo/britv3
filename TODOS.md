# TODOS — Britestate v3.0

> Items identified during CEO plan reviews and development sessions.
> Format: Priority (P1/P2/P3), Effort (S/M/L/XL), Status.

---

## Property Detail Pages (Phase 5.x)

### P1 — Smart Commute Calculator
**What:** User inputs workplace postcode on property detail page → system returns personalised commute times (walk/cycle/bus/rail/drive) from that property to their office. Cached per `(property_id, destination_postcode)` pair.
**Why:** Generic "nearest stations" is table stakes on every portal. Personalised commute is the feature buyers screenshot and send to their partner. True differentiator vs Rightmove/Zoopla.
**Pros:** Single most-impactful missing feature for buyer decision-making. High virality (shareable result).
**Cons:** Requires new API integration (TfL Journey Planner API for London / Google Maps Distance Matrix for rest of UK). Extra API key + cost management.
**Context:** Property detail transport section (5.7) shows generic nearest stations. This replaces/augments it with personalised results. Input is a postcode search box. Results cache to Redis with 7-day TTL.
**Effort:** M
**Priority:** P1
**Depends on:** Property detail core page (5.1–5.25) complete, Redis caching layer active.

---

### ~~P2 — ROI Nightly Pre-computation~~ BUILDING IN THIS PHASE
~~Moved to in-scope during plan-eng-review 2026-03-15. Building as `supabase/functions/nightly-roi-precompute/` with pg_cron trigger at 02:00 UTC.~~

---

### P2 — Renovation Benchmarks Data Pipeline
**What:** Quarterly process to update the `renovation_type_benchmarks` seed table with fresh regional cost/value-uplift data. Sources: RICS Surveying Data, Homebuilding & Renovating surveys, government construction cost indices.
**Why:** The ROI calculator accuracy degrades within 6 months — construction costs are highly volatile (see 2021–2023 materials crisis). Stale benchmarks erode user trust.
**Pros:** Maintains accuracy of the ROI differentiator feature. Add a visible "Benchmarks last updated: [date]" disclosure to the ROI panel.
**Cons:** Manual quarterly effort. Need to define the data sources clearly and maintain a refresh script.
**Context:** `renovation_type_benchmarks` table stores `{type, region, cost_low_psqm, cost_high_psqm, value_uplift_pct_low, value_uplift_pct_high}`. Schedule first refresh ~3 months post-launch.
**Effort:** S per refresh, M to build the pipeline initially
**Priority:** P2
**Depends on:** `renovation_type_benchmarks` table seeded with initial data, ROI feature live.

---

### P2 — Neighbourhood Vibe Score (AI Area Personality)
**What:** Single Claude prompt fed area stats (crime rate vs city avg, coffee shops vs chains ratio, avg commute time, price trend vs city) → outputs a 2-sentence personality paragraph for the Map & Local Area section.
**Example output:** "Clifton BS8 is a young-professional enclave: independent coffee shops outnumber chains 3:1, average commute to Bristol Temple Meads is 12 minutes, and prices have outperformed the city average for 8 of the last 10 years."
**Why:** Buyers make emotional decisions. Zoopla has raw statistics. Britestate has a story that converts.
**Pros:** ~30 min implementation after area data layer is built. High emotional impact relative to tiny effort.
**Cons:** AI-generated text can feel generic. Must show "AI-generated area summary" disclosure. Requires human review process for edge cases (deprived areas where positive framing is tone-deaf).
**Context:** Uses data already fetched for other area widgets (crime, transport, price history). Cache in Redis with 7-day TTL. Add a `[flag as inaccurate]` link for community trust.
**Effort:** S
**Priority:** P2
**Depends on:** Area data layer (5.6–5.15 widgets) complete.

---

### P2 — Property Comparison Tool
**What:** Side-by-side comparison of 2–3 saved properties across all metrics: price, price per sqft, EPC rating, commute time (personalised if set), school ratings, ROI estimate, flood risk, council tax band, broadband speed.
**Why:** The ROI data becomes 10x more valuable when buyers can compare "Victorian terrace in Clifton vs new build in Redland — which is the better investment?" This is the feature that drives daily active use and word-of-mouth.
**Pros:** Creates a uniquely sticky feature. Drives account creation (must be logged in to compare). Surfaces ROI intelligence in a competitive context.
**Cons:** Significant UI work — responsive comparison table with all 25+ data points. Requires all property detail data to be structured consistently.
**Context:** Accessible from saved properties dashboard. User selects 2–3 properties to compare. **Note:** The `property_insights` DB table was dropped in favour of Redis-only caching (plan-eng-review 2026-03-15); comparison queries should pull from Redis cache or re-fetch on demand rather than relying on a persistent DB table.
**Effort:** L
**Priority:** P2
**Depends on:** Property detail pages complete, `property_insights` table populated.

---

### P2 — Automated Gallery Photo Labeling
**What:** At listing-upload time, call Claude Vision (or a dedicated image classification model) to label each photo: 'kitchen', 'master_bedroom', 'garden', 'bathroom', 'living_room', etc. Store label in `property_media.ai_label`. Render labels on gallery thumbnails in `HeroGallery`.
**Why:** Buyers browse by room, not by photo order. Labeled thumbnails let buyers jump to "show me the kitchen" without scrolling 12 photos. Direct engagement uplift.
**Pros:** High UX impact relative to small effort. Data already flows through the media upload pipeline. Labels also enable filtered gallery view ("All kitchens") across similar properties.
**Cons:** Requires a vision-capable model call per photo at upload time (not per page view — amortised cost). Need a fallback for photos that can't be classified confidently (label = null, no badge shown).
**Context:** Add `ai_label TEXT` column to `property_media` table. Call classification in `services/listings/media-service.ts` after Supabase Storage upload. Cache labels in DB (permanent, not TTL'd). Render in `PropertyGallery.tsx` thumbnail strip.
**Effort:** M
**Priority:** P2
**Depends on:** Property detail pages (5.1–5.25) shipped, media-service.ts upload flow stable.

---

## Auth & Onboarding (Phase 3 — CEO Review 2026-03-15)

### P1 — Extract Role Assignment into role-service.ts
**What:** Create `src/services/auth/role-service.ts` with a single `assignRole(userId, role)` function that upserts `user_roles` and updates `profiles.active_role`. Replace the three scattered implementations in `RegisterForm`, `auth/callback/route.ts`, and `register/role-select/page.tsx`.
**Why:** Role logic in 3 files creates the `/signup` bug, OAuth default-role bug, and risk of duplicate `user_roles` rows. Root cause of multiple Phase 3 flow failures.
**How to apply:** All signup paths call `assignRole()`. Upsert prevents duplicates. Single source of truth for role → `active_role` consistency.
**Effort:** S
**Priority:** P1
**Depends on:** Nothing. Prerequisite for middleware state machine.

---

### P2 — Add PostHog Signup Funnel Events
**What:** Add events: `user_signed_up` `{ role, method: 'email'|'google'|'apple', intent }`, `user_onboarding_started`, `user_onboarding_completed` `{ role, steps_completed, duration_ms }`, `user_email_verified`, `user_2fa_enabled`, `signup_error` `{ error_code, method }`. Never log PII.
**Why:** Without funnel events, there's no data to measure conversion rates, drop-off steps, or validate growth experiments. PostHog is already installed — zero setup cost.
**How to apply:** Add to `RegisterForm` submit, `OnboardingFlow` on mount + complete, `auth/callback` on first visit, `TwoFactorSetupFlow` on verify success.
**Effort:** S
**Priority:** P2
**Depends on:** Auth bug fixes complete.

---

### P2 — Extend Email Verification Link TTL to 24h
**What:** Change Supabase Auth email verification link expiry from default (1hr) to 24h. Done in Supabase dashboard under Auth → Email → Link expiry. Document the change in `.planning/` decisions.
**Why:** Agents and tradespeople sign up on mobile at a conference, complete onboarding on desktop that evening. Expired link = permanently lost professional user. The "Resend email" button exists but users don't know to use it.
**How to apply:** Supabase dashboard change only. No code change needed.
**Effort:** S
**Priority:** P2
**Depends on:** Nothing.

---

### P2 — Referral Code Capture at Signup
**What:** On landing, store `?ref=CODE` from URL in `localStorage` as `brite_referral`. On account creation (`RegisterForm` submit + `auth/callback`), write stored value to `profiles.referral_source`. Clear localStorage after write. Requires new migration adding `referral_source TEXT` column to `profiles`.
**Why:** Plant the data capture now (cheap, additive, zero UX impact) so the Phase 12 referral system has historical data from day 1. Retroactive backfill is painful; capturing from the start is free.
**How to apply:** Small localStorage read in `RegisterForm.onSubmit()` and `callback/route.ts`. Migration is a single `ALTER TABLE` with no RLS implications.
**Effort:** S
**Priority:** P2
**Depends on:** Phase 12 referral system (for the display/reward side, not the capture side).

---

### P3 — Role-Specific Signup Landing URLs
**What:** Add Next.js redirects in `next.config.ts`: `/signup-agent` → `/register?professional=agent`, `/signup-landlord` → `/register?professional=landlord`, `/signup-tradesperson` → `/register?professional=service_provider`, `/signup` → `/register`.
**Why:** Sales/BD team can hand out role-specific signup links at property conferences and in outreach emails. Pre-loads professional intent, removes a step from the professional signup funnel.
**How to apply:** Add to `redirects()` in `next.config.ts`. Zero new files, zero page code changes.
**Effort:** S
**Priority:** P3
**Depends on:** `/register?professional=` query param being read by `RegisterForm` (part of the auth bug fixes).

---

### P2 (Vision) — Verify-Email Progress Ring Delight
**What:** Show a progress ring on `/verify-email` indicating `X% complete` based on onboarding steps reached before email verification. E.g. "You're 40% done — just verify your email to continue". Connects the waiting moment to visible progress.
**Why:** The verify-email page is currently a dead-end moment of uncertainty. A progress indicator converts anxiety into anticipation.
**How to apply:** Pass `stepsCompleted` / `totalSteps` as query params from the RegisterForm redirect. Render a CSS `conic-gradient` ring in the verify-email page.
**Effort:** S
**Priority:** P2 (polish)
**Depends on:** Auth bug fixes + onboarding step count defined per role.

---

### P2 (Vision) — Social Proof on Signup Page
**What:** Show "2,400+ homebuyers joined this month" trust badge below the RegisterForm. Initially hardcoded seed number, later replaced with live Supabase RPC counting users created in last 30 days. Show only when real number > threshold.
**Why:** Reduces signup hesitation at the moment of decision. Buyers make emotional decisions; social proof at the right moment converts.
**How to apply:** Server Component wraps RegisterForm, fetches count (with cache), passes as prop. Graceful degradation if query fails (badge hidden).
**Effort:** S
**Priority:** P2 (polish — add when real numbers are meaningful)
**Depends on:** Sufficient user base to show non-trivial counts.

---

### P2 (Vision) — Activation Email Sequence
**What:** Supabase Edge Function cron: Email #2 at +24h if not verified ("Your account is waiting"), Email #3 at +72h if not onboarded ("Here's what you're missing — 3 properties matching your area"). Uses Resend templates. References `supabase/functions/weekly-digest/` pattern.
**Why:** Single "verify email" send isn't enough. Activation sequences measurably improve D1/D7 retention. Every professional portal does this. Without it, you lose 30-40% of signups who intend to return but forget.
**How to apply:** Build after `weekly-digest` function is shipped. Reuse the same Supabase cron + Resend pattern.
**Effort:** M
**Priority:** P2 (activation)
**Depends on:** `weekly-digest` Edge Function pattern proven in production, email templates for auth series.

---

## Security / Robustness

### P1 — Claude Response Zod Validation
**What:** All Claude API responses in the ROI service (and any future AI features) must be validated with a Zod schema before use. Failed validations fall through to the deterministic fallback.
**Why:** Three CRITICAL GAPS identified in plan review: `Claude malformed JSON`, `Claude refusal`, and `Claude schema mismatch` all cause unhandled crashes.
**Context:** ROI response schema: `{ renovations: [{type: string, cost_low: number, cost_high: number, value_uplift_pct: number, confidence: 'high'|'medium'|'low'}] }`. Log `property_id` + error type on failure (never log raw Claude response — may contain echoed PII from description).
**Effort:** S
**Priority:** P1
**Depends on:** `roi-estimation-service.ts` created.

### P1 — Land Registry JSON.parse Safety
**What:** Wrap all Land Registry API response parsing in `try/catch` with typed error handling. Return `null` on parse failure. ErrorBoundary at the section level shows "Price history temporarily unavailable."
**Why:** CRITICAL GAP — bare `JSON.parse()` on external API responses causes unhandled crashes.
**Effort:** S
**Priority:** P1
**Depends on:** `land-registry-service.ts` created.

---

## Seller Dashboard (Phase 13 — CEO Review 2026-03-15)

### P2 — Analytics Materialized View
**What:** `listing_analytics_daily` materialized view + nightly pg_cron refresh. Replaces direct COUNT queries against `listing_analytics_events` on every dashboard load.
**Why:** Direct aggregate queries degrade as the events table grows — expected 100K+ rows within 3 months of launch. Already have `idx_analytics_events_listing_date` composite index to carry us to MVP scale.
**How to apply:** Add `CREATE MATERIALIZED VIEW listing_analytics_daily AS SELECT listing_id, date_trunc('day', occurred_at) AS day, event_type, COUNT(*) AS count FROM listing_analytics_events GROUP BY 1,2,3`. Add `SELECT cron.schedule('0 3 * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY listing_analytics_daily$$)`. Update `analytics-service.ts` to query the view instead of the raw table.
**Effort:** M
**Priority:** P2
**Depends on:** Real traffic data flowing for 4+ weeks post-launch to justify the build.

---

### P2 — Price Intelligence Banner
**What:** Amber warning banner on `ListingCard` when a listing has been active 21+ days and views are declining >30% week-over-week.
**Why:** No portal proactively tells sellers when to adjust price. This is the feature sellers screenshot and send to friends.
**How to apply:** Add `weeks_declining: boolean` to `ListingWithStats` type. Compute in `getSellerListings`: compare `SUM(views) WHERE occurred_at >= now()-7d` vs same 7-day window the prior week. Return flag. Render amber banner in `ListingCard` when true. Needs 3+ weeks of analytics data before the flag can fire.
**Effort:** S
**Priority:** P2
**Depends on:** Phase 13 analytics events flowing for 3+ weeks in production.

---

### P2 — Vendor Report PDF (Monthly)
**What:** Auto-generated monthly PDF per listing: views trend, enquiry count, viewing count, comparable sold prices, recommended asking price review. Emailed to seller via Resend.
**Why:** Estate agents send paper vendor reports. A digital version at scale is free and builds seller trust. Phase 22 email infrastructure already built.
**How to apply:** Supabase Edge Function cron (1st of month, 9am). Uses `react-pdf` or `puppeteer` to render a PDF. Sends via Resend using existing email templates. Stores PDF in Supabase Storage at `vendor-reports/{seller_id}/{listing_id}/{month}.pdf`.
**Effort:** L
**Priority:** P2
**Depends on:** Phase 13 analytics events live, Phase 22 email templates proven in production.

---

### P2 — Solicitor-Initiated Stage Advancement
**What:** Magic-link pattern letting the assigned solicitor (stored in `sale_progression_stages.solicitor_email`) advance sale stages without a Britestate account. Seller sends invite → solicitor clicks link → can mark stages complete.
**Why:** Seller self-reporting makes the progression tracker inaccurate. Solicitor-initiated advancement makes it a trusted, defensible conveyancing record and creates a B2B2C touchpoint with solicitors.
**How to apply:** Issue a signed JWT (short-lived, scoped to one `sale_progression_stages.id`) when seller clicks "Invite Solicitor". Public route `/api/solicitor/advance` validates JWT and calls `advanceStage`. No Supabase account required. Schema already has `solicitor_email` field.
**Effort:** XL
**Priority:** P2
**Depends on:** Phase 13 sale progression tracker live, solicitor outreach program initiated.

---

### P2 (Vision) — Offer Timeline Micro-animations
**What:** Staggered fade-up animation (150ms delay between cards) when Offers page first loads. Offer amount does a count-up from 0 to final value using `requestAnimationFrame`.
**Why:** Offer amounts are high-stakes numbers. A count-up animation makes the reveal feel premium and memorable.
**How to apply:** Add staggered CSS animation classes to `OfferCard` mount. Count-up hook: `useCountUp(targetValue, 600)` using `requestAnimationFrame`. Framer Motion likely already in stack from admin dashboard — use `motion.div` with `initial={{ opacity: 0, y: 12 }}`.
**Effort:** S
**Priority:** P2 (polish)
**Depends on:** Phase 13 Offers page (Plan 13-08) complete.

---

## Landlord Dashboard (Phase 9.x — CEO Review 2026-03-15)

### P1 (Security) — Fix Storage Path Traversal in Compliance Upload Route
**What:** Add a server-side check in `/api/landlord/compliance/upload/route.ts`: after verifying the property belongs to the landlord, validate that `storage_path` starts with `${property_id}/`. Reject with 403 if not.
**Why:** The route currently accepts any `storage_path` from the request body and passes it directly to `createSignedUrl()`. An attacker who can guess storage paths could obtain a signed URL for another landlord's compliance document (which contains tenant PII and gas engineer credentials).
**How to apply:** Add one line after the property ownership check: `if (!storage_path.startsWith(`${property_id}/`)) return NextResponse.json({ error: "Invalid storage path" }, { status: 403 });`
**Effort:** S
**Priority:** P1
**Depends on:** Nothing.

---

### P1 (Bug) — Fix uploadDocumentFile() — Return Storage Path, Not Public URL
**What:** `src/services/landlord/document-service.ts` `uploadDocumentFile()` calls `supabase.storage.from(...).getPublicUrl(filePath)` and returns a permanent public URL. Compliance certs contain tenant PII and must never be public. Change to return the `filePath` (storage path) instead. Callers that need a URL should call `createSignedUrl()` on demand.
**Why:** The compliance upload API route correctly uses signed URLs. The service function contradicts this pattern. If any code path calls `uploadDocumentFile()` directly, it will store a public URL — exposing certificates containing names, addresses, and gas engineer registration numbers permanently.
**How to apply:** Replace the `getPublicUrl` call and return statement at the bottom of `uploadDocumentFile()` with `return filePath;`. Update the return type from `Promise<string>` to `Promise<string>` (unchanged) but document that the value is a storage path. Update any callers.
**Effort:** S
**Priority:** P1
**Depends on:** Nothing.

---

### P1 (Security + Integrity) — Add PDF Error Boundary to Section 21/8 Notice Builder
**What:** Wrap `Section21PDFDownload` and `Section8PDFDownload` (both dynamic imports, ssr:false) in a React `ErrorBoundary` component. On error, show: "PDF generation failed. Please check all fields and try again." with a retry button.
**Why:** `@react-pdf/renderer` throws render-time errors when passed malformed data. Currently these surface as a blank white area with no message. The notice builder is the highest legal-stakes feature on the landlord dashboard — a silent crash at this moment is the worst possible UX outcome.
**How to apply:** Create `src/components/landlord/PDFErrorBoundary.tsx` (class component extending `React.Component` with `componentDidCatch`). Wrap both PDF download components in `notices/page.tsx`.
**Effort:** S
**Priority:** P1
**Depends on:** Nothing.

---

### P1 (Performance) — Migrate getPortfolio() from In-Memory Aggregation to SQL RPC
**What:** Replace the current `getPortfolio()` implementation (which fetches all tenancies, maintenance requests, and property_documents for all properties into JavaScript memory) with a `get_landlord_portfolio_properties` Supabase RPC function (SECURITY DEFINER) that returns aggregated rows from SQL.
**Why:** For a landlord with 50 properties × 200 documents, the current implementation loads 10,000+ rows into server memory on every portfolio page load. `getPortfolioKPIs()` already uses the correct RPC pattern. This is a performance cliff at scale.
**How to apply:** Create SQL function `get_landlord_portfolio_properties(p_landlord_id uuid)` returning rows with `open_maintenance_count` and `expiring_documents_count` computed in SQL. Replace `supabase.from("listings").select(...)` call in `getPortfolio()` with `supabase.rpc("get_landlord_portfolio_properties", { p_landlord_id: user.id })`.
**Effort:** M
**Priority:** P1
**Depends on:** Supabase MCP access.

---

### P1 (Observability) — Compliance Cron Audit Log Table
**What:** Add a `compliance_cron_runs` table (id, run_at, properties_checked, emails_queued, emails_skipped_already_sent, error_count, error_details JSONB). The compliance expiry Edge Function should INSERT a row at the end of each run.
**Why:** The compliance expiry cron (30-day/7-day alerts) is currently completely dark — no way to know if it ran, how many emails it sent, or if it failed. If it silently fails, landlords miss legally important compliance alerts. This is the minimum observability for a feature with legal consequences.
**How to apply:** Add migration for `compliance_cron_runs` table. Add `INSERT INTO compliance_cron_runs (...)` at the end of the Edge Function. Admin can query `SELECT * FROM compliance_cron_runs ORDER BY run_at DESC LIMIT 10`.
**Effort:** S
**Priority:** P1
**Depends on:** Compliance expiry Edge Function (Phase 14, verify it exists in Supabase).

---

### P1 (Bug) — Redirect Duplicate Phase 6 Stub Routes to Phase 14 Pages
**What:** Add Next.js permanent redirects in `next.config.ts`:
- `/dashboard/landlord/rent-collection` → `/dashboard/landlord/rent`
- `/dashboard/landlord/portfolio` → `/dashboard/landlord/properties`
- `/dashboard/landlord/finances` → `/dashboard/landlord/finance/report`
Then delete the stub page files: `rent-collection/page.tsx`, `portfolio/page.tsx`, `finances/page.tsx`.
**Why:** Three Phase 6 stub pages still exist under the landlord route tree and are reachable via direct URL. They likely render hardcoded mock data. Any landlord or internal tester who bookmarked the old URLs will see stale mock data alongside the real Phase 14 pages.
**How to apply:** In `next.config.ts`, add a `redirects` array with `permanent: true` entries. After confirming no tests reference the old paths, delete the 3 stub files.
**Effort:** S
**Priority:** P1
**Depends on:** Nothing.

---

### P2 — Soft-Archive Previous Compliance Cert on Re-Upload (cert deduplication)
**What:** When a compliance cert is uploaded for a `(property_id, category)` pair that already has an existing record, set `is_active = false` on all previous records for that category+property before inserting the new one. Add `is_active BOOLEAN DEFAULT true` column to `property_documents`. Compliance dashboard only queries `WHERE is_active = true`.
**Why:** Currently there is no uniqueness enforcement on `(property_id, category)`. A landlord renewing their Gas Safety cert creates a second record. The compliance dashboard orders by `expiry_date ASC` and will show the old cert (earlier date) rather than the new one — hiding the renewal. This silently breaks the compliance dashboard.
**How to apply:** DB migration: add `is_active` column. API route: before INSERT, run `UPDATE property_documents SET is_active = false WHERE property_id = $1 AND category = $2`. Update all compliance queries to add `.eq("is_active", true)`.
**Effort:** M
**Priority:** P2
**Depends on:** Nothing.

---

### P2 — Landlord Health Score Widget (Dashboard Home 9.1)
**What:** A single 0–100 score on the dashboard home, computed as: compliance freshness 40pts (all certs valid = full score, decays as certs approach expiry), rent collection rate 30pts (% of expected payments received this month), maintenance response time 20pts (avg days to first response on open requests), deposit registration completeness 10pts (all active tenancies have registered deposits). Shows as a prominent card with a colour ring (green/amber/red) and drill-down to the weakest metric.
**Why:** The Monday-morning landlord wants a single number to assess portfolio health rather than scanning 4 KPI cards. Gives Britestate a defensible "completeness" score that encourages landlords to fill gaps — driving compliance cert uploads, deposit registrations, and maintenance responses.
**How to apply:** Pure SQL computation in the `get_landlord_portfolio_kpis` RPC or a new `get_landlord_health_score(p_landlord_id)` RPC. `HealthScoreCard.tsx` component on dashboard home.
**Effort:** M
**Priority:** P2
**Depends on:** Portfolio RPC migration (above).

---

### P2 — 90-Day Compliance Expiry Calendar (9.12 / 9.14)
**What:** A visual calendar view on the Compliance Alerts page (9.14) showing all compliance cert expiry dates for the next 90 days across all properties. Red dot = expired, amber = within 30 days, green = upcoming. Clicking a date opens the cert detail. Replaces or augments the current list view.
**Why:** Landlords with multiple properties benefit from temporal clustering — seeing that 3 certs expire in the same week allows batching of renewal appointments. The current list view doesn't reveal this pattern.
**How to apply:** Use `react-day-picker` (peer dep already installed for Shadcn calendar). Pass compliance expiry dates as modifiers to the calendar component. Colour-code using the existing `ExpiryStatus` logic.
**Effort:** M
**Priority:** P2
**Depends on:** `react-day-picker` availability (check `pnpm list react-day-picker`).

---

### P2 — Section 21 Pre-Validation Checklist Gate (9.26)
**What:** Before showing the Section 21 form, display a 4-item checklist panel:
- ✅ Deposit registered and scheme reference available?
- ✅ EPC provided to tenant?
- ✅ Gas Safety Certificate current and provided to tenant?
- ✅ Prescribed Information served to tenant?
Each item links to the relevant compliance page. The form only unlocks when all 4 are manually checked. The existing Zod validation remains as a fallback.
**Why:** The current UX buries prerequisites in Zod error messages that appear only after form submission. The checklist pattern makes legal requirements visible upfront, gives the landlord links to fix any gaps, and makes the feature feel trustworthy rather than bureaucratic.
**How to apply:** Add a `Section21PreflightChecklist` component with 4 checkboxes. Render it above the form. Disable the form `fieldset` when any checklist item is unchecked. On all-checked, animate the form into view.
**Effort:** S
**Priority:** P2
**Depends on:** Nothing (UI change only).

---

### P2 — Yield vs Postcode Benchmark (9.28)
**What:** After computing gross/net yield in the Yield Calculator, show a comparison line: "Your gross yield: X% vs median for [bedrooms]-bed rentals in [postcode district]: Y% — you are Z% above/below local average." Data sourced from Land Registry rental data.
**Why:** A yield figure in isolation is hard to interpret. Benchmarked against local comparables, it becomes actionable intelligence. "4.8% vs 4.2% median" tells the landlord they have a competitive property. "3.1% vs 5.5% median" tells them to review their asking rent.
**How to apply:** New `getRentalYieldBenchmark(postcode, bedrooms)` function using Land Registry rental data (Phase 5 infrastructure). Add benchmark display to `yield-calculator/page.tsx`.
**Effort:** M
**Priority:** P2
**Depends on:** Phase 5 Land Registry data layer.

---

### P2 (Analytics) — PostHog Landlord Funnel Events
**What:** Add PostHog tracking events: `landlord_cert_uploaded` `{ category }`, `landlord_notice_generated` `{ type: 's21' | 's8' }`, `landlord_rent_marked_paid`, `landlord_maintenance_assigned`, `landlord_compliance_alert_dismissed` `{ days_remaining }`. Never log PII (no tenant names, property addresses, or financial figures).
**Why:** Without funnel events there's no data to know which landlord features are used vs ignored. PostHog is already installed. This turns Phase 15 prioritisation from guesswork to evidence.
**How to apply:** Use `posthog.capture()` in the relevant client components and API route success responses. Add to `compliance/upload/page.tsx`, `notices/page.tsx`, `rent/RentCollectionClient.tsx`, `maintenance/[id]/assign/page.tsx`.
**Effort:** S
**Priority:** P2
**Depends on:** PostHog already installed.

---

### P2 — Legal Notices Feature Flag (NEXT_PUBLIC_LEGAL_NOTICES_ENABLED)
**What:** Gate the Section 21/8 notice builder behind a `NEXT_PUBLIC_LEGAL_NOTICES_ENABLED=false` environment variable. When false: the "Legal Notices" nav item is hidden and the route returns 404. Set to `true` only after a UK solicitor has reviewed the PDF template content and signed off in `.planning/decisions/legal-notices-solicitor-review.md`.
**Why:** Section 21 and Section 8 notices are prescribed legal forms used in UK possession proceedings. If the template content is incorrect (wrong prescribed information, missing fields), the notices are invalid and unenforceable. This could expose landlords to significant legal liability and Britestate to regulatory scrutiny.
**How to apply:** Add `NEXT_PUBLIC_LEGAL_NOTICES_ENABLED` to `.env.example` (default `false`). Check flag in `LandlordSidebar.tsx` nav item render and in `legal/notices/page.tsx` (redirect to dashboard if disabled).
**Effort:** S
**Priority:** P2 (P1 before any production user has access)
**Depends on:** Nothing.

---

### P2 (Delight) — One-Click WhatsApp Maintenance Status Update (9.16/9.17)
**What:** When a landlord updates a maintenance request status to `assigned` or `in_progress`, show a "Notify Tenant via WhatsApp" button that opens a WhatsApp deep link with a pre-composed message: "Hi [Tenant], your maintenance request for [issue] has been assigned to a tradesperson and is expected to be resolved by [date]. — [Landlord Name]". The landlord sends it from their own WhatsApp.
**Why:** Landlords currently have to switch apps to inform tenants of maintenance progress. One-click pre-composed messages make professional communication effortless — the landlord looks responsive and the tenant stays informed. High perceived value for very low effort.
**How to apply:** After maintenance status update success, show a `<a href={`https://wa.me/?text=${encodeURIComponent(preComposedMessage)}`} target="_blank">`. No backend changes needed.
**Effort:** S
**Priority:** P2
**Depends on:** Tenant phone number available in tenancy record.

---

### Pre-existing Bug: Legal Notices — Empty property_id

- [ ] P2 | `notices/page.tsx` passes `property_id: ""` and `landlord_id: ""` to `createNotice()`. The service overwrites `landlord_id` with `user.id`, but `property_id` is never set — will cause silent bad data or FK violation depending on DB constraints. Fix: resolve `property_id` from the selected tenancy before calling `createNotice()`. (Flagged 2026-03-15 during CEO review code quality pass)

---

## Buyer/Renter Dashboard (Phase 7.x)

### P1 — Renter Role Differentiation on Offers + Calculators Pages
**What:** Add renter-specific branches in `offers/page.tsx` and `calculators/page.tsx`. Offers page for renters: show a "Rental application coming in Phase 2" placeholder (not the buyer offer state machine: `submitted → mortgage_approved → exchange → completion`). Calculators for renters: show rental affordability formula (`income × 35% = max monthly rent`) instead of the mortgage LTV/repayment calculator.
**Why:** Both homebuyer and renter roles share `/dashboard/[role]/` routes. A renter navigating to `/dashboard/renter/offers/` currently sees buyer-specific offer UI — wrong UX. Same for the affordability calculator. The role param is already the branch key; the `HomebuyerDashboard` vs `RenterDashboard` split on the home page shows the pattern.
**How to apply:** Use `role === 'renter'` conditional in both pages. Pattern matches the existing `HomebuyerDashboard.tsx` / `RenterDashboard.tsx` split. Small diff — no new files needed.
**Effort:** S
**Priority:** P1
**Depends on:** Wave 1 role validation fix (`dashboard/[role]/page.tsx`).

---

### P2 — Moving Checklist Seed Data Strategy
**What:** Decide whether `moving_checklist_items` are pre-seeded per-offer (e.g., 'Instruct solicitor', 'Book survey', 'Obtain mortgage offer', 'Exchange contracts', 'Completion') or created from scratch by the user. If pre-seeded: write a seed function that inserts default items when an offer reaches `submitted` status. If user-created: add an 'add item' form to the page.
**Why:** The Wave 4 UI (`moving/page.tsx`) will open to an empty table on first load unless items are pre-seeded or a creation form exists. A dead empty state at launch is a broken feature, not a deferred one.
**How to apply:** Check whether `moving_checklist_items` has a FK to `offers` or is standalone per user. Pre-seeded items linked to the offer state machine (auto-created on offer submit) is the better UX. Requires a trigger or a call in `offers-service.ts` on submit.
**Effort:** S
**Priority:** P2
**Depends on:** Wave 4; `offers-service.ts` (Wave 1) as the trigger point.

---

### P2 — Message Thread Pagination Spec
**What:** Define page size and scroll strategy for `messages/[id]/page.tsx` (7.12). Recommended: cursor-based, load newest 50 messages on mount, scroll-up triggers load of earlier 50 via `created_at DESC` cursor. Mark-as-read fires on tab focus or scroll-to-bottom.
**Why:** Without a pagination spec before Wave 2 implementation, the thread component will load all messages in one query. A conversation with 500+ messages is slow and will require a rebuild. Cursor-based is the right pattern; baking it in from day one is free.
**How to apply:** `messages-service.getThread(conversationId, { before?: string, limit: 50 })`. Use `created_at` as the cursor. The hook flips older messages to the top of the rendered list on load-more. `useInfiniteQuery` from React Query handles this cleanly.
**Effort:** S
**Priority:** P2
**Depends on:** Wave 2 (`messages-service.ts`).

---

### P2 — Dashboard Cache Invalidation on Message Send
**What:** Call `invalidateDashboardCache(userId)` and `logActivity()` inside `messages-service.ts` after a message is successfully sent. This ensures the unread message count stat card on the dashboard home (7.1) reflects new messages immediately rather than waiting up to 5 minutes for Redis TTL expiry.
**Why:** The plan calls `invalidateDashboardCache()` after offer and viewing changes but omits messages. The dashboard home aggregation includes unread message count. Inconsistent invalidation leads to a stale count that users will interpret as a bug.
**How to apply:** One-line addition to `messages-service.ts` `sendMessage()` — identical pattern to `viewings-service.ts`. Both `invalidateDashboardCache()` and `logActivity()` already exist in `dashboard-service.ts`.
**Effort:** XS
**Priority:** P2
**Depends on:** Wave 2 (`messages-service.ts`); Wave 1 (`invalidateDashboardCache()` already exists).

---

## Provider / Tradesperson Dashboard (Phase 16)

### P1 — Lead Quality Score on New Enquiries (11.11)
**What:** Compute a 1–5 star "Lead Quality" score for each incoming service enquiry and display it as a badge on the enquiry card. Score factors: budget vs category average (from `quotes` table), client review history, urgency (days until required).
**Why:** Providers receive leads of wildly varying quality. Without scoring, they waste time evaluating low-quality leads before rejecting them. Scoring lets a plumber with 5 active quotes instantly prioritise the £2k bathroom refurb over the speculative "how much would it cost to..." enquiry.
**Pros:** Direct revenue impact — higher acceptance rate on quality leads = more completed bookings = more platform commission. Data already exists in quotes + reviews tables.
**Cons:** Score must be recalculated as new quotes and reviews are added. Needs a minimum data threshold to be meaningful (show score only if category has ≥10 quotes in DB). Risk of gaming if score formula is visible.
**Context:** Add `lead_quality_score` SQL function. Called at enquiry load time (not stored — derived). Render as ★★★★☆ on each enquiry card in 11.11. Show tooltip explaining factors. Build after `provider_analytics_daily` table has 30 days of data.
**Effort:** M
**Priority:** P1
**Depends on:** Phase 16 analytics foundation (`provider_analytics_daily` table), sufficient marketplace data volume.

---

### P2 — Competitive Pricing Nudge on Services Manage (11.8)
**What:** When a provider sets a price for a service, show market rate context: "Providers in [your area] charge £65–£85/hr for Plumbing. You're at £55/hr — 16% below market."
**Why:** Underpricing is endemic among new tradespeople — they win jobs but undermine margin. Overpricing loses leads. Market-rate nudging improves provider earnings (they stay on platform longer) and customer trust (prices feel fair).
**Pros:** Data is already in the `quotes` table (accepted quotes with prices per category per region). Zero new API calls. Builds provider loyalty.
**Cons:** Low data quality at launch — needs sufficient quote volume per category + region to be non-misleading. Show only if N ≥ 20 accepted quotes in that category+region bucket. Add "Based on [N] recent quotes in your area" attribution.
**Context:** SQL: `SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY amount), percentile_cont(0.75) WITHIN GROUP (ORDER BY amount) FROM quotes WHERE category = $1 AND provider_region = $2 AND status = 'accepted' AND created_at > NOW() - INTERVAL '90 days'`. Render as helper text on the price input in 11.8.
**Effort:** S
**Priority:** P2
**Depends on:** Phase 16 Services Manage page (11.8), marketplace data volume (≥20 accepted quotes per category+region).

---

### P2 — One-tap Re-quote on Completed Jobs (11.13)
**What:** On the Completed Jobs list (11.13), a "Send seasonal offer" button pre-fills the Quote Builder with the same client + service type from the completed job, pre-dated 3 months later.
**Why:** Repeat business from existing clients is the cheapest bookings a provider gets — no lead cost, established trust. The timing prompt (3-month reminder for maintenance work) turns a passive history list into an active re-engagement tool.
**Pros:** Drives repeat bookings. No new API needed — pre-fills Quote Builder via `?clientId=X&jobType=Y&fromJobId=Z` query params. Adds ~30min to Completed Jobs page.
**Cons:** "Seasonal offer" framing only makes sense for recurring-need services (boiler service, garden maintenance, cleaning). Less relevant for one-time jobs (extension build). Could add a category filter to only show the button for relevant service types.
**Context:** Implementation: add "Re-quote" button to each completed job card. On click, navigate to `/dashboard/provider/quotes/builder?prefill=true&fromJobId={id}`. Quote Builder reads URL params and prefills client + line items from the historical job. Build after Completed Jobs page is stable.
**Effort:** S
**Priority:** P2
**Depends on:** Phase 16 Completed Jobs page (11.13) and Quote Builder (11.15) both shipped.

---

### P1 — Stripe Connect Webhook Handler (Phase 16 prerequisite)
**What:** Create `/api/webhooks/stripe/route.ts` handling: `payout.paid`, `payout.failed`, `account.updated`, `payment_intent.succeeded`. Verify Stripe signature header. Upsert event to `stripe_events` idempotency table (keyed by `stripe_event_id`). Update `stripe_connect_accounts` table on account changes.
**Why:** Without a webhook handler, the Payments Overview (11.17) and Individual Transaction (11.18) pages show permanently stale payout data. Providers will see incorrect balances. `account.updated` is critical for reflecting KYC status changes.
**How to apply:** Build as part of Wave 1 (16-01) alongside `stripe_connect_accounts` table creation. Stripe signature verification uses `STRIPE_WEBHOOK_SECRET` env var. Must be registered in Stripe dashboard after deployment.
**Effort:** S
**Priority:** P1
**Depends on:** `stripe_connect_accounts` table (Wave 1), `STRIPE_WEBHOOK_SECRET` env var configured.

---

---

## Estate Agent Dashboard (Phase 15 / CEO Review 2026-03-15)

### P2 — Split agent-analytics-service.ts into domain services
**What:** Refactor `src/services/agent/agent-analytics-service.ts` (465 lines, 3 distinct domains) into `agent-appraisal-service.ts`, `agent-performance-service.ts`, and a leaner `agent-analytics-service.ts` for listing-level analytics only.
**Why:** The file currently contains `getMarketAppraisalData`, `getCompetitorAnalysis`, `getAgentPerformanceMetrics`, `getBranchMetrics`, and `getListingAnalytics` — five distinct concerns. A new engineer joining will have no way to discover where appraisal logic lives. This is Phase 7 (production readiness) debt.
**Pros:** Cleaner domain boundaries. Easier to test. Easier to split responsibilities across team. Aligns with existing service naming convention.
**Cons:** Pure refactor — no feature gain. Touching well-working code introduces regression risk.
**Context:** All callers are agent API routes under `src/app/api/agent/`. Update imports in `analytics/route.ts` and `reports/route.ts`. No DB changes. Run tests before and after.
**Effort:** M
**Priority:** P2
**Depends on:** Phase 15 merged to main.

---

### P1 — Vendor portal: seller-facing sale progression read-only view
**What:** When an agent moves a sale stage on the sale progression Kanban, emit a milestone event so sellers can see their own sale status in their seller dashboard — without needing to call the agent.
**Why:** The `transaction_milestones` table and `milestone-service.ts` already exist. The connection is missing: `agent-sale-service.ts` doesn't call `insertMilestone()` when stage changes. Without this, buyers and sellers have zero visibility into their own conveyancing progress. This is a real user experience gap — "what's happening with my sale?" is the #1 agent phone call.
**Pros:** Trivial code addition (one service call in `agent-sale-service.ts`). Buyers/sellers get visibility without agent action. Builds trust. Enables milestone notifications.
**Cons:** None material. Milestone events are additive and don't affect agent workflow.
**Context:** In `agent-sale-service.ts`, after updating `agent_sale_progressions.stage`, call `milestoneService.insertMilestone({ type: 'sale_stage_update', entityId: saleId, stage: newStage, actorId: agentId })`. Buyers/sellers see this in their existing `/milestones/transaction/[id]` view.
**Effort:** S
**Priority:** P1
**Depends on:** Phase 15 merged to main, milestone-service.ts (already built).

---

### P1 — SMS/WhatsApp notifications for agent time-sensitive events
**What:** Twilio integration for viewing confirmations, new offer alerts, and viewing feedback received. UK agents live on their phones — email notifications have <20% open rates for time-sensitive events.
**Why:** Agents miss offers and viewings because email is too slow. A new offer notification that arrives 2 hours late loses deals. SMS is the standard in UK property operations.
**Pros:** Twilio has a dead-simple API. Notification service already exists — adding SMS as a channel is one abstraction layer. High agent satisfaction impact.
**Cons:** Twilio API key + per-message cost. GDPR compliance for SMS (explicit consent required). Phone number validation on agent profile.
**Context:** Add `sms` to notification channels in `notification-service.ts`. Add phone number field to `agent_agency_profiles`. Use opt-in toggle in notification preferences settings. Trigger on: viewing slot booked, new offer received, viewing feedback submitted.
**Effort:** M
**Priority:** P1
**Depends on:** Phase 15 merged to main, Twilio account setup.

---

### P2 — Automated weekly vendor report email cadence
**What:** Inngest weekly cron (Monday 8am) that generates and emails a performance report to each active listing's vendor. Agents currently must generate and send manually — this automates it.
**Why:** Vendors expect regular updates. Manual generation is a task agents forget or deprioritise. Automated cadence builds vendor trust and reduces "what's happening?" enquiries.
**Pros:** VendorReportPDF + Resend already exist. Inngest cron pattern already established (`api/inngest/route.ts`). The wiring is the work.
**Cons:** Adds a background job. Need agent opt-in/opt-out per listing (some vendors may not want weekly emails). Need a "vendor email" field on agent_sale_progressions or CRM.
**Context:** Create `inngest/functions/vendor-report-weekly.ts`. Query all active sale progressions, generate PDF via existing service, send via Resend using a new `VendorWeeklyUpdate` React Email template. Store `last_report_sent_at` on `agent_vendor_reports` to prevent duplicates.
**Effort:** M
**Priority:** P2
**Depends on:** Phase 15 merged, VendorReportPDF working, Resend email templates (Phase 22).

---

### P2 — Sale stage ETA and on-track indicators
**What:** Using UK average conveyancing timelines per stage (searches ~6 wks, survey ~3 wks, mortgage ~4 wks, exchange ~1 wk), compute expected completion date and show green/amber/red ETA badge on sale progression cards.
**Why:** Agents and vendors have no instant way to know if a sale is running late without manually tracking dates. An automated ETA gives agents early warning to chase solicitors.
**Pros:** Pure date arithmetic — no new DB queries. Extremely visual and actionable. Makes the sale Kanban genuinely intelligent rather than a manual tracker.
**Cons:** UK conveyancing timelines vary. Must show these as estimates, not commitments. Initial version can use national averages; refine with actual data later.
**Context:** Create `lib/conveyancing/stage-timelines.ts` with average durations per SALE_STAGES entry. In `SaleProgressionKanban.tsx`, compute `expectedCompletionDate` from `stage_entered_at` + cumulative durations. Show badge on each card. Data needed: add `stage_entered_at TIMESTAMPTZ` to `agent_sale_progressions` table via migration.
**Effort:** S
**Priority:** P2
**Depends on:** Phase 15 merged, `stage_entered_at` column added.

---

### P2 — Market intelligence: cross-agent benchmarking (opt-in)
**What:** Anonymised aggregate insights: "Your avg time-to-close is 47 days. Top agents in your area: 31 days." Sourced from aggregate queries across `agent_leads` and `agent_sale_progressions` with explicit opt-in consent and no PII exposure.
**Why:** Turns the platform dataset into a competitive intelligence product. Agents will pay a premium for benchmarking — it's a Salesforce Insights / Google Analytics moment. No other UK portal offers this.
**Pros:** Data already exists. Aggregate-only queries (no individual agent data exposed to others). High retention and upsell driver.
**Cons:** Requires GDPR consent (explicit opt-in to share anonymised data). Must be robust to outliers/small samples. "n < 5 agents in your area" edge case must show "insufficient data".
**Context:** Add `analytics_opt_in BOOLEAN DEFAULT false` to `agent_agency_profiles`. Build `agent-benchmarking-service.ts` with aggregate queries. Surface in Performance Reports (10.27/10.28). Gate behind a "Join Britestate Insights" opt-in toggle in billing/settings.
**Effort:** L
**Priority:** P2
**Depends on:** Phase 15 merged, sufficient agent adoption (minimum 10 agents), GDPR consent flow.

---

### P1 — Viewing confirmation auto-email on slot booking
**What:** When an agent marks a viewing slot as booked, offer one-click "Send confirmation to [buyer email]". Pre-fills buyer email from the booking context. Uses existing Resend + React Email infrastructure.
**Why:** Viewing confirmations are standard in UK property. Buyers currently receive nothing unless the agent manually emails them. This creates missed viewings and agent phone calls.
**Pros:** Email service and templates already exist (Phase 22). One new `ViewingConfirmation` email template. Hook in `agent-viewing-service.ts` on slot booking.
**Cons:** Agent must have buyer email (from lead or manual input). Need to handle "no email available" gracefully.
**Context:** Add `ViewingConfirmation.tsx` to `src/lib/email/templates/`. In `ViewingCalendar.tsx`, show "Send confirmation?" modal after booking is confirmed with pre-filled buyer details. Call existing `email-service.ts`.
**Effort:** S
**Priority:** P1
**Depends on:** Phase 15 merged, Phase 22 (email templates) merged.

---

### P1 — Britestate Verified Trust Mark (platform capability)
**What:** Surface the `provider_badges` data (earned in 11.7) as a visible trust badge on the provider's public profile page and in search results on the marketplace. Badge tiers: "Identity Verified", "Fully Verified", "Britestate Pro" (fully verified + 10+ reviews + 4.5★+).
**Why:** The verification system built in Phase 16 is the most valuable trust signal on the platform — but its value is zero if it's only visible inside the provider's own dashboard. Surfacing badges on public profiles drives consumer confidence, increases booking rates, and motivates providers to complete verification.
**Pros:** Zero additional DB work — badges already computed and stored in `provider_badges`. Pure UI addition to public provider profile and search result cards.
**Cons:** Badge tiers need to be defined clearly and consistently enforced. Risk: "Britestate Pro" tier requirements need to be communicated clearly to avoid gaming.
**Context:** Add badge icon(s) to: (1) public provider profile header (marketplace/providers/[slug]), (2) provider card in search results, (3) RFQ response quote card. Use the `provider_badges` table as the source. No new tables needed.
**Effort:** S
**Priority:** P1
**Depends on:** Phase 16 complete (`provider_badges` populated), public provider profile page exists.

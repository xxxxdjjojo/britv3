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

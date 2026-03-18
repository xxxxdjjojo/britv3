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

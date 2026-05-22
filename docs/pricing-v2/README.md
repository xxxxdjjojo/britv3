# Memo Pivot v2 — operations guide

Everything you need to operate the new 7-segment pricing model. Reading
order:

1. **Provisioning** — first-time setup of Stripe Prices.
2. **Env vars** — what to put in `.env.local` and `.env`.
3. **Migrations** — Supabase tables introduced by the pivot.
4. **A/B experiment** — Sellers default-tier flag.
5. **Programmatic SEO** — how to scale from 516 to 10K routes.
6. **Operational dashboards** — where to watch results.

---

## 1. Provisioning

Idempotent via `metadata.britestate_plan_id`. Safe to re-run.

```bash
# From britv3/
node --experimental-strip-types scripts/stripe-setup/create-pricing-v2.ts
# Writes .env.pricing-v2.generated with all STRIPE_*_PRICE_ID lines.

cat .env.pricing-v2.generated >> .env.local

node --experimental-strip-types scripts/stripe-setup/verify-pricing-v2.ts
# Exit code 0 only if Stripe test mode matches the registry exactly.
```

Refuses to run against live keys. Always use `sk_test_…` for the
provisioning step. Live-mode provisioning is a manual decision a billing
operator makes once pricing is locked.

## 2. Env vars

Required for the new schema (all added to `.env.example`):

```
# Sellers (one-off)
STRIPE_SELLER_BASIC_PRICE_ID
STRIPE_SELLER_PLUS_PRICE_ID
STRIPE_SELLER_PREMIUM_PRICE_ID

# Agents
STRIPE_AGENT_PRO_PRICE_ID
STRIPE_AGENT_PRO_ANNUAL_PRICE_ID
STRIPE_AGENT_ELITE_PRICE_ID
STRIPE_AGENT_ELITE_ANNUAL_PRICE_ID

# Landlords
STRIPE_LANDLORD_ESSENTIAL_PRICE_ID
STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID
STRIPE_LANDLORD_PRO_PRICE_ID
STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID
STRIPE_LANDLORD_PORTFOLIO_PRICE_ID
STRIPE_LANDLORD_PORTFOLIO_ANNUAL_PRICE_ID

# Providers
STRIPE_PROVIDER_PRO_PRICE_ID
STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID
STRIPE_PROVIDER_ELITE_PRICE_ID
STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID

# Niche providers
STRIPE_PROVIDER_CONVEYANCER_PRICE_ID (+ _ANNUAL)
STRIPE_PROVIDER_SURVEYOR_PRICE_ID (+ _ANNUAL)
STRIPE_PROVIDER_MORTGAGE_BROKER_PRICE_ID (+ _ANNUAL)

# Developers
STRIPE_DEVELOPER_SINGLE_PRICE_ID (+ _ANNUAL)
STRIPE_DEVELOPER_MULTI_PRICE_ID (+ _ANNUAL)
STRIPE_DEVELOPER_ENTERPRISE_PRICE_ID (+ _ANNUAL)

# Traders
STRIPE_TRADER_PRO_PRICE_ID (+ _ANNUAL)
STRIPE_TRADER_ELITE_PRICE_ID (+ _ANNUAL)

# Boosts (one-off)
STRIPE_BOOST_7D_PRICE_ID
STRIPE_BOOST_14D_PRICE_ID
STRIPE_BOOST_30D_PRICE_ID
STRIPE_BOOST_AI_VALUATION_PRICE_ID
STRIPE_BOOST_STORY_PRICE_ID
STRIPE_BOOST_DIGEST_PRICE_ID

# Optional — for the SDR cron processor
CRON_SECRET=…  # x-cron-key header expected by /api/admin/sdr/process
```

Free plans (Agent Listed, Landlord Free, Provider Listed) use the
literal sentinel `free` in lieu of a price id; this is honoured by the
allowlist and by `calculatePlatformFee`.

## 3. Migrations

Two new SQL migrations land with this pivot:

- `supabase/migrations/20260522000001_sdr_campaigns.sql` —
  `sdr_campaigns`, `sdr_targets`, `sdr_messages` (admin-only RLS).
- `supabase/migrations/20260522000002_invite_codes.sql` — `invite_codes`
  (public validate, auth-only redeem, admin manage).

Apply via your usual migration command (e.g. `supabase db push` or the
CI deploy job).

## 4. Sellers A/B

PostHog feature flag: **`sellers_default_tier`**

| Variant | Highlighted plan |
|---|---|
| `basic` (control) | Sellers / Basic — £99 |
| `plus` (treatment) | Sellers / Plus — £249 |

Exposure is captured server-side via `POST /api/experiments/exposure`
on first activation of the Sellers tab. Override via `?force_variant=plus`
for QA.

The harness lives at `src/lib/experiments.ts`. Wire to PostHog in your
existing analytics initialiser when ready.

## 5. Programmatic SEO

Default ships **516 routes** (43 postcode areas × 12 services). Scale
to 10K by:

1. Running the Land Registry ingest (`scripts/ingest-land-registry.mjs`)
   to refresh postcode coverage.
2. Updating `DEFAULT_POSTCODE_AREAS` in
   `src/lib/seo/postcode-service-matrix.ts` to use the full UK set.
3. Re-running `next build` — `generateStaticParams` will pick up the
   new pairs.

`MATRIX_HARD_CAP = 10_000` caps total prerender size so `next build`
stays under five minutes.

## 6. Operational dashboards

- `/admin/pricing-review` — MRR by segment, paying users, churn, vs
  memo scenarios. Use this for the Week 12-13 checkpoint.
- `/admin/sdr` — outbound queue inspector + enqueue UI.
- Live screenshots of every surface in `docs/pricing-v2/screenshots/`
  (29 PNGs at desktop + mobile).

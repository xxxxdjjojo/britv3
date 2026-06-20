# Trader / Professional Test Seed

Realistic synthetic test data for the **marketplace / service-provider ("TrueDeed")**
surfaces so every platform function can be exercised: directory, category pages,
search & filters, public profile pages, reviews & ratings, verification states,
leads, provider dashboards, and admin approval.

- **Batch id:** `traders_test_seed_2026_06_17`
- **Target:** the project's confirmed dev/test Supabase (`ynkqzzpcbpphjczmrfva`).
- **Data:** 100% synthetic. Fictional names, Ofcom-reserved `020 7946 0xxx` phone
  numbers, `*.seed.test` websites, West-London / Ealing postcodes. No real people or
  companies. (No trade-partner CSV was supplied; data is fully generated.)

## How to apply / roll back / verify

```bash
# from britv3/
DBURL=$(grep -hE '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')

# apply (idempotent — safe to re-run)
psql "$DBURL" -v ON_ERROR_STOP=1 -f supabase/seed/20_trader_test_seed.sql

# verify invariants (exits non-zero on failure)
psql "$DBURL" -v ON_ERROR_STOP=1 -f supabase/seed/verify_trader_seed.sql

# roll back ALL seed data (single cascade delete)
psql "$DBURL" -v ON_ERROR_STOP=1 -f supabase/seed/20_trader_test_seed_rollback.sql
```

## Identification & rollback model

Every seeded `auth.users` row uses email `<key>@seed.truedeed.test` and carries
`raw_user_meta_data = { "is_test": true, "seed_batch_id": "traders_test_seed_2026_06_17" }`.
Provider listings additionally use slugs prefixed `seed-<category>-NN`.

Rollback is a single statement — `DELETE FROM auth.users WHERE email LIKE '%@seed.truedeed.test'`
— which cascades through `profiles → service_provider_details → {services, documents,
badges, portfolio, bookings, reviews}` and `service_requests` via existing
`ON DELETE CASCADE` foreign keys. `auth_audit_log` rows are `SET NULL` (retained, anonymised).

## What was created

| Table | Rows | Notes |
|---|---|---|
| `auth.users` + `profiles` (providers) | 200 | 10 × 20 `service_category` enum values |
| `auth.users` + `profiles` (customers) | 25 | review authors + lead submitters (homebuyers) |
| `service_provider_details` | 200 | listings: slug, postcodes, pricing, accreditations, base_location |
| `provider_services` | ~306 | 1–3 per active provider |
| `provider_documents` | ~140 | approved / pending / rejected to match verification state |
| `provider_badges` | ~100 | Gas Safe, NICEIC, RICS, FMB, etc. (verified providers) |
| `provider_portfolio_items` | ~180 | top-3 verified providers per category |
| `bookings` | ~560 | one completed booking per review |
| `reviews` | ~560 | varied 2–5★; `provider_rating_stats` auto-rolled-up |
| `service_requests` (leads) | 40 | open / quotes_received, for lead-routing tests |

### Verification-state distribution (per category of 10)
| Index | State | Profile completeness |
|---|---|---|
| 1–5 | `verified` | full: services, docs(approved), badge, portfolio(1–3), reviews(15/8/4/1/0) |
| 6–7 | `pending_review` | services + pending doc, no reviews |
| 8 | `rejected` | rejected doc, minimal |
| 9 | `unverified` | **intentionally empty** profile (tests empty-state) |
| 10 | `suspended` | full data + `suspended_until` set |

Review counts `15/8/4/1/0` for the verified five guarantee: providers above the
`>5`-review marketplace gate, providers with few reviews, and verified-but-no-reviews.

## Test coverage enabled

Empty vs complete profiles · verified/unverified/pending/rejected/suspended · with/without
documents · multiple services · multiple postcodes · with/without reviews & ratings ·
search by category · location/postcode search (geocoded RPC) · filter by rating · filter
by verification/accreditation · admin approval queue · lead enquiry/routing · public
profile pages · provider dashboards (authenticated).

## Categories

All 20 `service_category` enum values are populated (10 each): `plumber, electrician,
builder, carpenter, plasterer, painter, landscaping, cleaning, handyman, locksmith,
pest_control, surveying, architect, conveyancing, mortgage_broker, home_inspector,
interior_design, property_management, moving_company, other`.

Specialist professions without a dedicated enum value (roofers, drainage, glazing, damp &
mould, EICR/EPC/gas/fire/structural/insurance/inventory) are represented as service lines
/ business names under the nearest enum category (e.g. Gas Safe heating under `plumber`,
EICR under `electrician`, roofing/drainage/glazing under `other`).

## Bugs found & fixed along the way

Seeding made several **pre-existing, previously-unreachable** defects observable. All were
fixed so the seeded surfaces actually render:

1. **Anon RLS gap + PII hardening** (`supabase/migrations/20260619180000_public_provider_profile_visibility.sql`) —
   the public marketplace/profile/SEO pages were invisible to logged-out visitors because no
   `anon` SELECT policies existed on the provider read-surface. The migration adds tight `anon`
   *row* policies gated to verified providers / approved reviews (profiles, service_provider_details,
   provider_rating_stats, reviews, provider_services, provider_badges, provider_portfolio_items),
   and — secure by default — *column-scopes* anon's read of `profiles` (REVOKE blanket SELECT,
   GRANT only safe directory columns) plus a `public_provider_profiles` view, so PII (phone,
   is_admin, ban_reason, …) is never reachable by anon. (Folds in the hardening that was proposed
   separately as `fix/anon-provider-profile-pii` / PR #63, which this supersedes.)
   Note: `migrate.yml` has been retired — apply manually with
   `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260619180000_public_provider_profile_visibility.sql`
   then `supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied 20260619180000`.
2. **`profiles(full_name, email)` selects** — those columns don't exist (it's `display_name`;
   email is on `auth.users`). Aliased `full_name:display_name`, dropped `email`, and added
   `description:business_description`. (Fixed on `main` via #58; this PR adds the missing
   `description` alias so the profile About text renders.)
3. **`ProviderSearchCard` crash** — `search_providers` RPC returns flat rows; the card read
   `provider.profiles.…` → 500. Card now tolerates both nested and flat shapes.
4. **RSC boundary** — the profile page passed a `modal` render-prop function to a client
   component (`ServicesTabWithModal`). Refactored to serializable props.
5. **Location SEO query** referenced a non-existent `city` column → errored → every SEO
   location page was empty. Now lists verified providers in the category.
6. **`provider.description`** read a non-existent field → aliased `description:business_description`.

## Known limitations / not yet testable

- **Estate / letting agents** use a separate subsystem (`agent_profiles` /
  `agent_agency_profiles`), not `service_provider_details`. Not seeded here.
- **Precise location filtering** on programmatic SEO pages needs a postcode-area / geo
  mapping that doesn't exist yet; those pages currently list category-wide verified providers.
- **Provider subscriptions/plans** are config-driven (`src/lib/billing-config.ts` /
  Stripe), not row-seeded — no per-provider subscription rows were created.
- **TrueDeed introductions ledger** (append-only, service-role RPC) was not seeded; lead
  testing uses `service_requests`.

## Proof

E2E: `e2e/trader-directory.spec.ts` (16 passing, desktop + mobile).
Screenshots: `scripts/trader-seed-screenshots.mjs` → `trader-seed-shots/`.

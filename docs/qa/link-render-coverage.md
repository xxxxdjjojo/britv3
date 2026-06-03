# Link Render QA Coverage

This QA layer verifies that Britestate link destinations render reachable pages, not that every destination workflow is functionally complete.

## Route Inventory

The canonical route list lives in `e2e/fixtures/link-render-routes.ts`.

Public routes are grouped as:

- `marketing`: homepage, about, how it works, pricing, contact, careers, press.
- `content`: blog, help centre, help contact.
- `legal`: legal hub, terms, privacy, cookies, accessibility, complaints.
- `auth`: register, signup, role select, onboarding screens, verify email, login, forgot/reset password.
- `search`: base search plus buy, rent, new-build, map, and list query variants.
- `services`: services hub, marketplace, tradespeople, category filters, location tradespeople, agents, mortgage brokers, conveyancers, surveyors, architects, post a job.
- `tools`: valuation, compare, mortgage, stamp duty, affordability, buy vs rent, rental yield, remortgage, mortgage comparison, moving cost, energy bill.
- `areas`: area guide index plus seeded static city routes.
- `data`: sold prices and market trends.
- `business`: seller, developer, trader, and fee transparency pages.
- `trust`: reviews.

Protected route checks are grouped as:

- `public-menu-protected`: protected destinations exposed from public menus.
- `dashboard`: role dashboard entry points for homebuyer, renter, seller, landlord, agent, provider, and broker.
- `shared-protected`: inbox, notifications, profile, settings.
- `admin`: admin home, users, moderation, verifications, reviews, CMS, SEO, analytics, feature flags, GDPR, audit log, promo codes.

Dynamic routes intentionally excluded from generic link-render QA:

- `/properties/[slug]`
- `/agents/[slug]`
- `/marketplace/[slug]`
- `/services/[category]/[slug]`
- `/blog/[slug]`
- `/dashboard/*/[id]`

Those paths require seeded slugs, authenticated ownership state, or both, and belong in seeded functional E2E coverage.

## Test Coverage

Component coverage:

- `src/config/navigation.test.ts`
- `src/components/layout/CommandPalette.test.tsx`
- `src/components/layout/MobileNav.test.tsx`
- `src/components/layout/SavedBadge.test.tsx`
- `src/components/layout/Sidebar.test.tsx`
- `src/components/mobile/BottomTabBar.test.tsx`

Playwright coverage:

- `e2e/checklist-link-render.spec.ts`: route inventory status, not-found guard, visible heading, screenshot output, and protected-route login redirects.
- `e2e/configured-navigation-render.spec.ts`: configured public navigation destinations render real pages.
- `e2e/homepage-link-audit.spec.ts`: homepage/header/footer/card/internal links render expected destinations.
- `e2e/public-page-screenshots.spec.ts`: screenshot proof for representative public pages.

## Commands

Use the isolated link-render Playwright config, not the default Playwright config, so the run does not reuse another app on port 3000.

```bash
pnpm exec vitest run src/config/navigation.test.ts src/components/layout/CommandPalette.test.tsx src/components/layout/MobileNav.test.tsx src/components/layout/SavedBadge.test.tsx src/components/layout/Sidebar.test.tsx src/components/mobile/BottomTabBar.test.tsx
```

```bash
PW_PORT=3107 PW_BASE_URL=http://127.0.0.1:3107 pnpm exec playwright test --config=playwright.link-render.config.ts --project=link-render-chromium
```

Full release checks:

```bash
pnpm lint
pnpm build
```

## Screenshot Evidence

Screenshot proof is written under:

- `test-results/evidence/link-render/.playwright-output/`
- `test-results/evidence/link-render/homepage-link-audit/`

`test-results/` is gitignored. Do not commit screenshot evidence unless explicitly requested for an artifact bundle.

## Auth Prerequisites

Unauthenticated link-render checks assert that protected routes redirect to `/login?redirectTo=...`.

Authenticated dashboard navigation coverage depends on Supabase test users and auth storage state for all app roles:

- `homebuyer`
- `renter`
- `seller`
- `landlord`
- `agent`
- `provider`
- `mortgage_broker`
- `admin`

The auth setup files are `e2e/auth.setup.ts` and `e2e/fixtures/auth.ts`. Run authenticated dashboard E2E only after those test users exist in the target Supabase project.

## Out Of Scope

This coverage does not verify Stripe payments, OAuth provider behavior, 2FA, email delivery, RLS policy correctness, realtime subscriptions, Lighthouse scores, seeded-data counts, or complete dashboard business workflows.

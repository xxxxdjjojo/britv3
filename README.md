# TrueDeed

An all-in-one UK property portal. One platform for buying, selling, renting, and
letting — plus a vetted services marketplace, a national sold-price map, and
role-specific dashboards for buyers, renters, sellers, landlords, estate agents,
service providers, and admins.

Production: **https://www.truedeed.co.uk**

> Internal name: `britv3`. This is the v3 ground-up rebuild.

---

## What's inside

- **Search & discovery** — property search, map search, a national sold-price
  **market map** (PostGIS vector tiles over HM Land Registry data), area guides,
  and a free postcode price page.
- **Property pages** — listings with a self-gating "local area" section (schools,
  crime, transport, broadband, mobility, flood risk, planning, EPC).
- **Marketplace** — find and hire vetted providers (agents, conveyancers, surveyors,
  mortgage brokers, architects, tradespeople) via RFQ → quote → booking, with
  reviews and Stripe Connect payouts.
- **Tools** — 11 calculators (mortgage, stamp duty, affordability, rental yield,
  buy-vs-rent, and more).
- **Dashboards** — tailored experiences per role, gated by verification and
  subscription.
- **Admin** — a 24-section back-office: moderation, verifications, GDPR, billing,
  CMS, SEO, analytics, feature flags, system health, and the TrueDeed ledger.

---

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + MapTiler keys to boot
pnpm dev                     # http://localhost:3000
```

Minimum env to run: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_MAPTILER_API_KEY`. Everything else is
feature-gated and most integrations default to a free/mock provider. See
[CONTRIBUTING.md](CONTRIBUTING.md#environment-variables) for the full list.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Auth + Realtime + Storage) · MapLibre + MapTiler · Anthropic Claude ·
Stripe Connect + GoCardless · Resend · Inngest · Sentry · PostHog · pnpm.

---

## Common commands

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm start        # serve production build (use this for demos, not dev)
pnpm lint         # ESLint (must be 0 errors)
pnpm test         # Vitest unit/integration tests
pnpm test:e2e     # Playwright E2E
```

---

## Documentation

| Doc | What it covers |
|-----|----------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System map: routes, API/services, data model, auth, integrations, jobs |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, commands, testing, DB migrations, branch & landing workflow |
| [CLAUDE.md](CLAUDE.md) | Conventions, agent guidance, repo discipline |
| [DESIGN.md](DESIGN.md) | Design system: tokens, typography, colour, components |
| [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) | Security posture + risk register |
| [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) | Performance baselines + optimisation backlog |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| `docs/` | API reference, ADRs, runbooks, pricing-v2, TrueDeed phases |

---

## License

Private and proprietary. All rights reserved.

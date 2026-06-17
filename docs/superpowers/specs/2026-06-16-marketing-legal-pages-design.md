# Design: Marketing/Legal Pages — Implement & Brand-Align (Britestate)

- **Date:** 2026-06-16
- **Working copy (target):** `britv3` (canonical). App lives at top-level `britv3/src/app` (NOT the stale `britv3.0/` subdir referenced in CLAUDE.md).
- **Source of design intent:** Stitch project "Design Requirements (PRD)" (ID `15021896094385971092`). Stitch screens are **layout/content references only** — standalone Tailwind-CDN prototypes branded "EstateLegal" with placeholder content. They are NOT drop-in code.
- **Status:** Approved design. Ready for implementation planning (TDD).

## 1. Problem

Nine marketing/legal pages were specified in Stitch. An audit of `britv3` found:

| Page | Status | Route |
|---|---|---|
| HTML Sitemap | ✅ exists | `/sitemap-page` |
| First-Time Buyer Guide | ✅ exists | `/tools/first-time-buyer-guide` |
| Property Valuation | ✅ exists | `/valuation` |
| Legal Index Hub | ✅ exists | `/legal` |
| Fair Housing Policy | ❌ missing | — |
| Refund Policy | ❌ missing | — |
| Third-Party Services Disclosure | ❌ missing | — |
| Regulatory Information | ❌ missing | — |
| Professional Standards | ❌ missing | — |

Goal: build the 5 missing pages to the (re-branded) Stitch design, wire them into navigation so they are reachable and "working", and confirm the 4 existing pages render and are on-brand.

## 2. Decisions (locked)

1. **Target clone:** `britv3`.
2. **Design fidelity:** Port the rich Stitch editorial layout (sticky section nav, icon-medallion sections, bento grids, CTA cards) rebuilt with site components + Britestate brand tokens. Build one reusable shell. Do **not** redesign the 4 existing pages.
3. **Copy:** Draft proper Britestate-appropriate copy adapted from Stitch structure, using real entity/contact facts; mark regulator-specific claims and unknowns with the existing `[BRACKET]` placeholder convention + a visible "pending legal sign-off" note.

## 3. Brand & layout constraints

- **Page chrome is inherited** from `src/app/(main)/layout.tsx`: `<Header/>`, `<BreadcrumbsWrapper/>`, `<Footer/>`, `<CookieConsentBanner/>`. New pages render **content only**. Discard all Stitch nav/footer.
- **Brand tokens** (`src/app/globals.css`): `--color-brand-primary #1B4D3E`, `--color-brand-primary-light #2D7A5F`, `--color-brand-primary-lighter #E8F5EE`, `--color-brand-secondary #A07D2E` (gold), `--color-brand-secondary-light #F5ECD7`.
- **NO blue.** `--color-brand-accent (#2563EB)` and any `blue` utilities are banned on public/marketing pages (per marketing brand policy). Coherent single green system + sparing gold.
- **Fonts:** heading = Plus Jakarta Sans (`--font-heading`), body = Inter. (Stitch already targets these.)
- **Icons:** lucide-react (matches `/legal` hub). Do NOT use Material Symbols.
- **Server-first:** pages are Server Components with `Metadata`. Only the scroll-spy section nav is a small client component.

## 4. Architecture

### 4.1 Reusable shell — `src/components/legal/LegalPageShell.tsx` (Server Component)
Captures the Stitch editorial layout, re-branded. Props-driven, composable. Provides:
- **Hero:** optional eyebrow badge, `h1`, lead paragraph, "Last updated {date}".
- **Two-column body:** sticky left **"On this page"** nav + content area (`max-w-3xl`).
- **Legal-review note** block (visible banner when copy is pending sign-off).

### 4.2 Content primitives (`src/components/legal/`)
- `SectionNav.tsx` — **client** component; IntersectionObserver scroll-spy, anchor links, hover/focus/active states. Receives `{id, label, icon}[]`.
- `PolicySection.tsx` — icon medallion + `h2` + `scroll-mt` anchor + children.
- `CalloutCard.tsx` — emphasis card (brand-primary fill) with optional CTA.
- `NumberedSteps.tsx` — ordered procedure steps (mono numerals).
- `InfoGrid.tsx` / bento grid — 2–3 col grid of labelled cells (e.g. protected characteristics, processors).
- `ContactCTA.tsx` — contact/download block (no fake PDF; link to real contact or omit download).

Each page is a thin Server Component composing the shell + primitives, exporting `metadata` (title, description, canonical, robots) and JSON-LD where the existing `terms` page sets a precedent.

### 4.3 Page content outlines (drafted, legal-review-flagged)

- **`/legal/fair-housing` — Fair Housing Policy**
  Sections: Our Commitment (Equality Act 2010, Human Rights Act 1998) · Non-Discrimination Standards (bento grid of protected characteristics) · Accessibility Commitments (reasonable adjustments callout → contact CTA) · Reporting Procedures (numbered steps) · contact block.

- **`/legal/refunds` — Refund & Cancellation Policy**
  Sections: Scope & eligibility · Cooling-off rights (UK Consumer Contracts Regs — flag) · Non-refundable items · How to request a refund (numbered steps, tie to billing/Stripe) · Timescales · contact block.

- **`/legal/third-party-services` — Third-Party Services Disclosure**
  Sections: Why we use processors · **Authorized Data Processors** (info grid with real stack: Supabase, Stripe, Resend, Sentry, PostHog, MapTiler, Anthropic, Upstash — purpose + region per row) · How we vet partners · Links to Privacy/Cookies/DPA · contact block.

- **`/legal/regulatory` — Regulatory & Compliance Information**
  Sections: Company identity (Britestate Ltd, England & Wales, `[REGISTERED ADDRESS]`, `[COMPANY NUMBER]`) · Regulatory bodies & redress (Property Ombudsman / Trading Standards / ICO / HMRC AML — **flag**, do not assert FCA unless confirmed) · AML supervision · Complaints & escalation (link `/legal/complaints`) · contact block.

- **`/legal/professional-standards` — Professional Standards**
  Sections: Core Code of Conduct · Ethics & integrity · Technical standards (data, security, accuracy) · Verification & enforcement (numbered steps) · contact block.

### 4.4 Wiring (prevents orphaned pages)
- `src/config/navigation.ts` — add the 5 routes to the footer "Legal" group and the sitemap data.
- `src/app/(main)/legal/page.tsx` — add the 5 entries to the appropriate hub categories (Compliance / Platform / new "Standards & Fairness").
- `src/app/(main)/sitemap-page/page.tsx` — include the 5 routes.
- XML sitemap (`src/app/sitemap.ts` if present) — include the 5 routes.

## 5. TDD plan (RED → GREEN)

1. **Component tests (Vitest):** `LegalPageShell` + `SectionNav` render title, section anchors, CTA; `SectionNav` marks active section.
2. **Route tests:** each of the 5 pages renders its `h1` + each declared section id, and exports valid `metadata` (title, canonical, `robots.index`).
3. **Brand-guard test:** scan the 5 new page/components for banned tokens — `brand-accent`, `text-blue`, `bg-blue`, `#2563EB`, leftover `EstateLegal`, `material-symbols`. Must be zero.
4. **Link-render / E2E (Playwright, existing `playwright.link-render.config.ts`):** 5 routes return 200; each reachable from `/legal`, footer, and `/sitemap-page`; breadcrumbs render; no broken internal links.
5. **Responsive + a11y:** screenshots at 320/768/1024/1440; heading order (single `h1`, ordered `h2`); visible focus states on section-nav links; reduced-motion respected for scroll-spy smooth-scroll.
6. **Adversarial diff-vs-HEAD review** before commit: confirm no fabricated numbers/regulators, no dropped displayed data, no fake buttons (per prior restyle-agent drift).

## 6. Existing-page audit (in scope, light touch)
- Confirm `/sitemap-page`, `/tools/first-time-buyer-guide`, `/valuation`, `/legal` render (200) and contain no blue/`brand-accent` violations. Fix violations if found; no redesign otherwise.

## 7. Verification gate (from `britv3/`)
`pnpm build` · `pnpm lint` · `pnpm test` · targeted Playwright link-render + screenshots. "Never say it should work — confirm it works."

## 8. Out of scope
- Redesign of the 4 existing pages (beyond brand fixes).
- Real registered address/company number and final regulator determinations (legal sign-off).
- Any backend/dynamic data — all 5 pages are static content.

## 9. Risks
- **Regulatory accuracy:** property-sector regulators differ from generic Stitch claims (e.g. FCA). Mitigation: flag + placeholder, no unverified assertions.
- **Copy/data drift** from generated components. Mitigation: adversarial diff review (§5.6).
- **Clone divergence:** 6 sibling clones exist; build only in `britv3`.

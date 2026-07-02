# Implementation Prompt — Influence Strategy Build-Out (Web Surfaces)

> Hand this prompt to a senior full-stack engineer (or Claude Code session) working in the
> `britv3` repo. It is self-contained. Source strategy: `truedeed-influence-strategy.md`
> (Perception Engineering Playbook, July 2026). Codebase audit performed 2026-07-02.

---

## Role & mission

You are a senior full-stack engineer on TrueDeed (`britv3` — Next.js 16 App Router, React 19,
TypeScript strict, Tailwind v4, Supabase/RLS, Inngest, Resend + React Email, Upstash Redis,
PostHog, pnpm from repo root). Read `CLAUDE.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md` first.

The influence strategy commits TrueDeed to publishing "truths the incumbents are structurally
unable to publish" and gives three real-world news pegs (CAT certification hearing 2–3 Nov 2026,
PRS database rollout late 2026, RRA anniversary 1 May 2027). Your job is to build **every
website surface the strategy requires that does not exist yet**, in the strategy's own phased
order. The primary KPI is **agent sign-ups and listing supply**, not traffic — instrument
accordingly.

---

## Ground rules (non-negotiable)

1. **Repo discipline.** One worktree per task (`git worktree add ../wt-<name> -b feat/<scope> origin/main`),
   small PRs, squash-merge same day, `pnpm lint` 0 errors / `pnpm build` exit 0 / `pnpm test`
   green before any PR. Migrations only via `supabase migration new <description>`, one logical
   change per file, RLS on every new table. Conventions: services hold logic
   (`kebab-case-service.ts`, pure `build*()` split from async `get*()`), Server Components by
   default, tools live under `src/app/(main)/tools/*`.
2. **No fabricated numbers, ever.** This repo already ripped out a fabricated per-property
   sold-price page — see the comment in `src/app/(main)/sold-prices/[area]/[slug]/page.tsx`
   (invented "TrueDeed estimate" under false HM Land Registry attribution, now a
   `permanentRedirect`). That failure mode is the exact opposite of this strategy. Every figure
   on every new surface must trace to a real dataset, a published source (cited inline), or a
   clearly-labelled user input. If the data isn't defensible, the widget does not render
   (follow the self-gating pattern in `LocalAreaSection.tsx`).
3. **Legal red lines.** The Rightmove CAT claim is *alleged*, not proven — every mention uses
   "alleges/claim" language and links the source. Comparative-claim surfaces (Portal Cost
   Calculator, Passthrough Study page, £22k invoice) ship behind a feature flag and are only
   enabled after the founder confirms external legal review (CAP Code substantiation). Rights
   checkers carry a persistent "general information, not legal advice" banner and a visible
   content-version date. DMCC Act: no seeded reviews/members anywhere, no dark patterns on
   email capture; UK GDPR: granular consent per email audience, working per-audience unsubscribe.
4. **Methodology or it didn't happen.** Every data asset (report, index, league, tracker,
   award) gets a permanent `/methodology` sub-page: data sources, sample sizes, known caveats
   (e.g. ~3-month Land Registry registration lag), computation version. Publish caveats
   prominently — the caveats are the credibility.

---

## Audit: what already exists (build on it, do not rebuild)

| Existing asset | Where | Relevant to |
|---|---|---|
| Land Registry PPD ingest (monthly Inngest cron) + PPD↔listing matcher | `src/inngest/functions/truedeed-ppd-{ingest,match}.ts`, `src/services/truedeed/ppd-*`, `ppd_transactions` table | Reality Gap (1), Truth League (22), Time-to-Sell (3), Awards (19) |
| Postcode-first sold-price lookup | `/area-prices` (`src/app/(main)/area-prices/page.tsx`) | True Equity Checker (12) |
| Market map, h3-js, MapLibre, PostGIS MVT tiles | `/search/market-map`, `package.json` (`h3-js@4`) | Equity Checker choropleth (12) |
| 11 calculators + tools index | `src/app/(main)/tools/*` incl. `moving-cost-estimator` | Moving Stack (15), new tools' home |
| Newsletter capture (single list: email + `source`) + welcome email + `/unsubscribe` | `src/app/api/newsletter/route.ts`, `src/services/newsletter/newsletter-service.ts`, `src/emails/newsletter-welcome.tsx` | Agent Briefing (24), Deadline Diary (18), Bootcamp (25), Moving Truth (29) |
| Drip-email pattern (Inngest) | `src/inngest/functions/lifecycle-drip.ts` | Diary (18), Bootcamp (25) |
| Press page (CMS-backed, `cms_pages` type=press, currently empty) + admin CMS + email-campaigns admin | `/press`, `/admin/cms`, `/admin/email-campaigns` | Tribunal Data Pack (30), Data Wire (37) |
| Fee transparency (full commission tables, Hemnet-style) | `/fee-transparency`, `src/lib/billing-config.ts` | Margin Pledge (31) — adjacent, NOT the same |
| ~25 legal pages on a shared shell | `src/app/(main)/legal/*` | Pledge + compliance page pattern (42) |
| Blog incl. RRA explainer post; landlord guide | `src/content/blog/posts/renters-rights-bill-explained-2026.ts`, `/guides/landlord-guide` | Rights Checker (13) content seed |
| PostHog + experiments harness, feature flags admin | `src/lib/experiments.ts`, `/admin/feature-flags` | Gating comparative claims, KPI events |
| Compliance audit doc | `docs/compliance/PRE-LAUNCH-COMPLIANCE-AUDIT-2026-06-07.md` | Compliance Library (42) |
| **Sponsored placements system (CONFLICT — see Decision Gate 1)** | `src/services/placements/*`, `/api/placements/featured`, `/admin/placements`, `/admin/placement-products`, agent `billing/boost` page, `src/types/sponsored-placements` | No Premium Placement (43) |

**Missing entirely** (confirmed by grep across `src/`): Reality Gap, Postcode Truth League,
Time-to-Sell tracker, Ghost Listings page, Renters' Rights Checker, Section 13 checker,
portal passthrough calculator, any pledge page, open metrics page, Honest Agent Awards,
Fair Landlord Register, Deadline Diary, Agent Briefing, street report cards, forwardables,
compliance library, tribunal pack, reports section of any kind.

---

## Decision gates — get founder sign-off BEFORE building these

1. **Placements vs. "No Premium Placement, Ever" (43).** The codebase actively sells sponsored
   placements (services directory slots by type/category/town/postcode, agent "boost" billing
   page). Property *search ranking* appears placement-free (no placement input in
   `src/services/search/search-service.ts`), so the honest pledge available today is
   **"property search results are never sold — ranked by relevance and freshness only"**.
   Options: (a) scope the pledge to property search and keep directory placements (weakens the
   anti-Checkatrade narrative later, but is truthful); (b) sunset placements entirely
   (revenue decision, not yours). Do not publish any pledge wording broader than what the code
   enforces. Whichever option is chosen, add a regression test asserting property search
   ordering has no paid input.
2. **Margin Pledge (31) is irreversible.** Engineering builds the page and the annual
   unit-economics publishing mechanism only after the founder confirms the capped number
   against the financial model. Build everything else in Phase 1 without blocking on this.
3. **Fee copy consistency.** Strategy says "pay-on-completion £249"; `/fee-transparency` shows
   seller tiers £99/£249/£449 + No-Sale-No-Fee. All new surfaces must quote the real tier
   structure from `src/lib/billing-config.ts` (single source of truth), not the strategy doc's
   shorthand.
4. **Comparative-claims legal review** (Gate for enabling flags on 11, and the Phase 3
   passthrough-study page): founder confirms CAP-Code review done; until then the tools run
   dark (flag off) in production.

---

## Cross-cutting foundations (build first, everything reuses them)

- **`src/components/trust/` shared kit:** `NotLegalAdviceBanner` (variant: `rights | tax | finance`),
  `ContentVersionStamp` (renders "Checked against legislation in force on {date}, v{n}"),
  `MethodologyFooter` (sources list + caveats + link to methodology page),
  `SourcedFigure` (a number that *requires* a `source` prop — url + label — and renders the
  citation; use it for every external statistic so unsourced numbers are unrepresentable),
  `ShareBar` (WhatsApp-first share + copy-link + "email me this", PostHog-instrumented).
- **Newsletter audiences.** Migration: add `audience` column (enum:
  `consumer | agent_briefing | landlord_diary | ftb_bootcamp`) to the subscribers table used by
  `newsletter-service.ts` (default `consumer`), unique on (email, audience). Extend service +
  `/api/newsletter` schema, per-audience welcome emails, per-audience unsubscribe on the
  existing `/unsubscribe` route. Double opt-in for the two B2B/landlord audiences.
- **OG/share image infra.** One `next/og` `ImageResponse` route pattern
  (`src/app/api/og/[kind]/route.tsx`) themed per surface — used by Equity Checker, report
  pages, Truth League, Street Report Cards, Forwardables.
- **Reports scaffold.** Route group `src/app/(main)/reports/` with an index page and a
  reusable report shell (hero stat, chart blocks via existing `recharts`, methodology footer,
  edition switcher, `EmbargoGate` — an unlisted `?preview=<signed-token>` mode so an exclusive
  journalist can see an edition pre-publication; token = HMAC, same pattern as
  `QUOTE_SIGNING_SECRET` usage).
- **KPI instrumentation (the strategy's real scoreboard).** PostHog events:
  `tool_started`, `tool_completed`, `tool_shared`, `report_viewed`, `briefing_subscribed`,
  `pledge_viewed`, plus **attribution**: extend signup flow to capture
  `signup_source` (utm + referrer + first-touch tool/pledge page) so "agent sign-ups
  attributable to pledges/briefing" (Q1 KPI) is a queryable fact, not a guess.
- **Navigation & SEO.** Add a "Truth & tools" section to main nav/footer surfacing
  `/reports/*`, `/pledges`, `/metrics`, new tools; add all new public routes to the sitemap;
  JSON-LD (`FAQPage` on checkers, `Dataset` on reports).

---

## Phase 1 — ship now (July 2026): the tool trio + binding pledges + agent beachhead

### 1.1 Renters' Rights Checker (Campaign 13) — `/tools/renters-rights-checker`
Interactive decision tree: user picks role (tenant | landlord | letting agent) and answers ≤8
questions (tenancy start date, notice served?, rent raised recently?, advance rent asked?,
bidding situation?, deposit protected?, etc.) → plain-English statement of rights/duties under
the post-1-May-2026 regime with the statutory ground cited per answer (S21 abolition, Section 8
grounds, one-month advance-rent cap, bidding ban, Information Sheet duty, 31 July 2026
pre-May-S21 court cut-off).
- Content lives in versioned data files `src/content/renters-rights/` (typed nodes: question,
  answers, outcome, `citation: { instrument, section, url }`), so a housing-solicitor review
  can diff content without touching logic. Render server-side where possible; the tree itself
  is a small client component.
- Must use `NotLegalAdviceBanner` + `ContentVersionStamp`. Outcome page has `ShareBar` and a
  "get deadline reminders" CTA into the landlord diary audience (Phase 3) / consumer list.
- Acceptance: all paths covered by unit tests over the content tree (no dead ends, every
  outcome cites ≥1 instrument); e2e happy path; FAQ JSON-LD.

### 1.2 Portal Cost Calculator (Campaign 11) — `/tools/portal-cost-calculator`
"What does your agent pay the portals — and what does that mean for your sale?" Inputs: asking
price + region + (optional) agency size. Output: estimated per-listing portal cost embedded in
the transaction, as a **range**, with every assumption visible and editable.
- All constants in `src/config/portal-cost-assumptions.ts` with `SourcedFigure`-compatible
  citations (Rightmove published ARPA, published commission-share analyses from the CAT
  coverage, average commission rates). Label the output "estimate" in the UI, always.
- **Ships behind PostHog flag `portal_cost_calculator` (Decision Gate 4).** Copy uses
  "the claim alleges…" phrasing for litigation-derived figures.
- Acceptance: unit tests on the pure `buildPortalCostEstimate()`; assumptions panel renders
  every constant + source; flag-off = 404.

### 1.3 True Equity Checker (Campaign 12) — upgrade `/area-prices`, don't rebuild
`/area-prices` already does postcode-first median sold prices. Upgrade it into the branded
consumer front door:
- Rename surface (route stays, add `/tools/true-equity-checker` → redirect) with H3 choropleth
  of the surrounding area reusing market-map tiles, 12-month trend sparkline from
  `ppd_transactions`, and street-level recent sales list (real PPD rows only — price, date,
  property type; no estimates, per Ground Rule 2).
- `ShareBar` + OG image per postcode ("Median sold price in DA1 …") via the OG route.
- Acceptance: e2e postcode search → choropleth + list render; OG image snapshot test;
  `report_viewed`/`tool_shared` events fire.

### 1.4 The pledges launch (Campaigns 31 + 43 + 45 + 42) — "the portal that binds its own hands"
- `/pledges` hub + three child pages on the legal-shell pattern:
  `margin-pledge` (Gate 2), `no-premium-placement` (Gate 1 wording), `your-data-your-leads`.
  Each: the pledge in one sentence, what it binds us to, how to verify us keeping it, dated
  changelog (any edit is visible — that's the point).
- **Results-page disclosure (43):** one quiet line component on `/search` (+ map variants):
  "Results ranked by relevance and freshness. Placement here cannot be bought." Rendered from
  the same config as the pledge page so copy can't drift. Add the no-paid-input ranking
  regression test (Gate 1).
- **Your Data, Your Leads (45):** policy page + the feature that makes it true — CSV export of
  the agent's own leads/enquiries in `dashboard/agent/leads` (service-layer export, RLS-scoped
  to the agency, audit-logged).
- **Compliance Library (42):** `/compliance` index publishing existing compliance work
  (start with `docs/compliance/PRE-LAUNCH-COMPLIANCE-AUDIT-2026-06-07.md`, converted to a page;
  structure for adding the DPIA-style and data-controller analyses as the founder releases
  them). Plain-English intro per document, "why we publish this" footer.
- Acceptance: all four pages live, disclosure line on results pages, lead export downloads
  real rows in e2e, ranking regression test green.

### 1.5 Independent Agent Briefing (Campaign 24) — `/agent-briefing`
Landing page (what it is: weekly CAT-case/fee-benchmark/RRA briefing for independent agents;
what it is not: a sales letter) + email capture into `agent_briefing` audience (double opt-in)
+ public archive route `/agent-briefing/archive/[slug]` (CMS-backed via existing `cms_pages`
or MDX in `src/content/briefing/` — pick whichever the admin email-campaigns flow can author
against with less new code; sending itself goes through existing email-campaigns admin).
- Footer-only TrueDeed mention in the email template (React Email), per strategy.
- Acceptance: subscribe → confirm → welcome flow e2e; archive page renders; per-audience
  unsubscribe verified.

### 1.6 Total Cost of Moving Stack (Campaign 15) — upgrade `/tools/moving-cost-estimator`
Add the missing categories (agent commission by tier, conveyancing, survey, SDLT — reuse the
stamp-duty calculator's logic as a service, removals, EPC, portal passthrough estimate linking
to 1.2's assumptions) and render the itemised "brutal stack" with TrueDeed's real tiers from
`billing-config.ts` anchored against it. Sources on every line item.
- Acceptance: totals unit-tested; SDLT figures match the existing stamp-duty calculator for
  identical inputs (single source of truth — refactor, don't duplicate).

---

## Phase 2 — August–September 2026: own the data narrative

### 2.1 Reality Gap pipeline + Report #1 (Campaign 1) — `/reports/reality-gap`
The flagship index: asking prices vs actual sold prices, by region and property type.
- **Data:** you already have both sides — listing asking prices in the listings tables, sold
  prices in `ppd_transactions`, and a scored PPD↔listing matcher
  (`src/services/truedeed/ppd-match-service.ts`). Compute two tiers and label them:
  (a) *matched-pair gap* (same property listed→sold, via matcher, high confidence, smaller n);
  (b) *area-median gap* (median asking of listings vs median PPD sold in period+area, larger n,
  cruder). Publish both, never blend silently.
- Migration: `reality_gap_snapshots` (period, area_id/region, property_type, tier, median_asking,
  median_sold, gap_pct, sample_n, methodology_version; public-read RLS like `broadband_coverage`).
  Inngest job chained after the monthly PPD match to recompute; suppress any cell with
  sample_n below a disclosed threshold.
- Report page on the reports scaffold: national headline, regional table, property-type split,
  edition switcher (quarterly), methodology page (include the ~3-month registration-lag caveat
  and the no-cherry-picking rule from the strategy), `EmbargoGate` for the Exclusive Data Line
  (Campaign 39), OG image, downloadable CSV of the published aggregates.
- Acceptance: pipeline idempotent (re-run = same rows); snapshot tests on `build*` transforms
  against a fixture PPD set; low-sample cells hidden in UI and CSV.

### 2.2 Postcode Truth League (Campaign 22) — `/reports/reality-gap/league`
Derivative table of 2.1: towns/areas ranked by smallest asking→sold gap, filterable by region,
per-area shareable OG card ("How honest are asking prices in Medway?"). Zero new data work.

### 2.3 Street Report Cards (Campaign 50) — extend the Equity Checker
"Report card" print/share view per street/postcode sector: sold-price history table (real PPD
rows), 5-year area trend, date-stamped, TrueDeed watermark small. Printable (print CSS) +
downloadable OG-image card for WhatsApp. Public Land Registry data only, no owner commentary.

### 2.4 Open Metrics Page (Campaign 44) — `/metrics`
Live public dashboard, numbers the incumbents would never show: active listings count,
median listing→completion days on-platform (PPD-matched), enquiries per listing, complaint
count + median resolution time (from the existing moderation/reported tables), uptime.
- Migration: `platform_metrics_daily` (metric, date, value, public-read RLS) + nightly Inngest
  aggregation; uptime fed by the existing CI/cron infra (a GitHub Actions ping writing a row —
  precedent: `.github/workflows/mobility-backfill.yml`).
- Rule (strategy): metric definitions are versioned on the page; never quietly redefine.
  Small numbers are fine — small-but-honest is the point. Do not launch a metric you can't
  compute reliably; fewer real metrics beat padded ones.

### 2.5 Time-to-Sell Tracker (Campaign 3) — `/reports/time-to-sell`
Postcode-district median days listing→completion from matched pairs. Same scaffold as 2.1.
**Only ship districts where matched sample_n clears the threshold**; show coverage honestly.

### 2.6 Local Paper Data Wire (Campaign 37) — admin tooling, not a public page
`/admin/data-wire`: pick area(s) + edition → generates a localised press pack (headline,
3 pre-written paragraphs from `reality_gap_snapshots` + truth-league position, chart PNGs via
the OG route, methodology boilerplate, "data: TrueDeed" attribution) as downloadable zip/email.
Founder sends them; engineering just makes generation one click. Templates in
`src/content/data-wire/`.

---

## Phase 3 — October–December 2026: the tribunal window and the landlord beachhead

### 3.1 Tribunal Data Pack (Campaign 30) — `/press/portal-fees-briefing` — **hard deadline: live by 19 Oct 2026**
Journalist-ready briefing page + downloadable PDF: history of UK portal fees (sourced),
published per-branch fee figures, international portal-fee comparison, passthrough estimates
(from 1.2's assumptions file), founder availability + contact block, all litigation facts
attributed with links. Publish via existing press CMS if it can hold structured content;
otherwise a code page. Every figure through `SourcedFigure`. Legal-review gate applies.

**3.1a Portal Cost Passthrough Study page (Campaign 2) — `/reports/portal-cost-passthrough`,
live mid-October.** The substantive pre-hearing agenda-setter: report page on the reports
scaffold combining the 1.2 assumptions file, public ARPA/commission figures, and the founder's
agent-survey results (fieldwork is operational; the page ingests a results file with disclosed
n and method). Highest legal-care item in the strategy — flag-gated until Gate 4 sign-off.

### 3.2 Landlord Deadline Diary (Campaign 18) — `/landlords/deadline-diary`
Signup (audience `landlord_diary`, double opt-in) with 2–3 profile questions (existing tenancy
pre-May-2026? region? managing agent?) → personalised compliance timeline:
- Content: versioned `src/content/rra-deadlines/` (event, who it applies to, statutory source,
  date or trigger rule — e.g. PRS database windows as they're announced late 2026).
- Delivery: `.ics` calendar feed endpoint (`/api/landlords/deadline-diary/[token]/calendar.ics`)
  + Inngest scheduled emails T-30/T-7/T-1 (reuse `lifecycle-drip` pattern; per-audience
  unsubscribe). `NotLegalAdviceBanner` on everything.
- Acceptance: ics validates; drip schedule unit-tested with a fixture profile; deadline content
  updates require only a content-file change.

### 3.3 Landlord Transition Clinics (Campaign 26) — `/landlords/clinics`
Landing + next-session block (external webinar link is fine), past-session library (recording
embed, transcript, extracted FAQ that feeds SEO), reminder signup into `landlord_diary`
audience. Mostly content plumbing — keep it thin.

### 3.4 Fair Landlord Register (Campaign 20) — `/fair-landlord-register`
Public charter (the pledge items from the strategy — phrased so nothing implies legal vetting:
"a pledge, not a vetting service" appears verbatim) + signup for landlords (auth'd role) +
searchable public register (name/area/date-signed).
- Migration: `fair_landlord_pledges` (landlord user id, display name, area, pledged_at,
  status; public-read of published rows only). Revocation flow + moderation hook into
  existing admin moderation. Launch timed to PRS-database news wave (Nov).

### 3.5 Honest Agent Awards — nominations + scoring engine (Campaign 19) — `/awards`
The keystone agent-acquisition machine. December: nominations open; February: ceremony (Phase 4).
- **Scoring (all from data you have):** pricing accuracy (final asking vs PPD sold, matched
  pairs per agency), time-to-sell vs local median (from 2.5's data), listing hygiene
  (staleness/withdrawn share). **Fall-through rate: only if `sale-progress`/transaction
  milestone data has real coverage — check first; if coverage is thin, drop the metric for
  year 1 and say so in the methodology.** Never rank on votes.
- Migration: `agent_award_scores` (agency_id, period, metric, value, sample_n,
  eligibility_flag). Service computes from PPD matches + listings; minimum-sample rule
  disclosed. Pages: `/awards` (what+why+criteria — fully public, no pay-to-enter, ever),
  `/awards/methodology`, agency standing visible privately in agent dashboard
  ("your current standing" — this is the acquisition hook), nomination/opt-in flow.
- Acceptance: scoring pure-functions fixture-tested; an agency below min-sample is excluded
  and told why; no code path accepts payment anywhere near eligibility.

### 3.6 Boxing Day automation (Campaign 32)
Annual Reality Gap edition + Street Report Card push scheduled for 26 Dec: an Inngest scheduled
publish (edition flips public + cache revalidate) so nobody deploys on Christmas. Small task,
big window.

---

## Phase 4 — January–June 2027: status machinery and the anniversary

- **4.1 Awards ceremony surfaces (19):** winners pages per category/region (each a local-press
  landing with quotes + data certificate), embeddable **badge** (SVG + signed verification URL
  `/awards/verify/[badgeId]` so a badge on an agency's site links to proof), winner press-pack
  generation reusing the Data Wire generator.
- **4.2 Section 13 Fairness Checker (14) — `/tools/rent-increase-checker`:** current rent +
  proposed + postcode → comparison vs local rent distribution + plain-English tribunal-route
  guide (content-file, cited, `NotLegalAdviceBanner`). **Data honesty:** use your own lettings
  listings only where district sample_n clears threshold; otherwise fall back to ONS PIPR
  district stats via a new `scripts/ingest-ons-rents.mjs` (follow `ingest-ofcom-broadband.mjs`
  precedent: public-read RLS table `ons_rent_stats`, pinned-cert `SUPABASE_DB_URL`). Frame as
  "know your options", never "you should challenge". Ship before spring rent-review season.
- **4.3 Forwardables library (48) — `/share`:** gallery of single-image WhatsApp-optimised
  explainers rendered from content files through the OG-image route (so facts stay editable +
  date-stamped in one place), each with source line + version date baked into the image.
  Download/share instrumented.
- **4.4 RRA Compliance Barometer report page (4)** on the reports scaffold (survey fieldwork is
  operational, not code — page ingests a results file) and **4.5 the "One Year of the RRA"
  anniversary report** (Barometer #2 + diary/checker usage aggregates + tribunal stats),
  targeted live 1 May 2027.
- **4.6 FTB Bootcamp (25):** 6-email drip (audience `ftb_bootcamp`, lifecycle-drip pattern) +
  landing; content files; referral-partner disclosure line in every email.
- **4.7 Open Metrics annual review (44):** auto-generated "a year of our numbers, warts
  included" edition from `platform_metrics_daily`.

---

## Explicitly NOT engineering work (don't build; provide listed support only)

r/HousingUK presence (28), podcast circuit (36), university partnership (38), broker CPD
pack (40), charity guide (41), survey fieldwork for 4/9, Agents Off the Record video (49),
£22k invoice visual (33), Ghost Listing Amnesty moderation ops (34), Self-Seller Circle
community (27). Engineering support where noted: reports scaffold hosts survey results;
OG route can render the invoice visual if the founder supplies sourced figures; amnesty
gets a moderated submission form **only if** the founder commits to moderation SLA (else skip);
the Ghost Listings Audit (6) is manual sampling fieldwork — when the founder runs it, host the
results as a `/reports/*` edition (aggregates only, no named competitors' listings).
Backlog by explicit strategy choice (Tier ★, revisit at the Q4 strategy review): Fall-Through
Index (5), FTB Stress Index (7), Conveyancing Delay League (8) + conveyancer rankings (21),
Retrofit (10), Leasehold checker (17), Offer Strength scorer (16), roadmap voting (46),
fall-through refund rule (47 — contingent-liability modelling first), Put-It-In-Writing
charter page (35 — trivial to add later), Moving Truth newsletter (29 — the `consumer`
audience is already provisioned in the Phase-1 refactor), trades mark (23 — Year 2 flank,
do not touch).

---

## Sequencing, sizing, and the founder-bandwidth constraint

Work the phases in order; within Phase 1, order: cross-cutting foundations → 1.1 → 1.4 → 1.5
→ 1.3 → 1.2 (flag-gated anyway) → 1.6. Each numbered item is one worktree/PR-sized unit
(split 2.1 into pipeline PR + page PR). Two calendar anchors override everything:
**19 Oct 2026** (3.1 live pre-hearing) and **26 Dec 2026** (3.6 scheduled). If capacity forces
cuts, cut from Phase 2 breadth (2.5, 2.6 slip) — never from 1.1/1.4/1.5, which are the
strategy's agent-beachhead spine.

## Definition of done (every item)

1. `pnpm lint` (0 errors), `pnpm build` (exit 0), `pnpm test` green; `pnpm check:migrations`
   passes; e2e for each new user-facing flow.
2. New tables: RLS policy + regenerated `database.types.ts`.
3. Every external figure renders through `SourcedFigure`; every rights/tax surface carries
   `NotLegalAdviceBanner` + `ContentVersionStamp`; every data asset links a methodology page.
4. PostHog events wired (`tool_*`, `report_viewed`, `briefing_subscribed`, signup attribution).
5. Added to nav/footer + sitemap; OG image renders; mobile checked.
6. Comparative-claim surfaces: feature flag off in prod until Decision Gate 4 sign-off recorded.
7. Manually verified working — never "should work" (repo Verification Protocol).


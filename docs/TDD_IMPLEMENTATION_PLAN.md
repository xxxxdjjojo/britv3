# TDD Implementation Plan — TrueDeed (britv3)

> **Audit date:** 2026-06-20.
> **Status:** Gate A complete. Plan below is **recommended PR sequence**,
> subject to founder approval before any production code changes.
> **Source-of-truth priority:** master prompt > PRD > current Stitch > working
> DB > existing architecture > running behaviour > historic docs.

---

## Plan principles

- One coherent feature/repair per PR.
- Red → green → refactor. Each fix starts with a failing test.
- No unrelated refactor.
- All PRs reference `REQUIREMENTS_TRACEABILITY.md` IDs.
- Migrations are additive only (no destructive DB changes in initial pass).
- P0 first, then P1, then P2, then P3.
- Stitch parity work (P1) is **gated on a fresh Stitch API key** — see
  `STITCH_SCREEN_REGISTRY.md`.

---

## Phase 0 — Unblocking & hygiene (do first, all low-risk)

Estimated effort: 1 day.

| PR | Title | Tests added | Risk |
|---|---|---|---|
| 0.1 | `chore(security): rotate leaked Stitch key, move to env var` | — | low; secret rotation |
| 0.2 | `fix(lint): clear 48 errors blocking CI` | — | low; mechanical |
| 0.3 | `chore(docs): fix CLAUDE.md Next.js version drift (16.2.1 → 16.2.9); update .env.example RESEND_FROM_NAME` | — | trivial |
| 0.4 | `chore(rebrand): sweep remaining Britestate refs (gated by allowlist)` | snapshot | medium; needs visual review |
| 0.5 | `chore(cleanup): archive or convert stale ad-hoc clones to worktrees` (PDR-003) | — | low; founder approval needed for deletion |

## Phase 1 — P0 broken/misrouted core flows

Estimated effort: 2-3 days.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 1.1 | `fix(nav): repoint seller/landlord/agent sidebar CTAs to real create routes` (M1-M3) | e2e: `dashboard-sidebar-ctas.spec.ts` — assert each CTA lands on the create form, not 404 | WS-ROUTING |
| 1.2 | `fix(nav): Get Quotes → /post-a-job (deferred auth)` (M4) | e2e: `get-quote-deferred-auth.spec.ts` — anon user reaches the form; auth requested only at final submit | WS1.A |
| 1.3 | `feat(search): remove silent mock-listing fallback or add demo-data banner` | unit: `search-actions.test.ts` — empty DB returns empty result, not 8 fabricated listings; or visible banner state | data-integrity |
| 1.4 | `refactor(email): collapse duplicate email services into one canonical wrapper` | unit: `email-service.test.ts` — single import path; throws-or-logs consistently | PDR-004 / WS11 |
| 1.5 | `feat(email): pre-send suppression-list check; dead-letter queue; user-visible resend` | unit + integration | WS11 |

## Phase 2 — Workstream 1 deepening (Post a Job / Get a Quote / Valuation)

Estimated effort: 3-4 days. Gated on Stitch access for visual parity.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 2.1 | `feat(post-a-job): anonymous server-backed draft + claim after auth` | unit: draft ownership/claim; integration: refresh persists draft; e2e: full journey submits exactly once | WS1.A |
| 2.2 | `feat(valuation): unify Value My Property + Free Instant Valuation into one canonical journey` | e2e: both CTAs enter same flow; address entry is first step | WS1.B / WS8.A |
| 2.3 | `feat(compare): property IDs preserved in URL/session; distinct from provider comparison` | e2e: `/compare` keeps selected IDs through navigation; provider compare not confused | WS1.C / WS8.F |
| 2.4 | `feat(rental-search): independent rental filters (no buy filter leakage)` | e2e: rent URL never shows buy filters; URL state round-trips; DB predicate matches | WS1.D / WS5.B |

## Phase 3 — Workstream 2 (Consumer auth simplification)

Estimated effort: 2 days.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 3.1 | `feat(auth): remove first/last name from buyer+renter signup (keep nullable columns for professionals)` | unit: validation rejects names on consumer path; integration: professional path unchanged; e2e: signup completes | WS2 |
| 3.2 | `feat(auth): post-a-job draft resumes after auth; valuation flow resumes after auth` | e2e: both resume flows | WS2 |

## Phase 4 — Workstream 3 (Stitch parity)

Estimated effort: 5-10 days. **Gated on fresh Stitch API key.**

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 4.0 | `chore(stitch): fetch all 14 supplied screens + catalogue missing ones` | — | WS3 / §A-D-E |
| 4.1 | `feat(post-a-job): port Stitch screen 079c8886… to native components` | visual-regression: desktop + tablet + mobile vs approved image | WS3 / A |
| 4.2 | `feat(sold-prices): port 26427d4c…` | visual-regression | WS3 / B1 |
| 4.3 | `feat(market-trends): port c80ed119…` | visual-regression | WS3 / B2 |
| 4.4 | `feat(area-guide): port 745318fd… (Isleworth) + f0acfce1… (Kensington)` | visual-regression | WS3 / B3-B4 |
| 4.5 | `feat(services): port Service Category b950fff5… + Search Hub bd11c191… + Mortgage Advisor fd6e86df…` | visual-regression | WS3 / C1-C3 |
| 4.6 | `feat(landlord-onboarding): port 3-screen sequence c5ae2820 + f23dd993 + 32310658` | e2e: step progression, back nav, refresh persistence, validation, draft save, final submit | WS3 / D1-D3 |
| 4.7 | `feat(buyer-dashboard): port Messages a336220d + Offer Tracking 475b4efc + Document Vault 41c5c291 + AI Match 7e059b5b` | e2e: each widget shows real DB data OR explicit empty/unavailable state | WS3 / E1-E4 |
| 4.8 | `feat(design-tokens): extract reusable TrueDeed token layer (typography, cards, forms, buttons, empty states)` | unit: token usage in approved routes | WS3 |

## Phase 5 — Workstream 4 (Area prices & market trends)

Estimated effort: 3-4 days.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 5.1 | `feat(area-prices): resolve W5 4RZ to canonical geography; highlight polygon; remove popup; add graph beneath` | unit: geography resolver; visual: W5 4RZ renders correctly without popup; e2e: graph loads | WS4.A |
| 5.2 | `feat(market-trends): monthly snapshot pipeline; public pages read precomputed only; failed-snapshot fallback` | unit: snapshot idempotency; integration: failed-download fallback; e2e: no runtime external API | WS4.B |

## Phase 6 — Workstream 5 (Rent experience)

Estimated effort: 5-7 days. **Partially gated on rental-filter screenshots.**

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 6.1 | `feat(rent-landing): dedicated /rent page (search, featured, insights, guidance, CTAs)` | e2e: page renders all sections | WS5.A |
| 6.2 | `feat(rental-filters): only fields backed end-to-end; URL state; map mode` | unit: filter predicates; e2e: each filter connects UI → typed state → URL → API → DB → cards | WS5.B |
| 6.3 | `feat(renter-guide): substantial content hub (17 sections per WS5.C)` | content workflow: draft → source review → legal → approved → published; metadata validation | WS5.C |
| 6.4 | `feat(build-credit): integration-ready page; neutral branding until partner approved` | e2e: page renders with partner boundary; no false "in association with" | WS5.D |
| 6.5 | `feat(renters-insurance): info + referral page; FCA perimeter review documented` | compliance-check | WS5.E |

## Phase 7 — Workstream 6 (Auction Centre)

Estimated effort: 2-3 days.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 7.1 | `feat(auction-centre): educational MVP (UK-specific); original content; legal-review status` | content workflow; e2e: page renders all sections | WS6 |

## Phase 8 — Workstream 7 (Services)

Estimated effort: 3-4 days.

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 8.1 | `feat(estate-agents): confirm compiles; verify data contract; minimal fix only if needed` | build/typecheck | WS7.A |
| 8.2 | `feat(mortgage-advisor): wire Stitch fd6e86df… to real advisor records` | integration: page resolves DB-backed providers | WS7.B |
| 8.3 | `feat(conveyancers-solicitors): use Service Category b950fff5… template` | integration | WS7.C |
| 8.4 | `feat(provider-landing): public /providers page using Search Hub bd11c191…` | e2e | WS7.D |
| 8.5 | `feat(provider-link-integrity): provider exists, active, category matches, coverage area matches` | integration | WS7.F |

## Phase 9 — Workstreams 8-13 (Tools, content, seller plans, email deepening, onboarding, buyer dashboard)

These are mostly folded into Phases 4-7 above. Remaining:

| PR | Title | Tests | Requirement |
|---|---|---|---|
| 9.1 | `feat(calculators): inventory + formula documentation; no undocumented financial calculations published` | unit: formula tests | WS8.E |
| 9.2 | `feat(seller-plans): apply design tokens; clear plan/fees/CTA` | visual | WS10.A |
| 9.3 | `docs(pricing-research): competitor scan; recommendation (NO price changes)` | — | WS10.B |
| 9.4 | `feat(email): add missing templates (valuation, landlord onboarding, professional invitation)` | unit | WS11 |
| 9.5 | `feat(content): editorial workflow applied to all guides; dated, jurisdiction-specific, sourced` | content workflow | WS9 |

---

## Critical path & dependencies

```
Phase 0 (hygiene) ─┐
                   ├─→ Phase 1 (P0 fixes) ─→ Phase 2 (deepening)
                   │                              │
                   │                              ├─→ Phase 3 (auth)
                   │                              │
                   │                              ├─→ Phase 4 (Stitch parity) ◀── gated on fresh Stitch key
                   │                              │       │
                   │                              │       └─→ Phases 5-9 (verticals)
                   │                              │
                   └─→ Phase 0.1 (Stitch key) ────┘
```

## Total estimate

- Phase 0: 1 day
- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 2 days
- Phase 4: 5-10 days (largest)
- Phase 5: 3-4 days
- Phase 6: 5-7 days
- Phase 7: 2-3 days
- Phase 8: 3-4 days
- Phase 9: 3-5 days

**Total: ~30-45 working days of senior engineering effort.** With parallel
subagents on independent verticals (5-9), elapsed time compresses to ~3-4
weeks of focused execution.

## What I can do THIS session after approval

If the founder approves Phase 0 + Phase 1 only (the smallest safe increment):
- Fix the 3 dead sidebar CTAs (M1-M3) with tests
- Repoint Get Quotes (M4) with tests
- Clear lint regressions
- Rotate the Stitch key handling (need founder to provision new key)
- Collapse the duplicate email services
- Update CLAUDE.md / .env.example brand drift

These are surgical, low-risk, and unblock everything else.

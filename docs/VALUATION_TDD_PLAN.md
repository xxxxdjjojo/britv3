# Valuation TDD Plan — red → green → refactor

> **Date:** 2026-06-18
> **Status:** Test plan. Honours `VALUATION_SCAFFOLDING.md`,
> `VALUATION_MODEL_SPEC.md`, `VALUATION_UX_FLOW.md`,
> `VALUATION_REQUIREMENTS_TRACEABILITY.md`.
>
> **Workflow per item:** write the failing test (RED) → minimal implementation
> (GREEN) → refactor (IMPROVE). **Build caveat:** `pnpm build` has a pre-existing
> inngest/webpack failure (Scaffolding §8.4) — verify via `tsc` + `vitest` +
> Playwright + dev server, not `next build`. Engine back-test runs against remote
> `price_paid_data` or the `db-tests` Docker sample; **no accuracy claimed before
> the back-test runs** (Scaffolding §8.5).

Test runners: Vitest (unit/component/integration), Playwright
(`e2e/property-valuation-flow.spec.ts`, a11y via axe), `vitest.db.config.ts`
(`db-tests`) for SQL-backed integration.

---

## 1. Unit — model engine (`src/services/valuation/*`)

Every §12 Model-Spec constant must have a test proving its effect; no inline
literals (assert the engine imports from `model-constants.ts`).

| # | Test | Maps to |
|---|---|---|
| U1 | `weightedMedian` returns correct value on weighted skewed input | Model §5 |
| U2 | `trimmedMean` drops `TRIM_FRACTION` top/bottom before averaging | Model §5 |
| U3 | robust blend = `0.6·median + 0.4·trimmedMean` | Model §5 |
| U4 | price-sanity drops `< PRICE_FLOOR` and `> PRICE_CEILING` (£1 outlier killed) | Model §2.6, Audit §9 |
| U5 | Tukey-fence drops rows outside `[Q1−1.5·IQR, Q3+1.5·IQR]` | Model §2.6 |
| U6 | base filter excludes `ppd_category='B'` and `record_status='D'/'C'` | Model §2.1, Audit §5/§8 |
| U7 | tenure enforced as hard filter for flats, soft weight for unknown-tenure houses | Model §2.3/§3 |
| U8 | new-build comps capped at `NEW_BUILD_MAX_SHARE` when valuing established stock | Model §2.7, Audit §11 |
| U9 | de-dup keeps most recent per `(postcode,paon,saon)` | Model §2.8, Audit §7 |
| U10 | distance weight = `exp(-d/DIST_HALFLIFE_KM)`; recency = `exp(-m/RECENCY_HALFLIFE_MO)` | Model §3 |
| U11 | bedroom/floor-area weights are neutral (=1) when input absent | Model §3, §11 |
| U12 | time-adjust: `adjusted = price·idx_val/idx_sale`; `=price` when index no-op | Model §4 |
| U13 | HPI series selection priority district→region→national; recorded in `inputs_used` | Model §4 |
| U14 | `effective_comparable_count` = Kish `(Σw)²/Σw²` | Model §5 |
| U15 | `estimated_value`/low/high rounded to nearest £5,000 | Model §5 |
| U16 | range widens via `THIN_EVIDENCE_FACTOR` as effective_n shrinks | Model §5 |
| U17 | fallback A when exact address + prior sale + effective_n≥8 | Model §6 |
| U18 | fallback B/C/D/E triggers at exact thresholds (5, 3, <3) | Model §6 |
| U19 | level E returns `null` estimate + reason (no fabricated number) | Model §6 |
| U20 | Scottish postcode → level E, `evidence_quality='unavailable'` | Model §6, Audit §4 |
| U21 | evidence-quality classifier high/medium/low/unavailable boundaries | Model §7 |
| U22 | no-HPI run caps `evidence_quality` at `medium` | Model §1/§4 |
| U23 | return shape exactly matches `ValuationResult` (all keys, types, `model_version='vmp-comparables-1.0.0'`) | Model §8 |
| U24 | `inputs_used`/`missing_inputs` populated (e.g. `floor_area_m2`, `hpi`) | Model §8 |

## 2. Unit — validators & utilities

| # | Test | Maps to |
|---|---|---|
| U25 | postcode normaliser/validator (valid, lowercase, spacing, invalid) | UX §2 |
| U26 | details `zod` schema: required (type/beds/tenure/new-build) reject empties; optionals allowed | UX §3 |
| U27 | floor-area bounds 5–10,000; bedrooms 0–20 | UX §3 |
| U28 | OTP code shape (6 digits) validator | UX §5 |

## 3. Component (Vitest + Testing Library)

| # | Test | Maps to |
|---|---|---|
| C1 | intro page renders limitations + up-front "verify email" message | UX §1, E2E Scenario 1 |
| C2 | address step: geocode success lists candidates; manual fallback reachable | UX §2 |
| C3 | address step: Scottish postcode shows "no data for Scotland", blocks numeric advance | UX §2, Audit §4 |
| C4 | details form renders all 12 questions; conditional subtype/flat fieldsets reveal | UX §3 |
| C5 | details form blocks advance until required answered; optionals never block | UX §3 |
| C6 | review step shows summary + "estimate ready" but **no figure** | UX §4 |
| C7 | review step: just-in-time privacy notice rendered (counsel-flag marker present) | UX §4 |
| C8 | OTP component: 6 cells, paste, resend cooldown disabled state | UX §5 |
| C9 | result page renders value+range with "estimated"/"indicative" wording, never "exactly" | UX §6 |
| C10 | result page renders evidence badge, comparable list, limitations panel | UX §6 |
| C11 | result page area-level (level C) shows "median of N nearby sales" | UX §6 |
| C12 | result level E: no figure, agent recommendation shown | UX §6 |
| C13 | agent CTA: no pre-checked consent; lead action requires affirmative click | UX §6, Scaffolding §7 |

## 4. Integration — DB & API (`db-tests` / route handlers)

| # | Test | Maps to |
|---|---|---|
| I1 | canonical comparable query returns only `A`/`A`, correct type+tenure, recency window | Model §2, Dictionary §5 |
| I2 | adaptive radius widens `outward → 1 → 2 → 5km` until `MIN_EFFECTIVE_COMPS` | Model §2.4 |
| I3 | recency widens to 36mo only when short | Model §2.5 |
| I4 | exact-address prior-sale lookup uses `ppd_exact_match_idx` path | Model §6, Dictionary §1 |
| I5 | flat without SAON resolves at building level only | Model §6, Audit §6 |
| I6 | end-to-end engine call on a known outward (e.g. SW18) returns plausible robust median | Model §5, Audit §9 |
| I7 | valuation persisted with `model_version`, `inputs_used`, `data_cutoff_date` | Model §10 |
| I8 | valuation attached to **verified user only**; signed-out read denied | Scaffolding §6 |
| I9 | OTP send/verify rate-limited (fail-closed) | Scaffolding §6 |
| I10 | agent lead created only after affirmative request; writes `agent_leads` + scoped consent | Scaffolding §7 |
| I11 | no agent share without explicit handoff (negative test) | Scaffolding §7 |
| I12 | out-of-time / stale data: `data_cutoff_date` reflects ~3.5mo lag and is surfaced | Audit §2 |

## 5. E2E (Playwright — `e2e/property-valuation-flow.spec.ts`)

The 12 journey scenarios. Scenario 1 (CTA routing) is **already GREEN**.

| # | Scenario | Status |
|---|---|---|
| E1 | **CTA routing:** every "Value my property" CTA → `/value-my-property`, not `/search`; intro announces email verification | **DONE (green)** |
| E2 | sold-prices "Thinking of selling?" → `/value-my-property?postcode=…` | planned |
| E3 | address: postcode → candidate select → details | planned |
| E4 | address: manual fallback when no candidate | planned |
| E5 | Scotland postcode → honest "no data" path | planned |
| E6 | details: required validation blocks; optional skips allowed | planned |
| E7 | review shows "estimate ready", no figure | planned |
| E8 | verify-email OTP happy path → result revealed & saved | planned |
| E9 | result: value+range+evidence+limitations shown, indicative wording | planned |
| E10 | weak evidence → wide range + low/none rating | planned |
| E11 | agent request → lead created, scoped consent, not before request | planned |
| E12 | back/forward/refresh/deep-link preserve session; no localStorage of address/result | planned |

## 6. Accessibility (axe + keyboard)

| # | Test | Maps to |
|---|---|---|
| A1 | each route passes axe with no critical violations | UX all |
| A2 | full journey completable by keyboard only (postcode → OTP → result) | UX §2/§3/§5 |
| A3 | radio-groups/listbox/OTP have correct ARIA + focus management | UX §3/§5 |
| A4 | errors announced via `aria-live`; OTP cooldown announced | UX §2/§5 |
| A5 | reduced-motion honoured on progress/reveal | UX §7 |

## 7. Refactor checkpoints

After each GREEN block: extract model constants to one module (no inline
literals — re-run U-tests), keep files < 800 lines, ensure ≥ 80% coverage on
`services/valuation/*`, and confirm `tsc --noEmit` + `pnpm lint` clean before
landing (per Branch & Landing Discipline).
</content>

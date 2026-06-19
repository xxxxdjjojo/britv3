# Valuation Scaffolding — "Value my property" journey

> **Status:** Phase 1 discovery complete (2026-06-18). This document gates all
> production code for the valuation journey. It records what exists today, what
> we will build, and the dependency-ordered sequence.
>
> Companion docs: `VALUATION_COMPETITOR_RESEARCH.md`, `VALUATION_DATA_DICTIONARY.md`,
> `VALUATION_DATA_QUALITY_AUDIT.md`, `VALUATION_MODEL_SPEC.md`,
> `VALUATION_MODEL_VALIDATION.md`, `VALUATION_UX_FLOW.md`, `VALUATION_TDD_PLAN.md`,
> `VALUATION_REQUIREMENTS_TRACEABILITY.md`.

## 1. Product purpose

Let a UK homeowner get an **indicative automated property estimate** for their own
home, for free, in a few steps, then save it to a passwordless account and
optionally request a human valuation from a local estate agent. The estimate is
explicitly *not* a survey, mortgage valuation, or guaranteed sale price.

This **reverses a documented decision** (`docs/epic6costanalysis.md:127-156`,
`docs/epic6final.md:331`) to *not* build an AVM (cost/liability). The reversal is
sanctioned (owner decision, 2026-06-18) on condition that:
- the result is honestly labelled as indicative, never an exact value;
- no accuracy figure is published until measured on held-out sales;
- all legal/disclaimer copy is flagged for qualified counsel review.

## 2. Current route behaviour (the bug)

| Surface | File | Today | Target |
|---|---|---|---|
| Public valuation landing CTA | `src/app/(main)/valuation/page.tsx:55` | `<Link href="/search">` → **general search** | → `/value-my-property` |
| Sold-prices area "Thinking of selling?" | `src/app/(main)/sold-prices/[area]/[slug]/page.tsx:255-257` | button, **no href** | → `/value-my-property?postcode=…` |
| Nav + footer | `src/config/navigation.ts:212,344` | → `/valuation` (landing) | keep landing; landing CTA enters journey |

**Why the bug exists:** the public `/valuation` page was shipped as a marketing
landing only; its primary CTA was wired to `/search` as a placeholder because no
dedicated journey existed. The real valuation tool lives behind auth at
`/dashboard/seller/valuation` and was never exposed to anonymous users. Route
integrity is enforced by `src/config/navigation.test.ts` + the
`configured-navigation-render` Playwright suite, so the new route is registered
in `navigation.ts`.

## 3. Proposed route behaviour

Public `(main)` route group, server-persisted stepper:

```
/value-my-property                     intro; states email verification is needed up front
/value-my-property/address             postcode → candidate address select / manual fallback
/value-my-property/details             confirm/correct prefilled + missing characteristics
/value-my-property/review              "your estimate is ready" gate (no figure yet)
/value-my-property/verify-email        Supabase email OTP (passwordless)
/value-my-property/result/[valuationId] revealed + saved result, evidence, agent CTA
```

Refresh, back/forward, and deep links must work. Session state lives in
`valuation_sessions` (server, httpOnly cookie token) — never localStorage for
address/result/email/OTP/lead.

## 4. Existing relevant components & code (reuse, don't reinvent)

| Need | Reuse |
|---|---|
| Multi-step shell | `src/components/seller/wizard/WizardShell.tsx` (progress, back/continue, `?step=` pattern) |
| UI primitives | `src/components/ui/*` (shadcn base-nova: button, input, card, select, radio-group, dialog, progress, command) |
| OTP input | `src/components/auth/OTPInput.tsx` (6-digit, paste) |
| Postcode geocode | `src/services/geocoding/postcodes-io.ts` (`geocodePostcode`) |
| Comparable display | `src/components/seller/valuation/ValuationResult.tsx` (refactor to richer evidence) |
| Map | `src/components/map/PropertyMap.tsx` (`@vis.gl/react-maplibre`, MapTiler) |
| Forms | `react-hook-form` + `zodResolver`; schemas in `src/lib/validators/` |
| Toast | `sonner` |
| Aggregate SQL | `src/lib/market-map/*`, `src/services/market-map/*` (raw `pg` via `SUPABASE_DB_URL`) |

## 5. Existing data sources

| Source | Where | Use |
|---|---|---|
| **HM Land Registry Price Paid** | `public.price_paid_data` (REMOTE, **31,092,167 rows**, `price` whole pounds, generated `outward_code`, indexes `ppd_outward_date_idx`/`ppd_exact_match_idx`/`ppd_flat_match_idx`) | **primary AVM source** — comparables + subject prior sale |
| Postcode geocode | postcodes.io service | postcode → lat/long, district; postcode-level only (no address list) |
| Own listings | `public.listings` (+ `properties` PostGIS) | secondary address candidates; not for comps |
| OS UPRN/address gazetteer | **being loaded by owner** (CSV/GeoPackage → Supabase) | exact-address candidate list once available |
| HPI index | **none yet** → ingest UK HPI (gov.uk, OGL) | time-adjust comparables |

`ppd_transactions` (the empty service-role table) is the Truedeed matcher's table,
**not** the AVM source — do not confuse them.

## 6. Authentication architecture

Supabase Auth (`@supabase/ssr`), server/client/middleware already in place.
Passwordless = native `supabase.auth.signInWithOtp({ email })` +
`verifyOtp({ email, token, type: 'email' })` — no custom crypto. Account created
only on successful verify; existing user signed in. Rate-limit via
`createAuthRateLimiter` (fail-closed, Upstash + in-memory). Email via Resend +
React Email (`src/services/email/email-service.ts`). Profiles + `user_roles`
model; new valuation users default role `seller`. The verification email is a
service message — no marketing content.

## 7. Agent-handoff architecture

Reuse `agent_leads` (stages new_enquiry→closed, `source`) + `agent_agency_profiles`
+ `src/services/agent/agent-lead-service.ts` + `POST /api/agent/leads`. Add a
`source` value for instant valuation. Consent via existing `consent_records` +
`consent_audit_log` (types marketing/analytics/third_party) and a new
purpose-scoped agent-share consent event. No pre-checked boxes; auth ≠ marketing
consent. Lead created only after explicit affirmative request.

## 8. Gaps & unknowns

1. **No address gazetteer yet** → exact-address step uses PPD-derived + listings
   candidates + manual fallback until OS UPRN data lands; area-level estimate is
   stated honestly when no exact match.
2. **No floor area / EPC dataset** → no £/m²; floor area is optional user input.
   (CHANGELOG already concedes median sold price is the honest metric.)
3. **No HPI table** → must ingest UK HPI for time-adjustment.
4. **`pnpm build` has a pre-existing inngest/webpack failure** → verify via `tsc`
   + `vitest` + dev server, not `next build`.
5. Backtest must run on real `price_paid_data` (remote) or a loaded sample in the
   `db-tests` Docker harness; no accuracy claimed before it runs.

## 9. Dependencies

New libs: none required for MVP (zod, react-hook-form, pg, supabase, resend,
upstash all present). HPI ingest is a `scripts/` node task. OS gazetteer ingest is
a `scripts/` task once the file lands.

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| AVM liability reversal | HIGH | honest labelling, evidence gating, counsel-flag legal copy |
| No address gazetteer → can't always offer exact address | HIGH | PPD/listings + manual fallback; honest area-level wording |
| Backtest needs real data reachable | HIGH | use remote `price_paid_data` / Docker sample; gate accuracy claims |
| 5-min `git reset --hard` wipes uncommitted work | MED | feature branch + commit per red→green step |
| Over-precise output implies false accuracy | MED | round to nearest £5k; uncalibrated range labelled as such |

## 11. Recommended implementation sequence

1. Docs (this + 8 companions). 2. CTA routing (failing test → fix). 3. Address
flow (normalise + resolve). 4. Details flow. 5. Comparable-sales engine
(`price_paid_data`). 6. HPI ingest + historical backtest → validation doc.
7. Evidence-quality + fallback. 8. Server sessions. 9. Supabase OTP + claim.
10. Result page. 11. Agent handoff + consent. 12. Analytics + monitoring.
13. Full E2E (12 scenarios) + accessibility. 14. Final validation (lint, tsc,
unit, integration, e2e, build-where-possible) + final report.

# Valuation Requirements Traceability

> **Date:** 2026-06-18
> **Status:** Living matrix. Maps every "Value my property" requirement to the
> route/file(s) that implement it and the test(s) that cover it. Honours
> `VALUATION_SCAFFOLDING.md`, `VALUATION_MODEL_SPEC.md`, `VALUATION_UX_FLOW.md`,
> `VALUATION_TDD_PLAN.md`.
>
> **Status legend:** done · in-progress · planned.

| # | Requirement | Route / file(s) | Test(s) | Status |
|---|---|---|---|---|
| R1 | **CTA routing** — every "Value my property" CTA opens the dedicated journey at `/value-my-property`, not general search | `src/app/(main)/value-my-property/page.tsx`; landing CTA fix `src/app/(main)/valuation/page.tsx`; sold-prices CTA `src/app/(main)/sold-prices/[area]/[slug]/page.tsx`; `src/config/navigation.ts:212`; `src/lib/constants.ts:217` | `e2e/property-valuation-flow.spec.ts` (Scenario 1); `src/config/navigation.test.ts`; `configured-navigation-render` suite | **done** (Scenario 1 passing) |
| R2 | **Exact address** — user resolves to a specific `(postcode,paon[,saon])`; postcode-only is area-level; manual fallback; Scotland handled | `src/app/(main)/value-my-property/address/page.tsx`; `src/services/geocoding/postcodes-io.ts`; candidate resolver `src/services/valuation/address-resolver.ts` | C2, C3, I4, I5, E3, E4, E5; U25 | planned |
| R3 | **Confirm / correct details** — prefilled characteristics + 12-question details form | `src/app/(main)/value-my-property/details/page.tsx`; `src/lib/validators/valuation-details.ts` | C4, C5, U26, U27, E6 | planned |
| R4 | **Versioned estimate** — engine returns `ValuationResult` incl. `model_version='vmp-comparables-1.0.0'`; comparable-sales algorithm | `src/services/valuation/engine.ts`; `src/services/valuation/model-constants.ts`; SQL in `src/services/valuation/comparables-query.ts` | U1–U24, I1–I3, I6, U23 | planned |
| R5 | **Out-of-time validation** — ~3.5mo PPD lag surfaced; `data_cutoff_date` set; no extrapolation claimed | `engine.ts` (data_cutoff); result limitations panel | U12 (index lag hold), I12, C10 | planned |
| R6 | **Weak evidence → wide range / low rating / no estimate** — fallback D widens range + low rating; level E returns no figure + agent recommendation | `engine.ts` (fallback + range); `ValuationResult.tsx` | U16, U17–U19, U21, C11, C12, E10 | planned |
| R7 | **Account only after verification** — passwordless OTP; account created on successful verify | `src/app/(main)/value-my-property/verify-email/page.tsx`; Supabase `signInWithOtp`/`verifyOtp`; `src/components/auth/OTPInput.tsx` | C8, U28, I8, E8 | planned |
| R8 | **Valuation attached to verified user only** — pending `valuation_id` bound on verify; signed-out read denied | `src/app/api/valuation/[id]/route.ts`; `valuation_sessions`; persistence layer | I7, I8, E8 | planned |
| R9 | **OTP abuse protection** — rate-limited send + verify (fail-closed), resend cooldown | `src/lib/rate-limit/*` (`createAuthRateLimiter`); verify-email route | I9, C8 (cooldown), A4 | planned |
| R10 | **Evidence + limitations shown** — comparable list, evidence-quality badge, "not a survey", area-level caveat, provenance/attribution | `src/components/seller/valuation/ValuationResult.tsx`; result page | C9, C10, C11, E9; U21 | planned |
| R11 | **Agent valuation request** — explicit opt-in CTA creates `agent_leads` row via existing service | `src/app/api/agent/leads/route.ts`; `src/services/agent/agent-lead-service.ts` (new `source` value); result page CTA | C13, I10, E11 | planned |
| R12 | **No agent share without handoff** — nothing shared with an agent absent an affirmative request | agent CTA gating; lead service | I11 (negative), C13 | planned |
| R13 | **Auth ≠ marketing consent** — no pre-checked boxes; verification email is a service message; agent-share consent is separate + purpose-scoped | `consent_records` + `consent_audit_log` integration; verify-email + result CTA copy | C7, C13, I10 | planned |
| R14 | **Honest output framing** — "estimated current market value", rounded to £5k, range labelled uncalibrated, never "exact"/guaranteed | `engine.ts` (rounding §5); `ValuationResult.tsx` copy | U15, C9, E9 | planned |
| R15 | **Server-persisted session** — refresh/back/forward/deep-link work; no localStorage of address/result/email/OTP/lead | `valuation_sessions` (httpOnly cookie); `WizardShell.tsx` | E12 | planned |
| R16 | **Just-in-time privacy notice** — shown at email collection, flagged for counsel | verify-email / review page copy | C7 | planned |
| R17 | **Estimate-ready gate** — engine has run, but no figure shown until verification | `src/app/(main)/value-my-property/review/page.tsx` | C6, E7 | planned |
| R18 | **HPI time-adjustment** — ingest gov.uk UK HPI (OGL); index applied; no-op caps quality at medium until ingested | `scripts/ingest-uk-hpi.ts`; `engine.ts` time-adjust | U12, U13, U22, I-back-test | planned |
| R19 | **Tests cover all paths** — unit/component/integration/E2E/a11y per TDD plan; ≥80% on engine | `VALUATION_TDD_PLAN.md` items | U1–U28, C1–C13, I1–I12, E1–E12, A1–A5 | in-progress (E1 done) |

## Notes

- **R1 is the only DONE row.** Scenario 1 of `e2e/property-valuation-flow.spec.ts`
  passes: the `/valuation` landing CTA and nav/constants now point at
  `/value-my-property`, the route exists and its intro announces email
  verification, and the sold-prices CTA fix is in scope. Everything downstream of
  the route shell is planned per the implementation sequence
  (`VALUATION_SCAFFOLDING.md` §11).
- **No accuracy/confidence claim** is in scope for any row until the back-test
  runs on held-out sales (`VALUATION_MODEL_VALIDATION.md`); R6's range is the
  uncalibrated "model uncertainty" range, not a measured confidence interval.
- File paths for not-yet-built routes/services are the **intended** locations
  (Scaffolding §3/§4); they are listed so tests and implementation land in the
  same place.
</content>

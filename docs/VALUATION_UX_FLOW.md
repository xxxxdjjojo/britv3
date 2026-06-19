# Valuation UX Flow — "Value my property" journey

> **Date:** 2026-06-18
> **Status:** UX specification. Honours `VALUATION_SCAFFOLDING.md` (routes,
> sessions, auth), `VALUATION_MODEL_SPEC.md` (inputs/fallback), and
> `VALUATION_COMPETITOR_RESEARCH.md` (patterns to adopt / avoid).
>
> **Tone:** indicative automated estimate, never a guaranteed price/survey.
> Postcode-first. Estimate is free; the account exists to **save** the estimate,
> not to gate the number behind an email wall before it is computed. All legal /
> privacy copy below is **flagged for qualified counsel** before launch.

## 0. Route map (server-persisted stepper)

```
/value-my-property                       intro; states email verification is needed up front
/value-my-property/address               postcode → address select / manual fallback
/value-my-property/details               confirm/correct prefilled + missing characteristics
/value-my-property/review                "your estimate is ready" gate (no figure yet)
/value-my-property/verify-email          Supabase email OTP (passwordless)
/value-my-property/result/[valuationId]  revealed + saved result, evidence, agent CTA
```

Refresh, back/forward and deep links must work. Session state lives server-side
in `valuation_sessions` keyed by an httpOnly cookie token — **never** localStorage
for address/result/email/OTP/lead (Scaffolding §3). Reuses
`WizardShell.tsx` for progress + back/continue.

---

## 1. `/value-my-property` — intro

**Asked:** nothing yet. **Shown:**
- What the tool is: a free, indicative automated estimate from HM Land Registry
  sold prices — **named plainly** to build trust (Research §4.2).
- Honest limitations up front: "not a survey or formal valuation; we can't see
  your home's condition or recent improvements" (Research §4.3).
- **Email-verification notice up front** (no surprise at the end): "You'll verify
  your email to view and save your estimate." (Verified by E2E Scenario 1's
  intro assertion — body must mention `email` + `verify`.)
- Primary CTA → `/value-my-property/address`.

**Why:** sets honest expectations and the account-on-verify model before the user
invests effort (Research §5: free estimate, account to save).

---

## 2. `/value-my-property/address` — locate the property

**Asked:** full UK postcode → pick the exact address; manual fallback if no match.

**Flow:**
1. Postcode field → geocode via `postcodes-io.ts` (`geocodePostcode`).
2. Candidate addresses from PPD-derived `(paon, saon, street)` for the postcode
   + `listings`/`properties` candidates (Scaffolding §8). Until the OS UPRN
   gazetteer lands, the list is best-effort.
3. **Manual fallback:** if no candidate matches, the user types house
   number/name (`paon`) and, for flats, unit (`saon`).
4. **Honest granularity:** if only a postcode/outward resolves, the result will
   be area-level and the UI says so (Audit §10). For flats without a SAON,
   building-level is the best achievable and is stated.
5. **Scotland:** Scottish postcodes geocode but PPD has zero rows (Audit §4) —
   show "No Land Registry sales data is available for Scotland" rather than an
   empty estimate; do not advance to a numeric result.

**Why:** a postcode is not a property; an exact `(postcode,paon[,saon])` is
required for a property-level (fallback A/B) estimate vs an area-level (C) one.

**Accessibility:** postcode input `inputmode="text"` + `autocomplete="postal-code"`;
candidate list is a keyboard-navigable listbox (reuse `command`); errors via
`aria-live="polite"`; manual fallback always reachable by keyboard.

---

## 3. `/value-my-property/details` — confirm / correct characteristics

Prefill whatever address resolution gave us (type from PPD, tenure inference);
the user confirms or corrects, and supplies what we can't derive. **Phase 5
question list** — each with: *why requested · model feature affected · required? ·
default/fallback · validation · accessibility.*

| # | Question | Why requested | Model feature (see Model Spec) | Required? | Default / fallback | Validation | Accessibility |
|---|---|---|---|---|---|---|---|
| 1 | **Property type** (Detached / Semi / Terraced / Flat-maisonette / Other) | Like-for-like comparable filter | §2 broad-type filter + §3 type weight | **Yes** | prefill from PPD `property_type` | one of D/S/T/F/O | radio-group, `aria-labelledby`, arrow-key nav |
| 2 | **House subtype** (only if not a flat) | Refines type weight within houses | §3 type weight | No | infer from type | enum | conditional fieldset, announced on reveal |
| 3 | **Flat / maisonette** (only if type=Flat) | Tenure + comparable nuance | §2 tenure handling | No | "flat" | enum | conditional fieldset |
| 4 | **Bedrooms** | Bedroom-distance similarity | §3 bedroom weight (neutral if unknown) | **Yes** | none (neutral weight if skipped) | integer 0–20 | numeric stepper + typed input, label |
| 5 | **Bathrooms** | Evidence display / future model | §11 recorded-but-unused | No | none | integer 0–20 | numeric stepper |
| 6 | **Floor area (m²)** *(optional)* | £/m² similarity **when present** | §3 floor-area weight (else neutral) | No | omitted → `missing_inputs` | number 5–10,000 m² | "optional" in label; hint text |
| 7 | **Tenure** (Freehold / Leasehold) | Don't mix L-flats with F-houses | §2 tenure filter/weight | **Yes** | prefill from PPD `duration` | enum F/L | radio-group |
| 8 | **New build?** (built/refurbished in last ~2 yrs) | New-build premium control | §2.7 new-build cap + §3 new-build weight | **Yes** | "No" | boolean | radio-group, plain-language helper |
| 9 | **Condition** (e.g. needs work / average / good / excellent) | Evidence + future model; honest caveat that we can't see it | §11 recorded-but-unused | No | "average" | enum | radio-group |
| 10 | **Extension / loft conversion?** | Evidence + future model | §11 recorded-but-unused | No | "No" | boolean | checkbox/radio |
| 11 | **Parking / garage** | Evidence + future model | §11 recorded-but-unused | No | "none" | enum | radio-group |
| 12 | **Garden** (none / shared / private) | Evidence + future model | §11 recorded-but-unused | No | "none" | enum | radio-group |

**Honesty note shown here:** condition/extension/garden etc. "help us describe
your home but don't yet change the estimate — it's built from sold prices of
similar nearby homes" (Research §4.3 framing; Model Spec §11).

**Validation rules** use `zod` schemas in `src/lib/validators/` via
`react-hook-form` + `zodResolver`. Required questions (1, 4, 7, 8) block advance;
optional ones never do (they degrade the model gracefully via neutral weights /
`missing_inputs`).

---

## 4. `/value-my-property/review` — "estimate ready" gate (no figure)

**Shown:** a summary of the confirmed address + characteristics, and the message
**"Your estimate is ready — verify your email to view and save it."** **No
numeric estimate appears here** (the figure is not paywalled by a wall *before*
computation, but the saved, persisted result is revealed only after verification
so it can be attached to the verified user — Scaffolding §6).

**The "estimate ready" gate:** the engine has already run (or runs on entry to
this step) and a `valuation_id` exists server-side, but the value is withheld
from the page until verification. Editing any detail returns to step 3 and
invalidates the pending estimate.

**Just-in-time email privacy notice** (immediately above the email field on the
next step, **flagged for counsel** — placeholder wording):

> *We'll email you a 6-digit code to verify your address and create your free
> account so we can save this estimate to it. We use your email to operate your
> account and send this service message only. We will not send marketing or
> share your details with an estate agent unless you ask us to. See our Privacy
> Policy. [COUNSEL REVIEW REQUIRED]*

**Why:** transparency at the moment of data collection (auth ≠ marketing consent,
Scaffolding §7; Research §5 anti-pattern: no email wall before the estimate, no
bundled consent).

---

## 5. `/value-my-property/verify-email` — passwordless OTP

**Asked:** email → 6-digit code.

**Flow:** native `supabase.auth.signInWithOtp({ email })` →
`verifyOtp({ email, token, type: 'email' })` (Scaffolding §6). Reuse
`OTPInput.tsx` (6-digit, paste). The verification email is a **service message**,
no marketing content.

- **Account creation:** only on successful verify; existing email → signed in.
- **Abuse protection:** `createAuthRateLimiter` (fail-closed, Upstash +
  in-memory) on send + verify; resend is throttled with a visible cooldown timer.
- On success, the pending `valuation_id` is attached to the now-verified user and
  the user is redirected to the result page.

**Accessibility:** OTP input is 6 labelled cells, paste-aware, `aria-describedby`
for the cooldown + error; resend button has an accessible disabled state.

---

## 6. `/value-my-property/result/[valuationId]` — revealed + saved result

**Shown (result-page contents):**
1. **Headline:** "Estimated current market value" + `estimated_value` (nearest
   £5,000) and the range "Estimated range based on comparable sales and model
   uncertainty" (`estimated_low`–`estimated_high`) — **never** "your property is
   worth exactly £X" (Research §5.1). At fallback level E, no figure: a clear
   "we can't give a responsible estimate" message + agent recommendation.
2. **Evidence quality badge** (`high`/`medium`/`low`/`unavailable`) and, for
   area-level (level C), the explicit "median of N nearby sales" label.
3. **Comparable sales list** (`comparable_sales`): address label (building-level
   for SAON-less flats), price, adjusted price, date, type, distance — the
   honest evidence behind the number.
4. **Limitations panel:** not a survey/valuation; can't see condition or
   improvements; ~3.5-month data lag; area-level caveat where applicable
   (Research §4.3, Audit §2/§10). **Counsel-flagged.**
5. **Agent CTA (explicit, opt-in):** "Request a free valuation from a local
   estate agent." Creates an `agent_leads` row only after an affirmative request,
   with a separate, unbundled, purpose-scoped agent-share consent event
   (`consent_records`); **no pre-checked boxes**; auth ≠ marketing consent
   (Scaffolding §7). Without this explicit action, nothing is shared with an
   agent.
6. **Provenance:** "Contains HM Land Registry data © Crown copyright and database
   right 2026 (OGL v3.0)"; `model_version` + `data_cutoff_date` shown.

**Persistence:** result is attached to the verified user only; revisiting the
deep link while signed in re-shows it; signed-out access is denied.

---

## 7. Cross-step rules

- Back/forward/refresh restore from `valuation_sessions`; never lose a confirmed
  address or trap the user.
- Reduced-motion respected on any progress/reveal animation.
- Every step states where the user is and what's next (WizardShell progress).
- No figure, address, OTP, or lead is ever written to localStorage.
</content>

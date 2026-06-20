# Email Delivery Audit — TrueDeed (britv3)

> **Scope:** READ-ONLY static inspection of `/Users/jojominime/Documents/britv3main/britv3`
> (canonical clone). No emails were sent. Secret values are never logged — only
> variable names and presence/absence.
>
> **Audit date:** 2026-06-20.

---

## 1. Provider & SDK

- **Provider:** Resend (`resend` npm package, `src/services/email/email-service.ts:2`,
  `src/services/notifications/email-service.ts:7`).
- **Template system:** React Email (`src/emails/*.tsx` — 19 transactional templates).
- **Preview route:** `src/app/api/emails/preview/[template]/route.tsx` (dev-only).
- **Suppression / status:** `email_logs` table with statuses `sent` / `failed` /
  `suppressed` / `delivered` / `bounced` (`src/services/email/email-service.ts:65-69`).
- **Webhook:** `src/app/api/webhooks/resend/route.ts` (+ `route.test.ts`) verifies Svix
  signature with `RESEND_WEBHOOK_SECRET`, processes `email.bounced` / `email.complained`
  / `email.delivered` events → updates `email_logs`.
- **Queue / background jobs:** Inngest functions for email-driven flows:
  `rfq-notify-providers.ts`, `truedeed-dispute-emails.ts`, `truedeed-invoice-emails.ts`,
  `truedeed-notify-introduction.ts`, `price-drop-alerts.ts`.

## 2. Environment variables

| Variable | `.env.example` | `.env.local` | Required | Notes |
|---|---|---|---|---|
| `RESEND_API_KEY` | present | **present** (100 chars) | yes | Resend API key |
| `RESEND_FROM_ADDRESS` | present | **present** | yes | (used by older notifications path — see §4) |
| `RESEND_FROM_NAME` | `Britestate` ⚠️ stale | present | yes | **Brand drift**: example still says Britestate, not TrueDeed |
| `RESEND_WEBHOOK_SECRET` | present | **unverified** | yes (prod) | Svix signing secret for webhook |
| `INNGEST_SIGNING_KEY` | present | **present** (77 chars) | yes (prod) | Gates all queued email flows |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3004` | present | yes | Used for link generation |
| `LEDGER_ANCHOR_EMAIL` | present | unverified | optional | Daily ledger hash-anchor recipient |

> ⚠️ **Brand bug:** `RESEND_FROM_NAME=Britestate` in `.env.example` — the example
> template still ships the pre-rebrand name. The actual FROM header used by the
> modern email service resolves through `brandConfig.fromEmail` (see §3), so this
> drift is mostly cosmetic, but the example should be updated.

## 3. Sender identity & FROM resolution

Modern path (`src/services/email/email-service.ts:20`, `security-email-service.ts:18`):

```ts
const FROM = emailFromHeader();     // src/config/brand.ts:54
// returns `${brandConfig.displayName} <${brandConfig.fromEmail}>`
//     => "TrueDeed <hello@truedeed.co.uk>"
```

`brandConfig` (`src/config/brand.ts:1-31`) hard-codes:
- `displayName: "TrueDeed"`
- `fromEmail: "hello@truedeed.co.uk"`
- domain: `truedeed.co.uk`

**Implication:** every send from the modern path is from
`TrueDeed <hello@truedeed.co.uk>`. Resend requires `truedeed.co.uk` to be a
**verified sending domain** in its dashboard (SPF, DKIM, DMARC DNS records
issued by Resend). If the domain is unverified, Resend silently rewrites the
FROM to `onboarding@resend.dev` (deliverability collapses to spam).

This **cannot be verified from the repo** — it requires Resend dashboard access.

## 4. ⚠️ DUPLICATE IMPLEMENTATION — two email services

**This is the most likely silent-failure root cause.** Two parallel Resend wrappers exist:

| File | Lines | Initializes | On missing key |
|---|---|---|---|
| `src/services/notifications/email-service.ts` | 7-33 | `getResend()` — returns `null` if `RESEND_API_KEY` unset, logs `"[email-service] RESEND_API_KEY not set -- emails disabled"` (`:28`) | **silently no-ops** |
| `src/services/email/email-service.ts` | 2-18 | `getResend()` — `new Resend(process.env.RESEND_API_KEY)` with no guard (`:16`) | **throws at send time** |
| `src/services/email/security-email-service.ts` | 8-18 | same pattern as the modern path | throws at send time |

**Import map (verified by ripgrep):**

- `src/services/email/email-service` — used by **transactional flows**:
  - `src/app/auth/callback/route.ts:3` → `sendWelcome`
  - `src/services/admin/review-service.ts:3` → `sendFlagOutcome`
  - `src/services/billing/stripe-event-processor.ts:432,475` → `sendPaymentFailed`, `sendPaymentConfirmation`
  - `src/inngest/functions/price-drop-alerts.ts:13` → `sendPropertyAlert`
- `src/services/notifications/email-service` — used by **security/digest only**:
  - `src/__tests__/services/notification-service.test.ts:9,32,306-307`
  - `src/services/notifications/email-service.test.ts:4,8,42,44,45`

**Risk:** a contributor adding a new transactional email may import the
`notifications/email-service` (which silently no-ops without an API key),
mistakenly believing the send succeeded. This is exactly the failure mode the
master prompt warns about ("Do not introduce duplicate implementations of the
same journey").

## 5. Trace paths by email type

### 5.1 Consumer signup confirmation

```
User submits /register form
  → src/app/(auth)/register actions → Supabase auth.signUp()
  → Supabase sends its OWN confirmation email (configured in Supabase dashboard,
    NOT through Resend) → user clicks → /auth/callback
  → src/app/auth/callback/route.ts:3 → sendWelcome() from @/services/email/email-service
  → resendSend() → POST https://api.resend.com/emails → email_logs insert
```

**Two separate email providers may be active for the same journey:**
Supabase Auth's built-in confirmation (gated by Supabase dashboard settings) and
Resend (welcome). If Supabase email templates aren't configured, the
confirmation email never arrives — even though `RESEND_API_KEY` is present and
the welcome template is fine.

**Cannot verify** without Supabase dashboard access.

### 5.2 Password reset

Supabase Auth handles this natively (same dashboard dependency). The codebase
has `src/emails/password-reset.tsx` and an API route, but Supabase's hosted
auth likely fires first.

### 5.3 Post-a-job confirmation

```
Post-a-job submit → server action → insert rfqs row
  → Inngest function rfq-notify-providers.ts → sendProviderEnquiry()
  → resendSend() → email_logs
```

**Failure modes:** (a) Inngest not running in env → silent skip; (b) RFQ
created but providers lack verified email; (c) `rfqs` row inserted but Inngest
event not dispatched.

### 5.4 Valuation email

`valuation-service.ts` computes the AVM; whether an email is sent on valuation
completion is **unverified** — no clear `sendValuation*` export in
`src/services/email/email-service.ts`. Likely a gap.

### 5.5 Provider/agent lead email

`src/services/email/email-service.ts:634` — `sendEnquiry` to provider with
subject `"New enquiry from ${params.enquirerName}"`. Inngest-driven.

### 5.6 Landlord onboarding email

**Unverified.** No clear `sendLandlordOnboarding*` export. Onboarding completion
is captured in `profiles.onboarding_completed_at`; an email trigger is not
obvious.

### 5.7 Professional invitation email

**Unverified** — no `sendInvitation*` export found.

## 6. Failure / retry / observability

| Concern | Status | Evidence |
|---|---|---|
| Structured message IDs | ✅ | `email_logs.resend_id` captured from Resend response (`:134,180,226`) |
| Safe delivery logs | ✅ | `email_logs` table with status, recipient, template |
| Retry for transient failures | ⚠️ **partial** | Inngest provides retries for queued flows; direct `resendSend()` calls do not retry (the function returns `{error}` and logs, but no re-queue) |
| Dead-letter handling | ❌ **absent** | No dead-letter queue; failed sends are recorded but not re-processed |
| Bounce/complaint webhooks | ✅ | `/api/webhooks/resend` updates `email_logs` status |
| Suppression awareness | ⚠️ **partial** | Statuses are recorded; no pre-send check against a suppression list before `resendSend()` |
| Test-mode provider | ⚠️ | Resend has its own test mode; the codebase has no test-mode inbox abstraction |
| Deterministic test inbox | ⚠️ | Tests mock `Resend` (`email-service.test.ts:4-12`); no deterministic inbox |
| User-visible resend state | ❌ **absent** | No UI surface showing "email failed, resend" |
| Rate limiting | ✅ | Upstash Ratelimit used elsewhere; specific email rate limits unverified |
| Generic failure handling | ⚠️ | `resendSend` returns error; callers log but may not surface to user |

## 7. Sender authentication (DNS)

- **SPF / DKIM / DMARC** records for `truedeed.co.uk` are **not in the repo**
  (expected — they live at the DNS provider). The Resend dashboard issues the
  records when a sending domain is added.
- **Action required (operator):** confirm in Resend dashboard that
  `truedeed.co.uk` is a verified domain with SPF, DKIM, and DMARC records in
  place. Without verification, all sends rewrite to `onboarding@resend.dev`.

## 8. Hardening checklist (NOT applied — Gate A is read-only)

- [ ] Collapse the two email services into one canonical wrapper with strict
      key guard + structured logging.
- [ ] Add a pre-send suppression-list check.
- [ ] Add a dead-letter queue for permanently-failed sends.
- [ ] Add user-visible "resend" affordance in the UI.
- [ ] Surface Inngest job failures to Sentry.
- [ ] Verify `truedeed.co.uk` is a verified sending domain in Resend.
- [ ] Fix `RESEND_FROM_NAME=Britestate` → `TrueDeed` in `.env.example`.
- [ ] Audit Supabase Auth email templates for the signup confirmation + reset paths.
- [ ] Add `sendValuation*`, `sendLandlordOnboarding*`, `sendInvitation*` templates if absent.
- [ ] Add end-to-end test using deterministic inbox (e.g. Resend test API or Mailtrap).

## 9. Definition of "fixed" (per master prompt)

1. Provider accepts the message — **verifiable via Resend dashboard "Emails" tab**.
2. Message status is traceable — ✅ already true via `email_logs`.
3. Test inbox receives it — **requires Resend test mode or Mailtrap integration**.
4. Links resolve to TrueDeed — `appBaseUrl()` already prefixes the canonical URL;
   verify in templates.
5. Sender branding correct — ✅ already true via `brandConfig`; fix `.env.example`.
6. Failure and retry paths tested — **requires new test infrastructure**.

## 10. Why email delivery is failing — best hypotheses (ranked)

1. **Resend sender domain `truedeed.co.uk` not verified** → all sends rewrite to
   `onboarding@resend.dev` → spam folder. *(Operator check required.)*
2. **Supabase Auth confirmation emails not enabled in Supabase dashboard** →
   signup never confirms, so the `sendWelcome` path in `/auth/callback` never
   fires. *(Operator check required.)*
3. **Inngest not running in production** → all queued email flows (RFQ notify,
   dispute, invoice, introduction, price-drop) silently skip. The direct send
   paths (welcome, payment) work, but the marketplace lifecycle doesn't.
4. **Duplicate email-service modules** with divergent error handling → some
   paths silently no-op, others throw. Contributors may have wired new flows
   to the wrong one.
5. **Missing templates for valuation/landlord-onboarding/professional-invitation**
   → silent gaps in coverage.

**Recommended first test:** trigger a consumer signup in a staging env and
watch the Resend dashboard "Emails" tab. If nothing arrives, hypothesis 1 or 2.
If only the welcome arrives but RFQ/marketplace flows don't, hypothesis 3.

---

*Sources verified: `src/services/{email,notifications}/*`, `src/config/brand.ts`,
`src/app/auth/callback/route.ts`, `src/app/api/webhooks/resend/*`,
`src/app/api/emails/preview/*`, `src/inngest/functions/*`, `src/emails/*.tsx`,
`.env.example`, `.env.local` (key names only).*

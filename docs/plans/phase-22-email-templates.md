# Phase 22: Email Templates — CEO Plan Review

**Date:** 2026-03-15
**Mode:** HOLD SCOPE
**Status:** Approved — ready to build

---

## Overview

18 transactional email templates for Britestate, built with React Email + Resend. Designs sourced from Stitch (project ID: `5956704101394866719`). Templates cover the full user journey across all 7 roles.

---

## Template List

| # | Template | Stitch Screen ID |
|---|----------|-----------------|
| 22.1 | Welcome Email | `498d5724f0f3444ebb24e20e1276a836` |
| 22.2 | Email Verification | `3146a1ece38540219ba69e8279cf3a84` |
| 22.3 | Password Reset | `8db59052893e440d8baed3144d30b918` |
| 22.4 | New Property Alert | `fdf258457ce04044a043fe77abd2e4d8` |
| 22.5 | Viewing Confirmation | `e83accbcce74462aaa62373329319f81` |
| 22.6 | Viewing Reminder | `b893d981aa2441c99b6df749e4773890` |
| 22.7 | Offer Received | `ff072e92f1424819a37a5cbc0d9e9ff0` |
| 22.8 | Offer Accepted / Rejected | `0a05d1b834a843dbac1eb755600ac6de` |
| 22.9 | New Enquiry (to provider) | `eff5cecbb1b64fde96aff466889e53c8` |
| 22.10 | New Review Received | `5f9ae07bbc434ec3bdb8511f844e9250` |
| 22.11 | Compliance Expiry Warning | `3a24b60d9cbd4fca9a028af50d3fb085` |
| 22.12 | Payment Confirmation | `daac625506cd4eceb1857c2986b877e0` |
| 22.13 | Payment Failed / Retry | `47b3fee8187e4099864106044039e0ac` |
| 22.14 | Subscription Renewal Reminder | `1d96f1189d5e47e095a503b98febc373` |
| 22.15 | Weekly Activity Digest | `70343536dd6a44438f13c68d1ff86eee` |
| 22.16 | Account Deletion Confirmation | `4af4fd653c8541bd8f663ab40aa03d56` |
| 22.17 | Referral Invitation | `69a0816735c8467eb509dc8684aea3d6` |
| 22.18 | Re-engagement (dormant user) | `1eead32b93e146878ed2e1a5d082b674` |

**Stitch Project:** `5956704101394866719` (Title: Britestate Homepage)

---

## System Audit Findings

- `@react-email/components@1.0.8` and `resend@6.9.3` already in `package.json` — infrastructure declared but unused
- `email_campaigns` table already exists in Supabase (admin broadcast emails) — do NOT confuse with transactional templates
- Notification preferences API route exists: `src/app/api/settings/notifications/route.ts`
- HMAC unsubscribe page already built — link to it from every email footer
- **No email template files exist anywhere in `src/`** — greenfield build

### CRITICAL: Stitch HTML is not production-ready

Every Stitch design uses:
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```
Gmail, Outlook, and Apple Mail **strip all `<script>` tags**. The Stitch designs are the **visual spec** — use them as pixel-perfect references. React Email is the **implementation technology** — it inlines all CSS automatically.

| Email Client | JS | `<style>` | class= | inline style |
|---|---|---|---|---|
| Gmail (web) | ✗ | ✗ | ✗ | ✓ |
| Gmail (mobile) | ✗ | ✗ | ✗ | ✓ |
| Outlook 2016+ | ✗ | ✗ | ✗ | ✓ (partial) |
| Apple Mail | ✗ | ✓ | ✓ | ✓ |

---

## Architecture

### Confirmed Decisions

1. **Templates:** React Email `.tsx` components in `src/emails/`
2. **Sending:** Resend API via `email-service.ts`
3. **Storage:** No Supabase Storage for HTML — templates are code, not data
4. **Audit trail:** `email_logs` table in Supabase (new migration required)
5. **Weekly Digest scope:** Property-level data only (saved searches, price drops, viewings, messages) — no financial data

### System Architecture

```
TRIGGER SOURCES                 EMAIL LAYER              DELIVERY
───────────────                 ───────────              ────────
Auth events        ──────────▶  email-service.ts  ─────▶ Resend API
(signup, verify,                     │                       │
 password reset)                     │ renders                │
                                     ▼                       ▼
Property events    ──────────▶  React Email        user's inbox
(alert, offer,                  components
 viewing)          ──────────▶  (18 templates)
                                     │
Payment events     ──────────▶       │ best-effort
(confirm, failed)                    ▼
                            Supabase: email_logs
System events      ──────────▶  (audit trail)
(account deletion,
 compliance)                         │
                            User prefs table
Notification        ◀──────────      │ checks
preferences                    (gate every send)
```

### File Structure

```
src/emails/
├── _components/
│   ├── EmailWrapper.tsx     # max-width 600px, bg-white, rounded, shadow
│   ├── EmailHeader.tsx      # Britestate logo + brand green #1B4D3E bar
│   ├── EmailFooter.tsx      # address, social links, unsubscribe link
│   └── EmailButton.tsx      # reusable CTA (inline style, NOT Tailwind)
├── welcome.tsx
├── verification.tsx
├── password-reset.tsx
├── property-alert.tsx
├── viewing-confirmation.tsx
├── viewing-reminder.tsx
├── offer-received.tsx
├── offer-status.tsx         # covers both accepted + rejected (prop: status: 'accepted' | 'rejected')
├── new-enquiry.tsx
├── review-received.tsx
├── compliance-warning.tsx
├── payment-confirmation.tsx
├── payment-failed.tsx
├── renewal-reminder.tsx
├── weekly-digest.tsx
├── account-deletion.tsx
├── referral-invitation.tsx
└── re-engagement.tsx

src/services/email/
└── email-service.ts         # sendWelcome(), sendVerification(), sendOffer()...

src/types/email.ts           # EmailLog type, per-template Props types

src/app/api/emails/
└── preview/[template]/
    └── route.ts             # admin preview route (BUILD NOW — see below)
```

---

## Design Tokens (from britestatestyle.txt)

All templates must use these values as inline CSS:

```
Brand primary:    #1B4D3E  (deep forest green)
Brand gold:       #D4A853  (warm gold — premium)
Action blue:      #2563EB  (CTAs, links)
Background:       #F8F8FA
Card background:  #FFFFFF
Text primary:     #0A0A0B
Text secondary:   #5E5E6A
Text muted:       #9E9EAB
Border:           #E2E2E8

Success:          #16A34A
Warning:          #CA8A04
Error:            #DC2626

Font (fallback):  Inter, ui-sans-serif, system-ui
Max width:        600px
Border radius:    12px (email card)
```

---

## email_logs Migration

New table — add to a new migration file:

```sql
CREATE TABLE email_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES profiles(id),
  template           text NOT NULL,        -- 'welcome', 'verification', etc.
  recipient          text NOT NULL,        -- email address (GDPR audit)
  resend_id          text,                 -- Resend message ID (for webhook updates later)
  status             text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'suppressed')),
  suppression_reason text,                 -- 'unsubscribed' | 'no_content' | 'pref_disabled'
  error_message      text,                 -- populated if status = 'failed'
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_logs_user_read" ON email_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "email_logs_admin_all" ON email_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role (used by email-service.ts) can insert
CREATE POLICY "email_logs_service_insert" ON email_logs
  FOR INSERT WITH CHECK (true);
```

---

## email-service.ts — Required Pattern

Every send function must follow this exact pattern:

```typescript
// src/services/email/email-service.ts

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_ADDRESS}>`;

async function logEmail(params: {
  userId: string | null;
  template: string;
  recipient: string;
  resendId?: string;
  status: "sent" | "failed" | "suppressed";
  suppressionReason?: string;
  errorMessage?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("email_logs").insert({ ...params, resend_id: params.resendId });
  } catch {
    // Best-effort — never throw from log insert
    console.error("[email-service] Failed to write email_log", params);
  }
}

async function checkUserEmailPref(userId: string, prefKey: string): Promise<boolean> {
  // Check notification preferences — return false = suppressed
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select(prefKey)
    .eq("user_id", userId)
    .single();
  return data?.[prefKey] ?? true; // default to enabled if no pref set
}

export async function sendWelcome(params: { userId: string; email: string; firstName: string }) {
  const enabled = await checkUserEmailPref(params.userId, "email_marketing");
  if (!enabled) {
    await logEmail({ userId: params.userId, template: "welcome", recipient: params.email, status: "suppressed", suppressionReason: "pref_disabled" });
    return;
  }

  try {
    const { WelcomeEmail } = await import("@/emails/welcome");
    const { render } = await import("@react-email/components");
    const html = render(<WelcomeEmail firstName={params.firstName || "there"} />);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.email,
      subject: `Welcome to Britestate, ${params.firstName || "there"}!`,
      html,
    });

    if (error) throw error;
    await logEmail({ userId: params.userId, template: "welcome", recipient: params.email, resendId: data?.id, status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({ userId: params.userId, template: "welcome", recipient: params.email, status: "failed", errorMessage: message });
    // Do NOT re-throw — email failure must not crash the signup flow
    console.error("[email-service] sendWelcome failed", message);
  }
}

// Repeat pattern for all 18 templates...
```

**Key rules enforced by this pattern:**
- `email_logs` insert is always best-effort (never throws)
- Resend errors are caught and logged, never propagated to callers
- Missing `firstName` falls back to `"there"` — never renders `undefined`
- Notification preference is checked before every send
- Resend ID stored for future webhook reconciliation

---

## Send Suppression Rules

These templates must check for content before sending — an empty email is a brand failure:

| Template | Suppression Condition |
|---|---|
| 22.4 Property Alert | `matchingProperties.length === 0` → skip send |
| 22.15 Weekly Digest | `savedSearches.length === 0 AND upcomingViewings.length === 0 AND unreadMessages === 0` → skip |
| 22.18 Re-engagement | `last_sent_at < 7 days ago` → deduplicate (check `email_logs`) |

---

## Error & Rescue Map

```
METHOD                     | FAILURE MODE                   | RESCUE ACTION
───────────────────────────┼────────────────────────────────┼──────────────────────────
resend.emails.send()       | 429 rate limit                 | Retry 2x with exp backoff
resend.emails.send()       | timeout / AbortError           | Retry 2x, then log FAILED
resend.emails.send()       | 422 invalid address            | Log FAILED, do not retry
resend.emails.send()       | 503 Resend outage              | Log FAILED with CRITICAL flag
React Email render()       | Undefined required prop        | Fallback values prevent throw
email_logs INSERT          | DB error                       | console.error, do NOT throw
checkUserEmailPref()       | User not found                 | Default to enabled (true)
Weekly Digest query        | 0 users returned               | No-op, log info
```

---

## Security Requirements

| Requirement | Detail |
|---|---|
| No `dangerouslySetInnerHTML` | React Email auto-escapes JSX — never bypass this |
| Server-only env vars | `RESEND_API_KEY` must NEVER have `NEXT_PUBLIC_` prefix |
| Unsubscribe links | Every footer must link to existing HMAC `/unsubscribe` page |
| PII in logs | Log only `template`, `user_id`, `recipient`, `status` — never log email body |
| Admin preview route | Require admin role check before rendering any template |
| SPF / DKIM / DMARC | Must be configured on sending domain before first production send |

### Required DNS Records (deploy blocker)

```
SPF:    v=spf1 include:amazonses.com ~all
DKIM:   Add Resend's CNAME records to DNS (from Resend dashboard)
DMARC:  v=DMARC1; p=none; rua=mailto:dmarc@britestate.co.uk
```

---

## Performance: Weekly Digest

The Weekly Digest runs for all active users — N+1 risk is real.

**Required approach:**
- Run as Supabase Edge Function triggered by `pg_cron` (NOT a Next.js API route)
- Schedule: every Monday 08:00 UTC
- Batch users in groups of 100
- Use a single aggregation SQL query per user (not per-property loop)
- Cap digest to max 5 property results per user
- Skip users with `email_digest = false` in notification prefs via SQL WHERE clause (not application code)

---

## Admin Preview Route (Build Now)

```typescript
// src/app/api/emails/preview/[template]/route.ts
import { render } from "@react-email/components";
import { NextRequest, NextResponse } from "next/server";

const templateMap = {
  welcome: () => import("@/emails/welcome").then(m => m.WelcomeEmail),
  verification: () => import("@/emails/verification").then(m => m.VerificationEmail),
  // ... all 18
};

export async function GET(req: NextRequest, { params }: { params: { template: string } }) {
  // Require admin auth here (check Supabase session + role)

  const loader = templateMap[params.template as keyof typeof templateMap];
  if (!loader) return NextResponse.json({ error: "Unknown template" }, { status: 404 });

  const Component = await loader();
  const html = render(<Component {...mockProps[params.template]} />);
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
```

Access at `/api/emails/preview/welcome`, `/api/emails/preview/verification`, etc.

---

## Required Env Vars

```bash
# .env.local (server-only — no NEXT_PUBLIC_ prefix)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_ADDRESS=hello@britestate.co.uk
RESEND_FROM_NAME=Britestate
```

---

## Build Order

Execute in this exact sequence:

1. **Migration** — `email_logs` table with RLS (new `.sql` file in `supabase/migrations/`)
2. **Shared components** — `EmailWrapper`, `EmailHeader`, `EmailFooter`, `EmailButton` in `src/emails/_components/` with inline CSS (not Tailwind classes)
3. **Types** — `src/types/email.ts` with `EmailLog` type and per-template prop types
4. **email-service.ts** — `src/services/email/email-service.ts` with full pattern (suppression, retry, best-effort logging)
5. **18 templates** — convert each Stitch design to React Email `.tsx` using `@react-email/components` primitives
6. **Preview route** — `src/app/api/emails/preview/[template]/route.ts` with mock props and admin auth
7. **Wire triggers** — connect each `sendX()` call to its source event (auth hooks, property events, payment webhooks)
8. **pg_cron** — Supabase Edge Function for Weekly Digest (Monday 08:00 UTC)
9. **DNS + env** — SPF, DKIM, DMARC, `RESEND_API_KEY` before any production sends

---

## Tests Per Template

Each of the 18 templates needs these 6 tests:

```typescript
test("renders without throwing when all required props provided")
test("handles undefined firstName → falls back to 'there'")
test("suppresses send when user email pref is disabled")
test("suppresses send when content is empty (digest/alert)")
test("logs row to email_logs on successful send")
test("does not throw if email_logs insert fails")
```

Resend must be mocked in all tests — never call the real API in tests.

---

## TODOS (deferred)

### TODO-1: Resend Webhook Handler
- **What:** `POST /api/webhooks/resend` updates `email_logs.status` on bounce/delivery/open events
- **Why:** Without bounce handling, hard-bounced addresses damage sender reputation over time
- **How:** Resend sends signed webhook → verify signature → update `email_logs` WHERE `resend_id = ?`
- **Effort:** M | **Priority:** P2
- **Depends on:** `email_logs.resend_id` column (included in migration above)

### TODO-2: Cross-client Render Testing
- **What:** Run all 18 templates through Litmus or Email on Acid before production launch
- **Why:** Outlook 2016 uses the Word rendering engine — tables and specific CSS behave differently
- **Effort:** M (tooling setup + review) | **Priority:** P1 (deploy blocker)
- **Depends on:** Templates complete

---

## NOT In Scope

| Item | Rationale |
|---|---|
| A/B subject line testing | `email_campaigns` table already exists for this — Phase 2 |
| Open/click pixel tracking | Resend webhook handler (TODO-1) — Phase 2 |
| Send-time optimisation / ML | Phase 3 |
| Multi-language templates | EN-only for launch |
| Preview-in-browser link | Deferred — admin route covers QA needs |
| Admin template editor UI | `email_campaigns` table + future CMS |

---

## What Already Exists (don't rebuild)

| Capability | Location |
|---|---|
| Resend SDK | `package.json` — already installed |
| React Email | `package.json` — already installed |
| Notification preferences | `src/app/api/settings/notifications/route.ts` |
| HMAC unsubscribe page | `/app/unsubscribe/page.tsx` |
| User emails | `profiles.email` column |
| Admin email campaigns | `email_campaigns` table (Supabase) |

---

## Send Flow State Machine

```
                ┌─────────────────┐
                │  TRIGGER EVENT  │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │ Fetch user prefs│
                └────────┬────────┘
                         │
          ┌──────────────▼──────────────┐
          │   pref: email enabled?       │
          └──────────────┬──────────────┘
                NO ──────┤──────── YES
                │                  │
       ┌────────▼────────┐ ┌───────▼────────┐
       │ log SUPPRESSED  │ │ Check content  │
       │ (pref_disabled) │ │ (digest/alert) │
       └─────────────────┘ └───────┬────────┘
                            EMPTY ─┤─ HAS CONTENT
                            │               │
                   ┌────────▼────────┐ ┌────▼───────────┐
                   │ log SUPPRESSED  │ │ render template │
                   │ (no_content)    │ └────┬───────────┘
                   └─────────────────┘      │
                                   ┌────────▼────────┐
                                   │  resend.send()  │
                                   └────────┬────────┘
                                 FAIL ──────┤────── OK
                                   │               │
                           ┌───────▼──────┐ ┌──────▼──────┐
                           │ Retry 2x     │ │  log SENT   │
                           │ then log     │ │  (best-     │
                           │ FAILED       │ │  effort)    │
                           └──────────────┘ └─────────────┘
```

---

## Post-Deploy Verification Checklist

- [ ] Send test Welcome email to real Gmail inbox — verify renders correctly (not unstyled)
- [ ] Send test to Outlook — verify basic layout holds
- [ ] Click unsubscribe link — verify HMAC validation works, user marked unsubscribed
- [ ] Send second email to unsubscribed user — verify suppression log created, email NOT sent
- [ ] Check Supabase: `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10`
- [ ] Check Resend dashboard: message appears with delivery status
- [ ] Trigger Property Alert with 0 matching properties — verify no email sent, suppression logged
- [ ] Admin preview route: `/api/emails/preview/welcome` renders in browser without error
- [ ] Verify `RESEND_API_KEY` not exposed in client bundle (`grep -r "RESEND_API_KEY" .next/static`)
- [ ] DNS: SPF, DKIM, DMARC records verified via `dig TXT britestate.co.uk`

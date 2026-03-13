# Auth & Onboarding Redesign — FAANG-Level Implementation

**Date:** 2026-03-13
**Status:** Approved — all 5 sections signed off

---

## Context

The current auth/onboarding implementation has all the routes in place but needs a significant quality upgrade. Missing pages, stub onboarding flows, no 2FA, and a layout that doesn't match the design system. This spec defines the full FAANG-level rebuild.

**What exists:**
- Routes: `/login`, `/register`, `/register/role-select`, `/register/onboarding/[role]`, `/verify-email`, `/welcome`, `/forgot-password`, `/reset-password`
- Components: `LoginForm`, `RegisterForm`, `RoleSelector`, `OnboardingFlow` (stub), `ForgotPasswordForm`, `ResetPasswordForm`, `OAuthButtons`, `PasswordStrengthMeter`, `EmailVerifyBanner`

**What's missing:**
- `/two-factor-setup` — 2FA enrollment
- `/two-factor` — 2FA code entry
- `/account-locked` — rate-limited lockout page
- `/account-suspended` — admin suspension page
- `/account-deletion-confirm` — deletion scheduled confirmation
- Real onboarding wizards (all roles currently show 2–3 plain text inputs with no saves)
- Split-panel `AuthLayout`

---

## Section 1 — Shared Infrastructure

### AuthLayout (split-panel)
Replace the current centered-card `(auth)/layout.tsx` with a **44/56 split-panel**:

```
┌──────────────── 44% ────────────────┬─────────────── 56% ───────────────┐
│  Britestate logo (top-left)         │  Property lifestyle photo          │
│                                     │  Dark green overlay (#1B4D3E/80%)  │
│  [Stepper — onboarding only]        │                                    │
│                                     │  Rotating testimonial card:        │
│  Heading                            │   Avatar | Name | Role             │
│  Subheading                         │   "Quote text in italic"           │
│                                     │                                    │
│  Form content (slot)                │  Trust stats row:                  │
│                                     │   25k+ Properties                  │
│  Footer link                        │   5k+ Verified Pros                │
│                                     │   4.8★ Average Rating              │
└─────────────────────────────────────┴────────────────────────────────────┘
```

**Mobile:** Right panel hidden; form takes full width in centered card (current behavior preserved).

**Account-state pages** (locked, suspended, deletion): Same split-panel but right panel shows brand/values content — no testimonial (wrong tone).

### 6 Shared Components to Build/Upgrade

| Component | File | Action |
|---|---|---|
| `AuthLayout` | `src/app/(auth)/layout.tsx` | Rewrite — split panel |
| `OnboardingLayout` | `src/components/auth/OnboardingLayout.tsx` | New — AuthLayout variant with stepper |
| `OTPInput` | `src/components/auth/OTPInput.tsx` | New — 6 large digit boxes, auto-advance, paste support |
| `PasswordStrengthMeter` | `src/components/auth/PasswordStrengthMeter.tsx` | Already exists — keep as-is |
| `RightPanelContent` | `src/components/auth/RightPanelContent.tsx` | New — rotating testimonial + trust stats |
| `WizardStepper` | `src/components/auth/WizardStepper.tsx` | New — numbered step progress indicator |

**Tooling:** Use Magic MCP (`mcp__magic__21st_magic_component_builder`) for all new components, passing Britestate design tokens:
- Brand primary: `#1B4D3E`
- Brand secondary/accent: `#D4A853`
- Headings: Plus Jakarta Sans
- Body: Inter
- All radii/shadows from `britestatestyle.txt`

---

## Section 2 — Core Auth Pages

### Login (`/login`)
**Change:** Move OAuth buttons **above** the form (social-first pattern = higher conversion).

```
[Continue with Google]
─── OR ───
[Email/password form]
[Sign in button]
[Forgot password link]
[Remember me checkbox]
```

**Google OAuth only** — Apple removed everywhere. `OAuthButtons` component updated to render Google only.

### Role Selector (`/register/role-select`)
**Change:** 6 role cards in 2×3 grid. Add **Mortgage Broker** as 6th role card.

Roles: Buyer/Renter · Seller · Landlord · Estate Agent · Tradesperson · Mortgage Broker

Keep existing `singleSelect` + professional-only filter behaviour from the March 2026 auth-flow-redesign (the `PROFESSIONAL_ROLES` constant).

> **Note:** The consumer path (Buy/Rent toggle on `/register`) still bypasses role-select.

### Sign Up (`/register`)
**Change:** Add "Signing up as: **Buyer**" role badge at top (updates when intent toggle changes). Split first/last name into side-by-side fields.

### Email Verification Flow
**Change:** Rename `/welcome` → `/verify-email/confirmed` for cleaner flow continuity.

```
/verify-email         — Pending state (resend link, timer)
/verify-email/confirmed — Success state (was /welcome)
```

`EmailVerifyBanner` in dashboard remains non-blocking.

### Forgot Password (`/forgot-password`)
Add explicit **success state** in the form: "Check your inbox — we sent a link to {email}" with countdown before "resend" is enabled.

### Reset Password (`/reset-password`)
Add **requirements checklist** that checks off in real time (8 chars ✓, uppercase ✓, number ✓) instead of showing error only on submit.

---

## Section 3 — 2FA Pages

**Audience:** Estate Agents are prompted (but not forced) to enable 2FA. Other roles can enable via account settings. The pages live under `(auth)/`.

### 2FA Setup (`/two-factor-setup`)
3-step card UI:

```
Step 1: Download Authenticator App
  → QR code (from Supabase mfa.enroll())
  → Manual code shown as fallback

Step 2: Scan QR Code
  → Verify code entry (6 digits via OTPInput)
  → Validates via Supabase mfa.challenge() + mfa.verify()

Step 3: Save Backup Codes
  → 8 backup codes generated + shown once
  → Stored hashed in Supabase (custom table: user_backup_codes)
  → "I've saved these" checkbox required before Continue
```

### 2FA Code Entry (`/two-factor`)
For sign-in when 2FA is enabled (AAL2 upgrade):

```
Large OTPInput (6 boxes, 40×48px)
Countdown timer: "Code expires in 0:27"
Attempt counter: "2 attempts remaining"
→ 3 failed attempts → redirect /account-locked
Backup code link: "Use a backup code instead"
```

Both pages use `supabase.auth.mfa.*` APIs.

---

## Section 4 — Account State Pages

All three pages live under `(auth)/` with split-panel layout (brand content on right, no testimonial).

### Account Locked (`/account-locked`)
```
Heading: "Your account is temporarily locked"
Body: Triggered by 5 failed login attempts.
      Locked for: [countdown timer — default 30 min]
CTAs:
  Primary: "Reset Password Instead" → /forgot-password
  Secondary: "Try Again Later" (disabled until countdown expires)
```
Lock state sourced from `profiles.locked_until` column.

### Account Suspended (`/account-suspended`)
```
Red visual treatment (error semantic tokens)
Heading: "Your account has been suspended"
Body: Shows `profiles.suspension_reason` (from admin action)
CTAs:
  Primary: "Contact Support" → mailto: or support URL
  Secondary: "Appeal This Decision" → support form
```

### Account Deletion Confirmation (`/account-deletion-confirm`)
```
Heading: "Your account deletion is scheduled"
Subheading: "Deletion happens on [date 30 days out]"
Bullet list: What gets deleted (profile, listings, messages, data)
Primary CTA: "Cancel Deletion — Keep My Account" (prominent, clear)
Secondary: small "I understand, proceed with deletion" text link
```

---

## Section 5 — Onboarding Wizards

Replace the stub `OnboardingFlow.tsx` with 6 role-specific multi-step wizards. All use `WizardStepper` + save data to Supabase on completion. Built using Magic MCP.

### Buyer / Renter — 4 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Location | Map-pin search (MapTiler), up to 5 areas, radius slider | `buyer_preferences.preferred_locations` |
| 2. Budget | Min/max price sliders, tenure toggle (freehold/leasehold) | `buyer_preferences.{min_budget, max_budget}` |
| 3. Property Type | Type cards (flat/house/etc.), min beds, must-have toggles (garden, parking, EPC) | `buyer_preferences.{property_types, min_bedrooms, requirements}` |
| 4. Alerts | Email/push notification frequency, portal alerts | `buyer_preferences.{notification_frequency, alert_types}` |

### Seller — 3 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Property | Address autocomplete, type, beds/baths | `seller_profiles` + `properties` |
| 2. Details | Tenure, EPC rating, estimated value slider | `properties.{tenure, epc_rating, estimated_value}` |
| 3. Intent | Timeline (ASAP/3mo/6mo/12mo+), agent preference | `seller_profiles.{timeline, agent_preference}` |

### Landlord — 3 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Portfolio | Number of properties, property types | `landlord_profiles.portfolio_size` |
| 2. First Property | Address, type, bedrooms, current rent | `properties` |
| 3. Compliance | Gas/EPC/EICR cert uploads (optional) | `compliance_documents` |

### Estate Agent — 3 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Agency | Agency name, address, registration number | `agencies` |
| 2. Profile | Job title, coverage areas, specialisms | `agent_profiles` |
| 3. Team | Invite colleagues (email list, optional) | `agency_invitations` |

### Tradesperson — 4 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Trade | Trade category multi-select | `service_provider_profiles.trade_categories` |
| 2. Coverage | Map radius tool, postcode areas | `provider_service_areas` |
| 3. Credentials | Qualifications, insurance, accreditations | `provider_credentials` |
| 4. Availability | Days/hours available, response time SLA | `service_provider_profiles.{availability, response_time}` |

### Mortgage Broker — 3 steps
| Step | Fields | Supabase table |
|---|---|---|
| 1. Firm | Firm name, FCA reference number | `mortgage_broker_profiles` |
| 2. Specialisms | First-time buyers, BTL, remortgage toggles | `mortgage_broker_profiles.specialisms` |
| 3. Coverage | Regions served, remote/in-person preference | `mortgage_broker_profiles.coverage_areas` |

**All flows:** "Skip for now" link at bottom of each step (not step 1). Saves partial data on skip. Redirects to `/dashboard` on completion or final skip.

---

## Route Summary

| Route | Status | Action |
|---|---|---|
| `/login` | Exists | Redesign — OAuth first |
| `/register` | Exists | Redesign — role badge, split name |
| `/register/role-select` | Exists | Update — 6 cards including Mortgage Broker |
| `/register/onboarding/[role]` | Exists | Rebuild — full wizards per role |
| `/verify-email` | Exists | Minor update — pending state only |
| `/verify-email/confirmed` | New (was `/welcome`) | Rename |
| `/forgot-password` | Exists | Add success state |
| `/reset-password` | Exists | Add requirements checklist |
| `/two-factor-setup` | Missing | New |
| `/two-factor` | Missing | New |
| `/account-locked` | Missing | New |
| `/account-suspended` | Missing | New |
| `/account-deletion-confirm` | Missing | New |

---

## Design Decisions

| Decision | Choice |
|---|---|
| Layout | Split-panel (44% form / 56% property image) |
| OAuth | Google only — Apple removed |
| Component generation | Magic MCP with Britestate design tokens |
| Onboarding data | Full Supabase integration |
| 2FA | Active for estate agents (prompted not forced) |
| Account state pages | Under `(auth)/` with split-panel |
| Missing route for broker | Mortgage Broker added as 6th role |
| Verification | Non-blocking (email banner in dashboard) |

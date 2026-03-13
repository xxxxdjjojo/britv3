# Auth Flow Redesign — Zillow-Inspired

**Date:** 2026-03-08
**Status:** Approved

## Overview

Replace the current multi-step registration with a Zillow-style flow. Two paths: consumer (simple) and professional (guided). Email verification is non-blocking.

## Consumer Flow (Default)

```
/register
  → Email, Password, Name
  → Toggle: "I'm looking to: Buy / Rent" (defaults to Buy)
  → "Continue with Google" OAuth option
  → "I am a professional" link at bottom
  → Submit → Create account → Set role (homebuyer/renter) → /dashboard
```

## Professional Flow

```
/register → clicks "I am a professional"
  → /register/role-select (filtered: landlord, agent, service_provider)
  → Select role → role-specific onboarding fields (single page)
  → Submit → /dashboard
```

## Email Verification

- Non-blocking: verification email sent in background after signup
- User goes straight to dashboard
- Subtle banner in dashboard: "Please verify your email" with resend link
- No /verify-email gate page

## Key Changes

| Current | New |
|---------|-----|
| Register → Verify Email (blocked) → Role Select → Onboarding → Dashboard | Register → Dashboard (consumer) |
| All 6 roles shown to everyone | Only Buy/Rent for consumers; landlord/agent/provider behind "I am a professional" |
| Email verification blocks access | Email verification is background + banner |
| Separate role-select page for everyone | Role-select only for professionals |
| Multi-step onboarding wizard | Single-page onboarding for professionals only |

## Middleware/Redirect Logic

- Unauthenticated → protected route: redirect to /login
- Authenticated + no role: set homebuyer as default
- Authenticated → auth routes: redirect to /dashboard
- Post-signup redirect: always /dashboard (consumer) or /register/role-select (professional)

## Components Affected

| Component | Action |
|-----------|--------|
| RegisterForm | Redesign: add Buy/Rent toggle, add "I am a professional" link, remove clutter |
| LoginForm | Minor: ensure redirect works with redirectTo param |
| RoleSelector | Filter to professional roles only (landlord, agent, service_provider) |
| OnboardingFlow | Keep for professionals, remove homebuyer/renter/seller forms |
| verify-email page | Remove as gate, keep for resend functionality only |
| middleware.ts | Remove verify-email redirect logic, add default role fallback |
| auth-service.ts | Handle unverified users gracefully |
| New: EmailVerifyBanner | Dashboard banner component for unverified users |

## Supabase Config

Disable "Confirm email" in Supabase Auth settings (Dashboard → Authentication → Email → toggle off) OR keep enabled but don't gate on email_confirmed_at in middleware.

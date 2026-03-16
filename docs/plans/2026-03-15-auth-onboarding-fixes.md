# Auth & Onboarding — Phase 3 Fix Plan
**Review date:** 2026-03-15
**Mode:** SCOPE EXPANSION
**Status:** Ready to execute

---

## Context

All 19 pages in the 3.x auth/onboarding spec were built in Phase 1 (completed 2026-03-07). The work here is **not a rebuild** — it is fixing 5 flow-breaking bugs, adding the auth state machine, and one delight item.

---

## The 5 Flow-Breaking Bugs

| # | Bug | File(s) |
|---|-----|---------|
| 1 | `/signup` renders login form — no route exists | `next.config.ts` or `middleware.ts` |
| 2 | OAuth professionals assigned `homebuyer` by default | `src/app/auth/callback/route.ts` |
| 3 | `RegisterForm` redirects to `/dashboard` after signup, skipping `/verify-email` | `src/components/auth/RegisterForm.tsx` |
| 4 | Professional intent (`?professional=agent`) written in URL by `/register/role-select` but never read by `/register` | `src/components/auth/RegisterForm.tsx` |
| 5 | Role assignment logic in 3 files — can produce duplicate `user_roles` rows | `RegisterForm`, `auth/callback`, `role-select/page.tsx` |

---

## Additional Bugs Found in Review

| # | Bug | Severity | File |
|---|-----|----------|------|
| 6 | `/account-suspended?reason=` renders free-text from URL — phishing vector | CRITICAL | `src/app/(auth)/account-suspended/page.tsx` |
| 7 | `AccountDeletionConfirmPage` — DB update failure doesn't block `router.push("/dashboard")` — user thinks cancellation succeeded but it didn't | HIGH | `src/app/(auth)/account-deletion-confirm/page.tsx` |
| 8 | `LoginForm` ignores `?error=auth_callback_error` param — user sees blank form with no explanation after failed OAuth | MEDIUM | `src/components/auth/LoginForm.tsx` |
| 9 | `RegisterForm` unhandled: 429 rate limit and TypeError (offline) crash without user feedback | MEDIUM | `src/components/auth/RegisterForm.tsx` |
| 10 | `auth/callback` role insert failure is silent — user authenticated but has no role, blank/broken dashboard | CRITICAL | `src/app/auth/callback/route.ts` |
| 11 | `TwoFactorSetupFlow` `enrollMFA` useEffect has no error/loading state — UI frozen if already enrolled | HIGH | `src/components/auth/TwoFactorSetupFlow.tsx` |

---

## Architecture Changes

### 1. Extract `role-service.ts`

Create `src/services/auth/role-service.ts`:

```ts
// Single source of truth for role assignment
export async function assignRole(userId: string, role: UserRole): Promise<void>
// - Upserts user_roles (prevents duplicates)
// - Updates profiles.active_role
// - Throws on failure (caller handles)
```

Replace the three scattered implementations:
- `RegisterForm` (~line 55)
- `auth/callback/route.ts` (lines 30–38)
- `register/role-select/page.tsx` (lines 18–42)

### 2. Middleware Auth State Machine

Extend `src/middleware.ts` to enforce 5 states using **Supabase custom JWT claims** (zero DB calls per request):

```
ANONYMOUS        → no session
PENDING_VERIFY   → session exists, email_confirmed = false  → redirect /verify-email
ONBOARDING       → email confirmed, onboarding_completed = false → redirect /register/onboarding/[role]
ACTIVE           → onboarding_completed = true → allow through
LOCKED/SUSPENDED → profiles.status = locked/suspended → redirect /account-locked or /account-suspended
```

Requires: Supabase Auth hook (PL/pgSQL DB function) that bakes `onboarding_completed` + `email_confirmed` into JWT claims on refresh.

**Use a feature flag:** `NEXT_PUBLIC_AUTH_FLOW_V2=true` to enable. Deploy with flag OFF, verify in staging, then enable in production.

### 3. OAuth Intent Preservation

Pass role intent through OAuth state param:

```ts
// OAuthButtons.tsx — before signInWithOAuth()
const professionalRole = searchParams.get("professional");
await supabase.auth.signInWithOAuth({
  provider,
  options: {
    queryParams: { state: professionalRole ? `role:${professionalRole}` : "" },
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  },
});
```

Read it back in `auth/callback/route.ts`:
- If `state` has `role:agent` → `assignRole(user.id, 'agent')`
- If new user (no roles) + no state → `assignRole(user.id, 'homebuyer')` (existing default)
- If new user → redirect to `/register/onboarding/[role]` instead of `/dashboard`

---

## Delight Item (build now)

### Smart Return-URL Preservation

Before OAuth redirect, save the current path to `sessionStorage`:

```ts
// OAuthButtons.tsx
sessionStorage.setItem("brite_return_url", window.location.pathname);
```

In `auth/callback/route.ts`, restore it:

```ts
// Read next from query param, fallback to dashboard
// The client-side redirect uses sessionStorage after the server redirect completes
```

Alternatively: encode return URL in the OAuth `state` param (cleaner, server-side).

**Impact:** User browsing `/properties/123`, clicks Sign In, completes OAuth, lands back on `/properties/123`. Not `/dashboard`.

---

## Security Fix

### `/account-suspended` — Phishing Vector Fix

**Before:**
```tsx
const reason = searchParams.get("reason") ?? "Your account has been suspended.";
// Renders raw URL text — attacker can craft: ?reason=Click+here:+https://evil.com
```

**After — enum code lookup:**
```ts
const SUSPENSION_REASONS: Record<string, string> = {
  fraud_violation: "Your account was suspended due to suspected fraudulent activity.",
  terms_violation: "Your account was suspended for violating our Terms of Service.",
  payment_dispute: "Your account was suspended due to an unresolved payment dispute.",
  manual_review: "Your account is under manual review by our team.",
};

const code = searchParams.get("code") ?? "manual_review";
const reason = SUSPENSION_REASONS[code] ?? SUSPENSION_REASONS.manual_review;
```

Update admin suspension flow to pass `?code=fraud_violation` instead of `?reason=...`.

---

## Error Handling Additions

### `RegisterForm.tsx`
- Wrap entire `onSubmit` in `try/catch` to handle `TypeError` (offline) and `429` rate limit
- Show user-friendly messages: "No internet connection. Please try again." / "Too many attempts. Please wait a moment."
- After successful `signUp()`, redirect to `/verify-email` (not `/dashboard`)
- Read `?professional=` query param on mount → pre-set intent if present

### `auth/callback/route.ts`
- Check `assignRole()` result — if it fails, log error and redirect to `/login?error=role_setup_failed`
- Read `state` param for professional role intent
- New users → redirect to `/register/onboarding/[role]`

### `AccountDeletionConfirmPage`
- Await `profiles.update()` result before calling `router.push()`
- On failure: show inline error "Failed to cancel deletion. Please try again." — do not redirect

### `LoginForm.tsx`
- Read `useSearchParams()` for `?error=` param
- Map error codes to user-friendly messages:
  - `auth_callback_error` → "Something went wrong signing you in. Please try again."
  - `role_setup_failed` → "Account created but setup incomplete. Please contact support."
- Show as Alert banner above the form

### `TwoFactorSetupFlow.tsx`
- Add loading + error state for the `enrollMFA` useEffect
- If error: show "Unable to set up 2FA. You may already have a factor enrolled." with retry button

---

## Files to Touch

### PR 1 — Bug fixes + security (no migration)
```
src/services/auth/role-service.ts          ← NEW
src/components/auth/RegisterForm.tsx       ← modify
src/components/auth/LoginForm.tsx          ← modify
src/components/auth/OAuthButtons.tsx       ← modify (OAuth state param + return URL)
src/components/auth/TwoFactorSetupFlow.tsx ← modify
src/app/auth/callback/route.ts             ← modify
src/app/(auth)/account-suspended/page.tsx  ← modify
src/app/(auth)/account-deletion-confirm/page.tsx ← modify
next.config.ts                             ← add /signup redirect
```

### PR 2 — Middleware state machine (requires Supabase migration)
```
supabase/migrations/YYYYMMDD_auth_jwt_claims.sql  ← NEW (PL/pgSQL hook)
src/middleware.ts                                  ← extend with state machine
```

---

## Deployment Order

1. **Supabase migration** — JWT hook function (PR 2 prerequisite)
2. **Deploy PR 1** — bug fixes, security, role-service
3. **Deploy PR 2** with `NEXT_PUBLIC_AUTH_FLOW_V2=false`
4. **Verify in staging** — test all 5 state transitions
5. **Enable** `NEXT_PUBLIC_AUTH_FLOW_V2=true` in production

---

## Post-Deploy Verification Checklist

- [ ] `/signup` → 302 → `/register`
- [ ] New email signup → redirects to `/verify-email` (not `/dashboard`)
- [ ] OAuth signup (Google) as professional → correct role assigned → onboarding page
- [ ] OAuth signup (Google) as buyer → homebuyer role → onboarding page
- [ ] `/auth/callback?error=` → `/login` with error banner visible
- [ ] Authenticated + unverified email → redirect to `/verify-email`
- [ ] Authenticated + verified + no onboarding → redirect to `/register/onboarding/[role]`
- [ ] Fully onboarded user → `/dashboard` (no loop)
- [ ] `/account-suspended?code=fraud_violation` → correct hardcoded message
- [ ] Return URL preserved after OAuth (browse to `/properties/123` → sign in → land back)

---

## TODOS.md Items Added (from review)

| Priority | Item | Effort |
|----------|------|--------|
| P1 | Extract `role-service.ts` | S |
| P2 | PostHog signup funnel events | S |
| P2 | Extend email verification TTL to 24h (Supabase dashboard) | S |
| P2 | Referral code capture at signup (`?ref=CODE` → `profiles.referral_source`) | S |
| P3 | Role-specific signup URLs (`/signup-agent` etc.) | S |
| P2 vision | Verify-email progress ring | S |
| P2 vision | Social proof on signup page | S |
| P2 vision | Activation email sequence (+24h, +72h nudges) | M |

---

## What is NOT in scope

| Item | Reason |
|------|--------|
| Passkey / WebAuthn | Not in Phase 1 spec |
| Magic link login | Not in spec |
| Disposable email blocking | Third-party API needed, Phase 2+ |
| Admin-triggered account lock mechanism | No server-side lock trigger yet |
| Backup code storage/verification for 2FA | `generateBackupCodes()` exists but no storage path — Phase 2 |

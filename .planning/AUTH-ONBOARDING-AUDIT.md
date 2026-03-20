# MEGA PLAN REVIEW — Authentication & Onboarding (3.1–3.19)

**Mode: HOLD SCOPE**
**Date: 2026-03-18**
**Scope: System audit of all 19 auth/onboarding pages**

---

## PRE-REVIEW SYSTEM AUDIT

### Current System State

The authentication and onboarding system is **substantially built**. This is NOT a greenfield build — it's a system audit of existing, implemented code.

**What exists on main:**
- **15 auth pages** under `(auth)/` route group
- **23 auth components** (~3,668 lines) including all onboarding flows
- **3 auth services** (auth-service.ts, role-service.ts, verification-service.ts — 410 lines total)
- **2 GDPR services** (consent-service.ts, export-service.ts — 191 lines)
- **3 auth hooks** (useAuth, useRole, useConsent)
- **Middleware** with CSP Level 3, RBAC, security headers (255 lines)
- **Auth callback** route with OAuth code exchange
- **6 role-specific onboarding wizards** (Buyer, Seller, Landlord, Agent, Tradesperson, Mortgage Broker)
- **2FA** — setup flow (QR code, backup codes) + verification (6-digit OTP)
- **Account status pages** — locked (30-min countdown), suspended (reason codes), deletion confirm (30-day grace)
- **Email verification** — pending page with resend cooldown + confirmed page

**What's in flight:**
- `fix/auth-onboarding-fixes` branch has 10 commits fixing real bugs found during testing (server-only import in client, OAuth error banner, deletion confirm race condition, suspension reason enum, role-service extraction, RegisterForm redirect/error handling)
- Stash `stash@{5}` contains WIP auth fixes (Suspense boundary, role-service refactor) — **NOT merged to main**

**Known pain points from fix branch:**
1. Server-only import leaked into client component (RegisterForm)
2. OAuth errors were swallowed silently (no UI banner)
3. Deletion confirm had race condition (redirect before DB update)
4. Suspension reasons were free-text (now enum codes)
5. Role assignment had no input validation
6. RegisterForm had redirect, error handling, and professional role param issues
7. OAuth didn't preserve role intent via state param

**TODOS.md** has 5 items — all billing/pricing related, none auth-related.

### Retrospective Check

The `fix/auth-onboarding-fixes` branch represents a previous review/fix cycle. **10 bugs were found and fixed**, primarily around:
- Silent error swallowing (OAuth errors, deletion race)
- Client/server boundary violations
- Missing input validation
- Free-text where enums should exist

These are **architectural smells** indicating the original implementation was optimistic-path focused.

### Mapping to PRD Pages (3.1–3.19)

| PRD Page | Status | File(s) |
|----------|--------|---------|
| 3.1 Sign Up — Role Selector | **BUILT** | `register/role-select/page.tsx`, `RoleSelector.tsx` |
| 3.2 Sign Up — Email/Password | **BUILT** | `register/page.tsx`, `RegisterForm.tsx` |
| 3.3 Sign Up — Social OAuth | **BUILT** | `OAuthButtons.tsx` (Google, Apple) |
| 3.4 Email Verification — Pending | **BUILT** | `verify-email/page.tsx` |
| 3.5 Email Verification — Confirmed | **BUILT** | `verify-email/confirmed/page.tsx` |
| 3.6 Login | **BUILT** | `login/page.tsx`, `LoginForm.tsx` |
| 3.7 Forgot Password | **BUILT** | `forgot-password/page.tsx`, `ForgotPasswordForm.tsx` |
| 3.8 Reset Password | **BUILT** | `reset-password/page.tsx`, `ResetPasswordForm.tsx` |
| 3.9 Two-Factor Authentication Setup | **BUILT** | `two-factor-setup/page.tsx`, `TwoFactorSetupFlow.tsx` |
| 3.10 2FA Code Entry | **BUILT** | `two-factor/page.tsx`, `TwoFactorForm.tsx` |
| 3.11 Onboarding — Buyer/Renter | **BUILT** | `BuyerOnboarding.tsx` (4-step wizard) |
| 3.12 Onboarding — Seller | **BUILT** | `SellerOnboarding.tsx` |
| 3.13 Onboarding — Landlord | **BUILT** | `LandlordOnboarding.tsx` |
| 3.14 Onboarding — Estate Agent | **BUILT** | `AgentOnboarding.tsx` |
| 3.15 Onboarding — Tradesperson | **BUILT** | `TradespersonOnboarding.tsx` |
| 3.16 Onboarding — Mortgage Broker | **BUILT** | `MortgageBrokerOnboarding.tsx` |
| 3.17 Account Locked | **BUILT** | `account-locked/page.tsx` (30-min countdown) |
| 3.18 Account Suspended | **BUILT** | `account-suspended/page.tsx` (enum reason codes) |
| 3.19 Account Deletion Confirmation | **BUILT** | `account-deletion-confirm/page.tsx` (30-day grace) |

**All 19 pages are implemented.**

### Critical Finding: Fix Branch Not Merged

The `fix/auth-onboarding-fixes` branch has **10 bug fixes** that are NOT on main. These include real security and UX issues (server-only import leak, OAuth error swallowing, race conditions). This branch needs to be merged before any further auth work.

---

## Step 0: Nuclear Scope Challenge + Mode Selection

### 0A. Premise Challenge

1. **Is this the right problem to solve?** This is a system audit of already-built code, not a new feature plan. The right framing is: "Is the auth system production-ready?" — not "Should we build auth?"

2. **Actual outcome:** Users can securely create accounts, verify identity, onboard per role, and manage their auth lifecycle. The code exists — the question is whether it's **robust enough** to ship.

3. **What if we did nothing?** The auth system works for happy-path flows. But the fix branch reveals 10 bugs already found, suggesting more lurk unfound. Doing nothing = shipping with known silent failures.

### 0B. Existing Code Leverage

All 19 PRD pages map to existing code. No rebuilding needed. The audit focuses on:
- Are the fix branch bugs merged?
- Are there MORE bugs of the same class (silent errors, client/server leaks, race conditions)?
- Is the error/rescue coverage adequate?
- Is the security posture sound?

### 0C. Dream State Mapping

```
CURRENT STATE                    THIS AUDIT                    12-MONTH IDEAL
All 19 pages built       --->    Find & fix gaps,       --->   Auth system that handles
10 known bugs on          |      merge fix branch,              10K signups/day with zero
unmerged branch           |      ensure security +              silent failures, full
No unit tests on main     |      observability                  audit trail, rate limiting,
for many auth paths                                             anomaly detection, and
                                                                progressive verification
```

### 0D. Mode: HOLD SCOPE

Maximum rigor audit of existing 19 pages. Find every bug, security hole, silent failure. Merge fix branch. Map all error paths. No new features.

---

## Section 1: Architecture Review

### System Architecture Diagram

```
+---------------------------------------------------------------------+
|                         BROWSER (CLIENT)                            |
|                                                                     |
|  +------------------+  +------------------+  +------------------+   |
|  |  LoginForm       |  | RegisterForm     |  | OAuthButtons     |   |
|  |  (useAuth)       |  | (useAuth)        |  | (useAuth)        |   |
|  +--------+---------+  +--------+---------+  +--------+---------+   |
|           |                      |                      |           |
|  +--------v----------------------v----------------------v--------+  |
|  |                   useAuth hook                                |  |
|  |  user state, loading, signIn, signUp, signOut, OAuth          |  |
|  +--------+------------------------------------------------------+  |
|           |                                                         |
|  +--------v------------------------------------------------------+  |
|  |               auth-service.ts (CLIENT)                         |  |
|  |  signUp, signIn, signInWithOAuth, signOut, resetPassword,      |  |
|  |  updatePassword, getUser                                       |  |
|  +--------+------------------------------------------------------+  |
|           |                                                         |
|  +--------v----------+                                              |
|  | supabase/client   | <-- createBrowserClient()                   |
|  +--------+----------+                                              |
+-----------+-------------------------------------------------------------+
            | HTTPS
+-----------+-------------------------------------------------------------+
|           v         NEXT.JS MIDDLEWARE (edge)                        |
|  +-------------------------------------------------------------------+  |
|  |  middleware.ts (256 lines)                                         |  |
|  |  1. CSP nonce generation                                           |  |
|  |  2. Security headers (X-Frame, X-Content-Type, etc.)               |  |
|  |  3. Auth check: getUser() -- NOT getSession() OK                   |  |
|  |  4. Route protection (PUBLIC/AUTH/PROTECTED)                        |  |
|  |  5. Admin route guard (role check) <-- BROKEN: wrong column        |  |
|  |  6. Default role fallback <-- CONCERN: writes on every request     |  |
|  |  7. Billing/subscription gating                                    |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------+  +-------------------------------------+    |
|  |  SERVER COMPONENTS     |  |  API ROUTES                         |    |
|  |  (auth pages render)   |  |  /auth/callback (PKCE exchange)     |    |
|  |                        |  |  /api/gdpr/export                   |    |
|  +------------------------+  |  /api/gdpr/delete                   |    |
|                               |  /api/settings/sessions             |    |
|  +------------------------+  +------------------+------------------+    |
|  |  SERVER SERVICES        |                    |                       |
|  |  role-service.ts        | <------------------+                      |
|  |  verification-svc.ts    |                                            |
|  |  consent-service.ts     |                                            |
|  |  export-service.ts      |                                            |
|  +-----------+------------+                                             |
|              |                                                          |
|  +-----------v------------+  +----------------------+                   |
|  |  supabase/server.ts    |  |  supabase/admin.ts   |                  |
|  |  (cookie-aware)        |  |  (SERVICE_ROLE_KEY)   |                  |
|  +-----------+------------+  +-----------+----------+                   |
+--------------+----------------------------+-----------------------------+
               |                            |
+--------------v----------------------------v-----------------------------+
|                      SUPABASE                                           |
|  +----------------+  +----------------+  +--------------------+         |
|  |  Auth (GoTrue) |  |  PostgreSQL    |  |  Storage (avatars) |        |
|  |  - signup      |  |  - profiles    |  |                    |        |
|  |  - signin      |  |  - user_roles  |  +--------------------+        |
|  |  - OAuth       |  |  - consent     |                                |
|  |  - MFA/TOTP    |  |  - verify      |  +--------------------+        |
|  |  - recovery    |  |  - audit_log   |  |  Upstash Redis     |       |
|  +----------------+  |  - deletion    |  |  (rate limiting)   |       |
|                      |  + RLS OK      |  +--------------------+        |
|                      |  + triggers OK |                                |
|                      +----------------+                                |
+------------------------------------------------------------------------+
```

### Architectural Issues Found

**1. CRITICAL -- Role assignment is non-atomic (race condition)**
`role-service.ts` performs two separate DB calls in `assignRole()`: upsert to `user_roles` then update `profiles.active_role`. If the second fails, state is inconsistent. The code even has a `// TODO: wrap in RPC for atomicity` comment.
**Decision: Fix now with RPC.**

**2. CRITICAL -- Middleware assigns default role on EVERY /dashboard request**
If `active_role` is null, middleware writes "homebuyer" to the DB on every request. This is a write-on-read pattern in middleware that:
- Creates unnecessary DB writes
- Could race with the registration flow (user is selecting roles while middleware overwrites)
- Should only happen once during signup/callback
**Decision: Move to callback only. Middleware redirects to role-select if null.**

**3. HIGH -- Admin role field naming inconsistency**
Middleware checks `profile?.role !== "admin"` but the schema has `is_admin` (boolean). This means admin route protection may be checking a non-existent column.
**Decision: Fix to use `is_admin === true`.**

**4. HIGH -- Rate limiting fails open**
When Redis is unavailable, `createRateLimiter()` returns a no-op that always allows requests. For auth endpoints (login, signup, password reset), this means brute-force protection disappears silently.
**Decision: Fail closed for auth endpoints when Redis down.**

**5. MEDIUM -- Fix branch not merged to main**
10 bug fixes sitting on `fix/auth-onboarding-fixes` branch. Includes security-relevant fixes (server-only import leak, race conditions, input validation).
**Decision: Merge to main now.**

**6. MEDIUM -- No separate RenterOnboarding**
The `renter` role uses `BuyerOnboarding` implicitly but this isn't documented. The onboarding router should make this explicit.

**7. MEDIUM -- Onboarding DB writes lack transactions**
Each onboarding component makes 1-3 separate Supabase calls without transactional wrapping. Partial failures leave orphaned records.

### Coupling Assessment

```
BEFORE (planned architecture):
  auth-service --> Supabase Auth
  role-service --> Supabase DB
  middleware --> Supabase Auth only

AFTER (current reality):
  auth-service --> Supabase Auth
  role-service --> Supabase DB (2 tables, non-atomic)
  middleware --> Supabase Auth + DB reads + DB WRITES <-- CONCERN
  callback --> Supabase Auth + role-service + email-service
```

### Scaling -- What Breaks First

At **10x load**: Middleware DB calls for `active_role` check on every `/dashboard` request.
At **100x load**: Rate limiter Redis calls + middleware DB calls. Fail-open rate limiter means brute-force attacks succeed when Redis is overloaded.

### Rollback Posture: 4/5

All code changes are in feature branches or on main. DB migration (001_foundation.sql) is the hardest to roll back.

---

## Section 2: Error & Rescue Map

### Error Map -- Auth Service Layer

```
METHOD/CODEPATH              | WHAT CAN GO WRONG              | EXCEPTION/ERROR
-----------------------------|--------------------------------|------------------
auth-service.signUp          | Duplicate email                | AuthApiError (email_exists)
                             | Weak password (Supabase policy)| AuthApiError
                             | Supabase down                  | NetworkError
                             | Rate limited by Supabase       | AuthApiError (429)
auth-service.signIn          | Wrong credentials              | AuthApiError
                             | Email not verified             | AuthApiError
                             | Account locked                 | AuthApiError
                             | Supabase down                  | NetworkError
auth-service.signInWithOAuth | Provider down (Google/Apple)   | AuthApiError
                             | Popup blocked                  | AuthApiError
                             | User cancels OAuth             | No error (silent)
auth-service.resetPassword   | Email not found                | Supabase returns success OK
                             | Rate limited                   | AuthApiError (429)
auth-service.updatePassword  | Weak password                  | AuthApiError
                             | Session expired                | AuthApiError
role-service.assignRole      | Invalid role string            | Validated OK (fix branch)
                             | DB upsert fails                | PostgrestError
                             | Profile update fails           | PostgrestError <-- GAP (no tx)
                             | User doesn't exist             | PostgrestError
role-service.selectRoles     | Empty roles array              | Validated OK
                             | Partial insert failure         | PostgrestError <-- GAP (no tx)
role-service.switchRole      | User doesn't have role         | Returns error OK
verification-svc.submit      | Out-of-order stage             | Returns error OK
                             | User submits admin_review      | Returns error OK
                             | DB insert fails                | PostgrestError
consent-service.initialize   | Duplicate consent records      | upsert handles OK
                             | DB connection failure          | PostgrestError <-- GAP
consent-service.update       | Client-side: IP always null    | Not an error, data loss <-- GAP
export-service.exportUserData| Admin client misconfigured     | Supabase error <-- GAP
                             | User has no data               | Returns empty fields OK
/auth/callback GET           | No code param                  | Redirects to /login OK
                             | Invalid/expired code           | Redirects with error OK
                             | Role assignment fails          | Redirects with role_setup_failed OK
/api/gdpr/delete POST        | Duplicate pending request      | Returns 409 OK
                             | Unauthenticated                | Returns 401 OK
                             | DB insert fails                | PostgrestError <-- GAP
/api/gdpr/export GET         | Rate limited (1/hr)            | Returns 429 OK (if Redis up)
                             | Redis down                     | No rate limit <-- GAP
                             | Unauthenticated                | Returns 401 OK
useAuth hook                 | getUser fails silently         | Sets user=null, loading=false
                             | onAuthStateChange errors       | Not caught <-- GAP
useRole hook                 | switchRole DB failure          | Not surfaced to user <-- GAP
useConsent hook              | Consent upsert fails           | Sets error state OK
```

### Rescue Status Summary

```
ERROR CLASS/CODEPATH          | RESCUED? | RESCUE ACTION           | USER SEES
------------------------------|----------|-------------------------|------------------
signUp duplicate email        | Y        | Error message in form   | "Email already registered"
signUp weak password          | Y        | Error message in form   | Supabase error message
signIn wrong credentials      | Y        | Error message in form   | "Invalid credentials"
signInWithOAuth popup blocked | N <-GAP  | --                      | Nothing (silent fail)
OAuth user cancels            | N <-GAP  | --                      | Nothing (silent)
assignRole 2nd call fails     | N <-GAP  | --                      | Stale active_role
selectRoles partial failure   | N <-GAP  | --                      | Incomplete role set
consent DB failure            | PARTIAL  | catch exists but generic | "Error updating" toast
export admin client error     | N <-GAP  | --                      | 500 error
GDPR delete DB insert fail    | N <-GAP  | --                      | 500 error
useAuth state change error    | N <-GAP  | --                      | Stale auth state
useRole switchRole failure    | N <-GAP  | --                      | Role appears unchanged
Redis down (rate limit)       | Y(wrong) | Fails open              | No protection <-- BAD
Middleware DB read failure    | N <-GAP  | --                      | Possibly 500 or wrong route
Onboarding partial write fail | N <-GAP  | --                      | Redirects to dashboard
```

### Critical Gaps (8 total)

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| 1 | `assignRole` non-atomic | Inconsistent user state | RPC function (FIX NOW) |
| 2 | `selectRoles` non-atomic | Incomplete roles | Same RPC function |
| 3 | OAuth cancel/block silent | User confused, no feedback | P2 TODO |
| 4 | `useAuth` state change errors | Stale auth state | Add error callback |
| 5 | `useRole` switchRole silent failure | Role switch appears to work but didn't | Surface error via toast |
| 6 | Middleware DB read failure | Unknown routing behavior | Try/catch, fail to /login (FIX NOW) |
| 7 | Onboarding partial write | Orphaned DB records | P2 TODO (transaction wrapping) |
| 8 | GDPR delete/export 500 errors | User gets generic error | Specific error messages + logging |

---

## Section 3: Security & Threat Model

### Attack Surface Map

```
ATTACK VECTOR              | ENDPOINT/COMPONENT          | SEVERITY | MITIGATED?
---------------------------|-----------------------------|----------|----------
Brute-force login          | /login, signIn()            | HIGH     | PARTIAL <-- Redis fail-open
Credential stuffing        | /login                      | HIGH     | PARTIAL <-- same
Account enumeration        | /forgot-password            | LOW      | YES (Supabase returns success for all)
Account enumeration        | /register (duplicate email) | MEDIUM   | NO <-- reveals email exists
OAuth CSRF                 | /auth/callback              | HIGH     | YES (PKCE code verifier)
Session fixation           | Auth cookies                | HIGH     | YES (Supabase handles)
XSS via user input         | Display name, forms         | MEDIUM   | PARTIAL <-- no sanitization
CSRF on state changes      | /api/gdpr/delete            | MEDIUM   | NO <-- no CSRF token
CSRF on state changes      | /api/gdpr/export            | LOW      | GET method (side-effect-free)
IDOR on role switch        | switchRole(userId, role)     | HIGH     | YES (userId from auth token)
IDOR on data export        | /api/gdpr/export            | HIGH     | YES (userId from auth)
IDOR on verification       | submitVerification()        | HIGH     | YES (userId from auth)
Admin privilege escalation | /admin routes               | CRITICAL | BROKEN <-- wrong column name
RLS bypass                 | Direct DB queries           | HIGH     | VERIFIED OK (RLS on all tables)
Service role key exposure  | admin.ts                    | CRITICAL | OK (server-only, env var)
JWT tampering              | Auth tokens                 | HIGH     | YES (Supabase HMAC)
Onboarding data injection  | Onboarding forms            | MEDIUM   | PARTIAL <-- no sanitization
Rate limit bypass          | All auth endpoints          | HIGH     | BROKEN when Redis down
Password reset token reuse | /reset-password             | HIGH     | YES (Supabase single-use)
```

### Critical Security Findings

| # | Finding | Likelihood | Impact | Status |
|---|---------|-----------|--------|--------|
| S1 | Admin route checks wrong column (`role` vs `is_admin`) | HIGH | CRITICAL | **FIX NOW** |
| S2 | No CSRF protection on POST /api/gdpr/delete | LOW | HIGH | P1 TODO |
| S3 | Registration reveals email existence | MEDIUM | MEDIUM | P2 TODO |
| S4 | No input sanitization on display_name, onboarding fields | LOW | MEDIUM | **FIX NOW** |
| S5 | Rate limit disappears when Redis down | LOW | HIGH | **FIX NOW** |
| S6 | Onboarding forms don't validate input length | MEDIUM | LOW | Part of sanitization fix |

---

## Section 4: Data Flow & Interaction Edge Cases

### Registration Data Flow

```
USER INPUT --> VALIDATION --> SUPABASE AUTH --> CALLBACK --> ROLE SELECT --> ONBOARDING --> DASHBOARD
  |               |              |                |            |                |              |
  v               v              v                v            v                v              v
[nil name?]   [Zod catches] [signUp error?]  [no code?]   [0 roles?]     [partial write?] [no role?]
[xss in       [min 2 chars] [dup email?]     [expired?]   [invalid role?] [skip all?]     [redirect
 name?]       [email format][rate limit?]    [role assign  [>6 roles?]    [DB timeout?]    loop?]
              [pw strength]                   fails?]
```

### Interaction Edge Cases

```
INTERACTION              | EDGE CASE                    | HANDLED? | HOW?
-------------------------|------------------------------|----------|---------------------------
Registration submit      | Double-click submit          | PARTIAL  | Loading state disables btn
                         | Submit with expired session  | N <-GAP  | Supabase returns error,
                         |                              |          | but no specific handling
                         | Navigate away mid-signup     | Y        | No side effects until submit
Login submit             | Double-click                 | Y        | Loading state
                         | Wrong password 10x           | PARTIAL  | Supabase locks, but no
                         |                              |          | client-side attempt counter
                         | Account locked               | N <-GAP  | Supabase returns error but
                         |                              |          | client doesn't redirect to
                         |                              |          | /account-locked
Role selection           | Select 0 roles               | Y        | Button disabled
                         | Select all 6 roles           | Y        | No upper limit OK
                         | Double-submit                | Y        | upsert handles duplicates
Onboarding wizard        | Skip all steps               | Y        | Skip button on each step
                         | Navigate away mid-wizard     | Y        | No writes until Complete
                         | Browser back during wizard   | N <-GAP  | Wizard state resets
Email verification       | Resend spam (rapid clicks)   | Y        | 60s cooldown OK
                         | Token expired                | PARTIAL  | Supabase handles, generic msg
                         | Already verified user visits | N <-GAP  | Still shows "check email"
Password reset           | Token expired                | PARTIAL  | Supabase error, generic msg
                         | Token already used           | PARTIAL  | Supabase error, generic msg
2FA setup                | User abandons mid-setup      | Y        | Can return later
                         | Backup codes never saved     | N <-GAP  | User can complete without saving
2FA verification         | Wrong code 3x                | PARTIAL  | Supabase rate limits
Account deletion         | Double-submit                | Y        | 409 for duplicate requests OK
                         | User logs in during grace    | N <-GAP  | Should cancel deletion
Account locked           | Timer reaches 0              | PARTIAL  | Shows "try logging in"
OAuth flow               | Provider down                | PARTIAL  | Error banner (fix branch)
                         | Popup blocked                | N <-GAP  | Silent failure
```

### Gaps Requiring Action

| # | Gap | Severity | Fix | Decision |
|---|-----|----------|-----|----------|
| E1 | Login doesn't redirect to /account-locked on lockout | MEDIUM | Check error code, redirect | **FIX NOW** |
| E2 | Already-verified user sees "check email" page | LOW | Check verification status | P3 |
| E3 | Backup codes not enforced before completing 2FA setup | MEDIUM | Require confirmation checkbox | **FIX NOW** |
| E4 | Account deletion not auto-cancelled on login | MEDIUM | Check + banner + cancel API | **FIX NOW** |
| E5 | Browser back breaks onboarding wizard state | LOW | URL-based step state | P3 |

---

## Section 5: Code Quality Review

### DRY Violations

| # | Pattern | Locations | Fix |
|---|---------|-----------|-----|
| D1 | Supabase error handling pattern | Every onboarding component, auth forms, hooks | **FIX NOW**: Extract `handleSupabaseError()` utility |
| D2 | Onboarding wizard step logic | All 6 onboarding components | P3 |
| D3 | Role-specific nav items hardcoded | Sidebar.tsx | P3 |
| D4 | Loading button pattern | LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm | P3 |

### Under-Engineering Check

- **Onboarding forms lack input validation** beyond Zod schemas. Max lengths, XSS sanitization, format validation missing.
- **No retry logic** on any Supabase call.
- **No optimistic updates** — acceptable for auth flows.

---

## Section 6: Test Review

### Test Coverage Assessment

```
FLOW                    | UNIT | INTEGRATION | E2E  | STATUS
------------------------|------|-------------|------|--------
signUp                  | Y    | N           | N    | PARTIAL -- mock only
signIn                  | N    | N           | N    | <-- GAP
OAuth                   | Y    | N           | N    | PARTIAL -- mock only
Password reset          | Y    | N           | N    | PARTIAL -- mock only
Email verification      | Y    | N           | N    | PARTIAL -- mock only
Session management      | Y    | N           | N    | PARTIAL -- mock only
Role selection          | N    | N           | N    | <-- GAP
Role switching          | N    | N           | N    | <-- GAP
Onboarding (all 6)     | N    | N           | N    | <-- GAP
2FA setup               | N    | N           | N    | <-- GAP
2FA verification        | N    | N           | N    | <-- GAP
Account locked page     | N    | N           | N    | <-- GAP
Account suspended page  | N    | N           | N    | <-- GAP
Account deletion flow   | N    | N           | N    | <-- GAP
Provider verification   | N    | N           | N    | <-- GAP
Middleware auth guard   | Y    | N           | N    | PARTIAL
GDPR consent            | N    | N           | N    | <-- GAP
GDPR export             | N    | N           | N    | <-- GAP
GDPR deletion           | N    | N           | N    | <-- GAP
CSP headers             | N    | N           | N    | <-- GAP
```

Only **2 actual test files** exist for the entire auth system. The plan specified 12+.
**Decision: P1 TODO for comprehensive test suite.**

---

## Section 7: Performance Review

- **Middleware DB reads**: 1-3 separate DB queries per request (~50-100ms added). **P2 TODO: combine into single RPC.**
- **Data export**: Queries 7 tables sequentially. Could parallelize with `Promise.all`.
- **Role selection with 6 roles**: Should be batched upsert.
- **No N+1 queries** found.
- **8 indexes verified** on foundation tables.

---

## Section 8: Observability & Debuggability Review

### Current Logging State

| Codepath | Structured Logging? |
|----------|---------------------|
| signUp/signIn/signOut | N -- Nothing server-side |
| OAuth callback | PARTIAL -- Errors only |
| Role assignment | N -- Nothing |
| Onboarding writes | N -- Nothing |
| GDPR export | Y -- auth_audit_log entry OK |
| GDPR delete | Y -- auth_audit_log entry OK |
| Consent changes | Y -- consent_audit_log via DB trigger OK |
| Middleware auth check | N -- Nothing |
| Rate limiter failures | N -- Nothing |
| 2FA setup/verify | N -- Nothing |
| Provider verification | N -- Nothing |

**Decision: Add role change audit logging NOW. P2 TODO for structured auth logging across all codepaths.**

---

## Section 9: Deployment & Rollout Review

- Migration `001_foundation.sql` is backward-compatible, additive, zero-downtime. OK.
- No feature flags needed (auth is all-or-nothing).
- Rollback: git revert + redeploy (~30s).
- No deploy-time risk window (Next.js atomic deploys).
- **No issues flagged.**

---

## Section 10: Long-Term Trajectory Review

### Technical Debt

| Debt Type | Item | Severity |
|-----------|------|----------|
| Code | 10 test files never written | HIGH |
| Code | DRY violations across onboarding | LOW |
| Code | No input sanitization | MEDIUM |
| Operational | No auth event monitoring/alerting | MEDIUM |
| Operational | No structured logging | MEDIUM |
| Architecture | Non-atomic role assignment | HIGH (being fixed) |
| Architecture | Middleware write-on-read | HIGH (being fixed) |

### Reversibility: 4/5

Most decisions easily reversible. DB schema hardest to change.

---

## Required Outputs

### NOT in scope

1. **Magic links / passwordless auth** -- Not in PRD
2. **Passkeys / WebAuthn** -- Not in v3.0 scope
3. **Device management UI** -- Active sessions page exists but limited
4. **IP-based geo-blocking** -- Not required
5. **Account recovery without email** -- Out of scope
6. **Social login (Facebook)** -- Listed in PRD 3.3 but deliberately deferred
7. **Biometric auth** -- PWA scope, Phase 7
8. **Email template customization** -- Outside auth audit scope

### What already exists

| Sub-problem | Existing Code | Reused? |
|-------------|--------------|---------|
| Email/password signup | auth-service.signUp + RegisterForm | OK |
| OAuth (Google/Apple) | OAuthButtons + auth/callback | OK |
| Email verification | verify-email pages + Supabase trigger | OK |
| Password reset | ForgotPasswordForm + ResetPasswordForm | OK |
| 2FA setup/verify | TwoFactorSetupFlow + TwoFactorForm | OK |
| Role selection | RoleSelector + role-service | OK |
| Onboarding (6 roles) | 6 onboarding components | OK |
| Account status pages | locked + suspended + deletion | OK |
| GDPR consent | consent-service + ConsentForm | OK |
| Data export | export-service + API route | OK |
| Account deletion | consent-service + API route | OK |
| Middleware (CSP/RBAC) | middleware.ts | OK (with bugs) |
| Provider verification | verification-service + pipeline UI | OK |

### Dream state delta

```
CURRENT (post-audit):                    12-MONTH IDEAL:
OK All 19 pages built                    OK Same pages, battle-tested
X  2 of 12 test files exist              OK Full test coverage + load tests
X  No structured logging                 OK Auth event dashboard
X  No input sanitization (fixing)        OK Sanitized + validated
X  Rate limit fails open (fixing)        OK Fail-closed + in-memory fallback
X  Non-atomic role assignment (fixing)   OK Transactional via RPC
X  No CSRF protection on APIs            OK CSRF tokens on all state changes
X  No anomaly detection                  OK Suspicious login alerts
X  Fix branch unmerged (merging)         OK All fixes landed
```

**Delta: ~70% toward ideal.**

### Failure Modes Registry

```
CODEPATH                | FAILURE MODE          | RESCUED? | TEST? | USER SEES?      | LOGGED?
------------------------|-----------------------|----------|-------|-----------------|--------
signUp                  | Duplicate email       | Y        | Y     | Error message   | N
signIn                  | Account locked        | PARTIAL  | N     | Generic error   | N <-CRIT
signInWithOAuth         | Popup blocked         | N        | N     | Silent          | N <-CRIT
assignRole              | 2nd DB call fails     | N        | N     | Stale role      | N <-CRIT
selectRoles             | Partial insert fail   | N        | N     | Incomplete roles| N <-CRIT
middleware DB read      | Connection timeout    | N        | N     | 500 or wrong rt | N <-CRIT
rate limiter            | Redis down            | Y(wrong) | N     | No protection   | N <-CRIT
consent update (client) | IP always null        | N/A      | N     | Data gap        | N
GDPR delete API         | DB insert failure     | N        | N     | 500             | N <-CRIT
onboarding write        | Partial table writes  | N        | N     | Redirect to dash| N <-CRIT
2FA setup               | Codes not saved       | N        | N     | Future lockout  | N
deletion grace period   | Login doesn't cancel  | N        | N     | Account deleted | N <-CRIT
```

**9 CRITICAL GAPS** (RESCUED=N, TEST=N, USER SEES=Silent or 500).

---

## Auth State Machine

```
                              +---------------+
                              |  ANONYMOUS    |
                              | (no session)  |
                              +------+--------+
                    +----------------+------------------+
                    v                v                   v
              +----------+   +-----------+   +----------------+
              |  SIGNUP  |   |  LOGIN    |   |  OAUTH         |
              | (email/pw|   | (email/pw)|   | (Google/Apple) |
              +----+-----+   +----+------+   +-------+--------+
                   |              |                    |
                   v              v                    v
         +--------------+  +---------------+  +--------------+
         | EMAIL_PENDING|  | AUTHENTICATED |  |  /auth/      |
         | (verify-email|  | (session set) |  |  callback    |
         +------+-------+  +------+--------+  +------+-------+
                |                  |                   |
                v                  |         +---------v--------+
         +--------------+         |         | ROLE_ASSIGNED    |
         | EMAIL_VERIFIED|        |         | (auto-homebuyer) |
         | (confirmed)  |         |         +---------+--------+
         +------+-------+         |                   |
                |                  v                   v
                |         +----------------------------+
                +-------->|      HAS_2FA?              |
                          +-----+------------+---------+
                                | NO         | YES
                                v            v
                    +---------------+ +-------------+
                    | ROLE_SELECT   | | 2FA_REQUIRED|
                    | (choose roles)| | (enter code)|
                    +-------+-------+ +------+------+
                            |                |
                            v                v
                    +---------------+ +-------------+
                    | ONBOARDING    | | 2FA_VERIFIED|
                    | (per-role)    | |             |
                    +-------+-------+ +------+------+
                            |                |
                            v                v
                    +------------------------------+
                    |         DASHBOARD            |
                    | (active_role determines view)|
                    +----------+-------------------+
                    +----------+----------------+
                    v          v                v
            +----------+ +----------+ +--------------+
            | LOCKED   | |SUSPENDED | | DELETION     |
            | (30min)  | | (admin)  | | REQUESTED    |
            +----+-----+ +----------+ | (30-day)     |
                 |                     +------+-------+
                 v                            v
            +----------+              +--------------+
            | UNLOCKED |              | DELETED      |
            | (retry)  |              | (purged)     |
            +----------+              +--------------+
```

---

## ACTION ITEMS -- FIX NOW (12 items)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 1 | Merge fix/auth-onboarding-fixes to main | Issue 6 | S |
| 2 | Create RPC for atomic role assignment (assignRole + selectRoles) | Issue 2 | M |
| 3 | Move default role assignment from middleware to callback only | Issue 3 | S |
| 4 | Fix admin guard to check `is_admin` not `role` | Issue 4 | S |
| 5 | Fail closed on auth endpoints when Redis down | Issue 5 | S |
| 6 | Add `sanitize()` utility, apply to all user inputs | Issue 11 | M |
| 7 | Redirect to /account-locked on login lockout error | Issue 12 | S |
| 8 | Require backup code acknowledgment in 2FA setup | Issue 13 | S |
| 9 | Implement deletion cancel flow (check on login, banner, cancel API) | Issue 14 | M |
| 10 | Extract shared `handleSupabaseError()` utility | Issue 15 | M |
| 11 | Add role change audit logging to auth_audit_log | Issue 18 | S |
| 12 | Add middleware try/catch with fail-safe redirect to /login | Issue 8 | S |

## TODOS.md Items (8 approved)

| # | Item | Priority | Effort | Depends on |
|---|------|----------|--------|------------|
| T1 | Comprehensive auth test suite (10+ files) | P1 | L | Fix branch merge + all FIX NOW items |
| T2 | CSRF protection on state-changing API routes | P1 | M | Nothing |
| T3 | OAuth popup/cancel detection | P2 | S | Fix branch merge |
| T4 | Registration email enumeration mitigation | P2 | M | Nothing |
| T5 | Middleware query optimization (single RPC) | P2 | M | is_admin fix |
| T6 | Structured auth logging across all codepaths | P2 | M | Sentry integration (optional) |
| T7 | Onboarding transaction wrapping (6 RPCs) | P2 | L | Supabase migration infrastructure |
| T8 | Consent IP address tracking via server action | P2 | S | Nothing |

## Completion Summary

```
+====================================================================+
|            MEGA PLAN REVIEW -- COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | HOLD SCOPE                                  |
| System Audit         | All 19 pages built, 10 bugs on unmerged     |
|                      | branch, 2 of 12 test files exist            |
| Step 0               | HOLD SCOPE -- audit existing, not expand    |
| Section 1  (Arch)    | 7 issues found (2 CRITICAL, 2 HIGH, 3 MED) |
| Section 2  (Errors)  | 14 error paths mapped, 8 GAPS               |
| Section 3  (Security)| 6 issues found, 2 High severity             |
| Section 4  (Data/UX) | 15 edge cases mapped, 5 unhandled           |
| Section 5  (Quality) | 4 DRY violations, 2 under-engineering gaps  |
| Section 6  (Tests)   | Diagram produced, 18 of 20 flows UNTESTED   |
| Section 7  (Perf)    | 1 issue (middleware multi-query)             |
| Section 8  (Observ)  | 5 gaps (no logging for most auth events)    |
| Section 9  (Deploy)  | 0 risks flagged (greenfield, safe migration)|
| Section 10 (Future)  | Reversibility: 4/5, debt items: 7           |
+--------------------------------------------------------------------+
| NOT in scope         | written (8 items)                           |
| What already exists  | written (13 sub-problems, all reused)       |
| Dream state delta    | written (~70% toward ideal)                 |
| Error/rescue registry| 14 methods, 8 CRITICAL GAPS                 |
| Failure modes        | 12 total, 9 CRITICAL GAPS                   |
| TODOS.md updates     | 8 items proposed (all approved)              |
| Diagrams produced    | 4 (architecture, state machine, error, deploy|
| Stale diagrams found | 0                                            |
| Unresolved decisions | 0                                            |
+====================================================================+
```

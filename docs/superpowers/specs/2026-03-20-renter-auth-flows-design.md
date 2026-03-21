# Renter Auth Flow: 10 Critical User Journeys (CUJs)

## Context

10 FAANG-level end-to-end auth flow scenarios for the "renter" role in Britestate. Each scenario combines a realistic user narrative with testable acceptance criteria, covering the full renter lifecycle with deep focus on every auth touchpoint. Goal: find what works and what doesn't before implementation.

## Infrastructure Summary

- **Auth**: Supabase Auth (JWT 1h + refresh 7d), OAuth (Google/Apple), atomic role RPCs
- **Middleware**: 5 guards (route protection, role guard, admin guard, subscription gate, URL role match)
- **Verification tiers**: basic (email) → standard (+phone) → enhanced (+ID)
- **Renter gates**: save=basic, viewings/messaging=standard, applications/tenancy=enhanced

## Critical Files

| File | Role |
|------|------|
| `src/middleware.ts` | Central auth enforcement, all 5 guards |
| `src/app/auth/callback/route.ts` | OAuth callback — **BUG: hardcodes "homebuyer" default** |
| `src/services/auth/auth-service.ts` | signUp, signIn, OAuth, password reset |
| `src/services/auth/role-service.ts` | Atomic RPCs (assign, select, switch) |
| `src/services/auth/verification-service.ts` | Progressive verification tiers |
| `src/hooks/useAuth.ts` | Client auth state, session monitoring |
| `src/hooks/useRole.ts` | Role state, switching |
| `src/app/api/gdpr/delete/route.ts` | GDPR deletion with re-auth gate |
| `src/components/auth/LoginForm.tsx` | Login, lockout detection, redirectTo validation |
| `src/components/auth/RegisterForm.tsx` | Registration, anti-enumeration |

---

## CUJ 1: Fresh Signup Happy Path

**Persona**: Priya Mehta, 27, junior solicitor relocating Birmingham → Manchester. First-time independent renter. Budget: £1,200 pcm. Anxious about 6-week timeline.

**Narrative**: Discovers Britestate via Google search. Browses public search without account. Clicks heart to save a flat → prompted to register. Selects "renter" role, creates account (email/password), verifies email, completes 4-step onboarding (Manchester M3, £800-1200 pcm, Flat, Parking, Instant alerts). Lands on renter dashboard. Saves the flat. Tries to apply → hits phone verification gate (standard) → completes. Hits ID verification gate (enhanced) → completes. Submits first application.

**Auth Touchpoints** (12 total):
1. Anonymous browse on `/search` (PUBLIC_ROUTES, no auth)
2. Save attempt → 401 → redirect to `/register`
3. `signUp()` + `assign_role_atomic("renter")`
4. Email verification → `/auth/callback` → exchange code → find existing renter role → `/register/onboarding/renter`
5. Onboarding wizard saves `buyer_preferences`
6. Dashboard access: middleware auth check + layout role match
7. Save property (authenticated) → 200
8. Application gate → verification_level check → 403 (basic < enhanced)
9. Phone verify → level becomes "standard"
10. ID verify → level becomes "enhanced"
11. Application submit → 200
12. Audit log: signup, email_verified, role_assigned, verification_completed ×2, application_submitted

**Test Flow** (23 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | `/search?listing_type=rent` | Loads without auth |
| 2 | Click heart icon | Redirect to `/login` or `/register` |
| 3 | Click "Create account" | `/register` with rent/buy toggle |
| 4 | Select "I want to rent" | Badge: "Signing up as: Renter" |
| 5 | Fill form: Priya, Mehta, email, password | No validation errors |
| 6 | Accept terms, click Continue | Loading → redirect to `/verify-email` |
| 7 | Check `auth.users` table | User created |
| 8 | Check `user_roles` | Row: role="renter" |
| 9 | Click email verification link | Through `/auth/callback` |
| 10 | Verify redirect | `/register/onboarding/renter` (NOT homebuyer) |
| 11 | Complete onboarding steps 1-4 | Preferences saved |
| 12 | Click "Complete Setup" | → `/dashboard/renter` |
| 13 | Verify dashboard | Empty state with "Find your next rental" CTA |
| 14 | Search → save a listing | 200 |
| 15 | Dashboard shows 1 saved rental | Stat card updated |
| 16 | Click Apply | Phone verification prompt |
| 17 | Complete phone OTP | Level → "standard" |
| 18 | Click Apply again | ID verification prompt |
| 19 | Upload driving licence | Level → "enhanced" (after admin approval) |
| 20 | Submit application | 200 |
| 21 | Dashboard shows application with "submitted" badge | ✓ |
| 22 | Check `auth_audit_log` | All events present |
| 23 | End-to-end < 15 min (excl. email wait) | ✓ |

**Failure Modes**:
- Weak password → inline error, retry
- Email already exists → same redirect (anti-enumeration)
- `assign_role_atomic` fails → callback assigns homebuyer fallback (**gap**)
- Email link expired → "Link expired" error, request new
- OTP wrong 3x → 5-min lockout

**FAANG Quality Bar**:
- Anti-enumeration: RegisterForm redirects to verify-email for existing users (correct)
- **Gap**: OAuth callback hardcodes homebuyer — role assignment catch-block fallback creates wrong role
- **Gap**: Onboarding uses sessionStorage — survives refresh but not browser close
- Defense-in-depth: layout.tsx independently validates role match (excellent)

---

## CUJ 2: OAuth Signup with Interruption & Recovery

**Persona**: David Chen, 34, developer. Impatient, 47 tabs open. Wants to rent near Canary Wharf.

**Narrative**: Clicks "Sign in with Google." OAuth succeeds but callback assigns "homebuyer" (hardcoded default — **this is a bug**). Before reacting, browser crashes. Returns 3 days later. Still authenticated (refresh token valid). Middleware routes him to `/dashboard/homebuyer`. Confused. Navigates to `/register/role-select`, adds "renter" role, switches active role. Now on correct dashboard.

**Auth Touchpoints** (10):
1. `signInWithOAuth("google")`
2. Google OAuth redirect + consent
3. Callback: exchange code → assign "homebuyer" (**bug**) → redirect to onboarding
4. Browser crash — session cookie persists
5. Return 3 days later — refresh token valid, JWT refreshed transparently
6. Middleware → `/dashboard/homebuyer`
7. `/register/role-select` → `select_roles_atomic(["renter"])`
8. `switch_role_atomic("renter")`
9. `/dashboard/renter` loads
10. URL guard: `/dashboard/homebuyer` now redirects to `/dashboard/renter`

**Test Flow** (15 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Click "Sign in with Google" | OAuth redirect to Google |
| 2 | Complete Google consent | Redirect to `/auth/callback` |
| 3 | Check `user_roles` | Row: role="homebuyer" (**bug**) |
| 4 | Check redirect destination | `/register/onboarding/homebuyer` (**bug**) |
| 5 | Simulate browser crash | Close tab/browser |
| 6 | Return 3 days later | Open site |
| 7 | Check auth state | Still authenticated (refresh token) |
| 8 | Verify middleware routing | → `/dashboard/homebuyer` |
| 9 | Navigate to `/register/role-select` | Role selection page loads |
| 10 | Select "renter" role | `select_roles_atomic` called |
| 11 | Check `user_roles` | Two rows: homebuyer + renter |
| 12 | Verify active role switch | `active_role = "renter"` |
| 13 | Check redirect | → `/dashboard/renter` |
| 14 | Navigate to `/dashboard/homebuyer` | Redirected to `/dashboard/renter` (URL guard) |
| 15 | Check `auth_audit_log` | oauth_login, role_added, role_switched events |

**Failure Modes**:
- Google OAuth timeout (30+ sec) → browser shows connection error
- Refresh token expired (>7 days) → login required
- Role selection RPC fails → user stuck on homebuyer

**Key Findings**:
- **BUG**: OAuth callback hardcodes "homebuyer" — no mechanism to pass rent intent through OAuth flow. Fix: use `state` parameter or pre-OAuth cookie.
- **Gap**: No `profiles.onboarding_completed_at` — incomplete onboarding not detected on return.
- Session survives 3-day gap via refresh token mechanism.

---

## CUJ 3: Verification Gate Escalation Mid-Task

**Persona**: Amara Osei, 31, marketing manager. Found dream flat in Hackney at £1,500 pcm. Urgency — good flats disappear in hours.

**Narrative**: Has basic (email-only) account from casual browsing. Clicks "Request Viewing" → hits standard gate (phone required). Inline phone verification completes in 60 seconds. Viewing booked. 2 days later, clicks "Apply Now" → hits enhanced gate (ID required). Uploads driving licence. Status: "submitted" — must wait for admin approval. Gets email 4 hours later: ID approved. Returns, application unlocked, submits.

**Auth Touchpoints** (11):
1. Property detail page (PUBLIC_ROUTES)
2. "Request Viewing" → client checks verification_level
3. Phone verification inline (< 60 sec)
4. Level → "standard", viewing form unlocks
5. "Apply Now" → verification_level check
6. ID upload → status "submitted" (not yet "approved")
7. Application form locked with "Verification pending" message
8. Admin approves → level → "enhanced"
9. Email notification → user returns
10. Session may need refresh (4-hour gap)
11. Application submitted

**Test Flow** (18 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Browse to property detail page | Loads without auth (PUBLIC_ROUTES) |
| 2 | Click "Request Viewing" | Verification gate check |
| 3 | Verify gate message | "Phone verification required" |
| 4 | Enter phone number | OTP sent |
| 5 | Enter OTP code | Verified |
| 6 | Check `provider_verifications` | Level → "standard" |
| 7 | Viewing form unlocks | Can fill in viewing details |
| 8 | Submit viewing request | 200 |
| 9 | Return 2 days later | Session may refresh |
| 10 | Click "Apply Now" | Verification gate check |
| 11 | Verify gate message | "ID verification required" |
| 12 | Upload driving licence | Upload succeeds |
| 13 | Check verification status | "submitted" (pending admin) |
| 14 | Application form locked | "Verification pending" message shown |
| 15 | Admin approves verification | Level → "enhanced" |
| 16 | User returns + refreshes | Application form unlocked |
| 17 | Submit application | 200 |
| 18 | Check `auth_audit_log` | verification_completed ×2, viewing_booked, application_submitted |

**Failure Modes**:
- OTP wrong 3x → 5-min lockout
- ID upload fails (file too large) → client-side validation
- Admin rejection → user must re-upload with different document
- Session expires during 4-hour wait → re-auth required

**Key Findings**:
- **Gap**: If Amara started filling the application form before hitting the ID gate, form state is lost. Need localStorage draft persistence.
- **Gap**: No Realtime subscription on `verification_level` — user must manually refresh to see approval.
- Progressive disclosure (reveal gates only when needed) is correct UX.
- Sequential stage enforcement in verification-service.ts (line 130-138) prevents skipping.

---

## CUJ 4: Expired Session During Critical Action

**Persona**: James Wheeler, 42, recently divorced, under deadline pressure. Filling rental application for 90 minutes. 5 PM landlord deadline.

**Narrative**: JWT expires at ~3 PM (1h lifetime). Network blip during train tunnel prevents refresh token from working. Session becomes invalid. James doesn't notice — form is client-side React state. At 3:45 PM, clicks Submit → 401. Toast: "Session expired. Sign in to continue." Re-auth modal opens OVER the form (preserving state). Signs in → submits → application goes through at 3:47 PM.

**Auth Touchpoints** (9):
1. Login (2 PM) → JWT + refresh token
2. JWT expires (~3 PM) → auto-refresh attempted
3. Refresh fails (network interruption) → `onAuthStateChange` fires `SIGNED_OUT`
4. Form interaction continues (no auth on keystrokes)
5. Submit → 401
6. Re-auth modal (NOT full-page redirect)
7. Session restored → `onAuthStateChange` fires `SIGNED_IN`
8. Retry submit → 200
9. Audit: session_expired, login, application_submitted

**Test Flow** (16 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as renter | JWT + refresh token issued |
| 2 | Navigate to application form | Form loads |
| 3 | Fill form for 60+ minutes | Client-side state maintained |
| 4 | Wait for JWT expiry (~1h) | Auto-refresh attempted |
| 5 | Simulate network failure | Refresh fails |
| 6 | `onAuthStateChange` fires | `SIGNED_OUT` event |
| 7 | Continue filling form | No interruption (no auth on keystrokes) |
| 8 | Click Submit | API call → 401 |
| 9 | Verify error handling | Toast: "Session expired" |
| 10 | Re-auth modal appears | Over the form (state preserved) |
| 11 | Enter credentials | Re-authentication |
| 12 | `onAuthStateChange` fires | `SIGNED_IN` event |
| 13 | Verify form state | All data still present |
| 14 | Auto-retry submit | 200 |
| 15 | Application appears in dashboard | "submitted" status |
| 16 | Check `auth_audit_log` | session_expired, login, application_submitted |

**Failure Modes**:
- Full-page redirect instead of modal → form state destroyed (**current behavior**)
- Network still down during re-auth → offline error
- Duplicate submission (first partially processed) → need idempotency key
- User closes re-auth modal → form still visible, submit still blocked

**Key Findings**:
- **Critical gap**: Current LoginForm navigates to a new page — would destroy form state. Need in-context re-auth modal.
- **Gap**: No localStorage draft persistence for application forms.
- **Gap**: No idempotency key — if first submit partially processed, retry creates duplicate.
- **Gap**: No proactive session monitoring — `useAuth` detects `SIGNED_OUT` but UI doesn't show re-auth modal preemptively.
- FAANG pattern: auto-retry the failed API call after re-auth, don't make user click Submit again.

---

## CUJ 5: Password Reset During Active Property Hunt

**Persona**: Fatima Hassan, 29, nurse. 15 saved properties, 3 saved searches, 1 pending viewing. Forgot password after 2 weeks away.

**Narrative**: Two failed login attempts → clicks "Forgot password?" → reset email → new password → `signOut({ scope: "others" })` invalidates all other sessions → redirect to login → logs in with new password → all data intact (15 saved, 3 searches, 1 viewing).

**Auth Touchpoints** (9):
1. Failed logins (no lockout at 2 attempts)
2. `/forgot-password` (AUTH_ROUTES)
3. `resetPasswordForEmail` with redirectTo
4. Reset link click → `/reset-password`
5. `updatePassword` → `signOut({ scope: "others" })`
6. Redirect to `/login?message=password-updated`
7. Login with new password
8. Dashboard loads — all data intact (keyed by user_id, unchanged)
9. Old password immediately invalid

**Test Flow** (17 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to `/login` | Login form loads |
| 2 | Enter email + wrong password (attempt 1) | Error: "Invalid credentials" |
| 3 | Enter email + wrong password (attempt 2) | Error: "Invalid credentials" (no lockout yet) |
| 4 | Click "Forgot password?" | Navigate to `/forgot-password` |
| 5 | Enter email | Loading state |
| 6 | Verify response | Success message (same for existing/non-existing emails) |
| 7 | Check email | Reset link received |
| 8 | Click reset link | Navigate to `/reset-password` |
| 9 | Enter new password (weak) | Inline validation error |
| 10 | Enter new password (strong) | Accepted |
| 11 | Confirm password | Match validated |
| 12 | Click "Reset Password" | `updatePassword` + `signOut({ scope: "others" })` |
| 13 | Verify redirect | `/login?message=password-updated` |
| 14 | Login with new password | Success |
| 15 | Check dashboard | 15 saved, 3 searches, 1 viewing intact |
| 16 | Try old password (different browser) | Rejected |
| 17 | Check `auth_audit_log` | login_failed ×2, password_reset_requested, password_updated, login |

**Failure Modes**:
- Reset link expired (default 1h) → "Link expired" error
- Reset link used twice → second attempt fails
- Non-existent email → same success message (anti-enumeration)
- Password same as old → currently allowed (**gap**)

**Key Findings**:
- Anti-enumeration: same success message for existing and non-existent emails (correct)
- **Gap**: No application-level rate limiting on `resetPassword` — relies on Supabase built-in only
- **Gap**: No password history enforcement (can reuse old password)
- Data integrity: all relationships use UUID FK, not email — password change has zero data impact

---

## CUJ 6: Multi-Role User Journey

**Persona**: Sophie Williams, 38, owns a flat in Brixton (selling), looking to rent in Richmond. Existing homebuyer account for 3 months.

**Narrative**: Adds "renter" role via Manage Roles. `select_roles_atomic` adds role without removing homebuyer. Switches to renter dashboard (empty). Saves 3 rental properties. Switches back to homebuyer — 8 saved buy-properties intact. Renter's 3 rentals don't appear in homebuyer view.

**Auth Touchpoints** (9):
1. Existing login, active_role = "homebuyer"
2. Add renter role → `user_roles` gets new row
3. Active role switches to "renter"
4. `/dashboard/renter` loads (empty)
5. Save rental properties
6. Switch to homebuyer → `switch_role_atomic("homebuyer")`
7. `/dashboard/homebuyer` — 8 saves, 2 viewings intact
8. URL guard: `/dashboard/renter` while active_role=homebuyer → redirect
9. Audit: role_added, role_switched ×2

**Test Flow** (19 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as existing homebuyer | Dashboard loads with 8 saved properties |
| 2 | Navigate to role management | Role management UI loads |
| 3 | Click "Add Renter role" | Confirmation dialog |
| 4 | Confirm | `select_roles_atomic` called |
| 5 | Check `user_roles` | Two rows: homebuyer + renter |
| 6 | Verify active role switch | `active_role = "renter"` |
| 7 | Check redirect | → `/dashboard/renter` |
| 8 | Verify empty state | "Find your next rental" CTA |
| 9 | Search for rentals | Rental listings shown |
| 10 | Save 3 rental properties | 200 each |
| 11 | Dashboard shows 3 saved | Stat card: 3 |
| 12 | Open role switcher | Both roles listed |
| 13 | Switch to homebuyer | `switch_role_atomic("homebuyer")` |
| 14 | Check redirect | → `/dashboard/homebuyer` |
| 15 | Verify homebuyer data | 8 saved properties, 2 viewings intact |
| 16 | Verify no rental data leakage | Renter's 3 saves not visible |
| 17 | Navigate to `/dashboard/renter` | Redirected (URL guard, wrong active role) |
| 18 | Switch back to renter | 3 saved rentals still there |
| 19 | Check `auth_audit_log` | role_added, role_switched ×3 |

**Failure Modes**:
- `select_roles_atomic` fails → error toast, role not added
- JWT claims show old role briefly after switch (race condition)
- Both roles save to same `buyer_preferences` row (**gap**)

**Key Findings**:
- **Data segregation question**: saved_properties filtered by `listing_type` (rent vs. sale), not by role. Correct, but must be explicit in queries.
- **Gap**: `buyer_preferences` is single row per user — renter and homebuyer search preferences would conflict. Need separate preference storage or role-keyed preferences.
- Race condition: JWT claims may show old role briefly after switch if fast-path is enabled.

---

## CUJ 7: Concurrent Multi-Device Session

**Persona**: Tom & Rachael Brooks, couple sharing one account. Desktop (Tom at work), phone (Rachael), tablet (together evenings).

**Narrative**: Both logged in simultaneously. Tom saves property on desktop → Rachael sees it on phone refresh. Rachael books viewing on phone → Tom sees it on desktop. Evening: application draft on tablet. Rachael changes password on phone → `signOut({ scope: "others" })` kills desktop + tablet sessions. Tablet shows re-auth modal over draft form.

**Auth Touchpoints** (12):
1. Phone login (session A)
2. Desktop login (session B) — both valid
3. Save property (session B) → 200
4. Data sync via React Query staleTime
5. Book viewing (session A) → 200
6. Tablet login (session C)
7. Application draft (session C)
8. Password change (session A) → `signOut({ scope: "others" })`
9. Session B invalidated → desktop shows session-expired
10. Session C invalidated → tablet shows re-auth modal
11. Session A still valid
12. Re-auth on tablet → form data preserved → submit

**Test Flow** (20 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login on phone (session A) | Dashboard loads |
| 2 | Login on desktop (session B) | Dashboard loads (both sessions valid) |
| 3 | Save property on desktop | 200 |
| 4 | Refresh phone | Saved property appears (React Query refetch) |
| 5 | Verify sync timing | Up to 60s delay (staleTime) |
| 6 | Book viewing on phone | 200 |
| 7 | Refresh desktop | Viewing appears |
| 8 | Login on tablet (session C) | Dashboard loads (3 sessions active) |
| 9 | Start application draft on tablet | Form state in React |
| 10 | Fill 50% of application | Client-side state only |
| 11 | Change password on phone | `signOut({ scope: "others" })` |
| 12 | Check phone (session A) | Still authenticated |
| 13 | Check desktop (session B) | Session expired notification |
| 14 | Check tablet (session C) | Session expired / re-auth modal |
| 15 | Verify form state on tablet | Data preserved (client-side) |
| 16 | Re-auth on tablet | New session created |
| 17 | Verify form data still present | All fields intact |
| 18 | Submit application | 200 |
| 19 | Re-auth on desktop | Login required |
| 20 | Check `auth_audit_log` | login ×3, password_changed, session_revoked ×2, login ×2 |

**Failure Modes**:
- Both sessions save same property simultaneously → duplicate (need UPSERT)
- Password change kills active form session → data loss if no re-auth modal
- 60s staleTime means stale data shown cross-device

**Key Findings**:
- **Gap**: Data sync relies on React Query polling (60s staleTime), not Realtime subscriptions — changes take up to 60s to appear cross-device.
- **Gap**: No duplicate prevention on concurrent saves — need UPSERT semantics (unique on user_id + listing_id).
- Shared account is technically a ToS violation — sessions API exists at `/api/settings/sessions` for review.

---

## CUJ 8: GDPR Deletion and Re-Registration

**Persona**: Elena Petrova, 26, moved back to Bulgaria. Wants full data deletion per GDPR Article 17.

**Narrative**: Settings → Privacy → Delete Account. Summary shown. Password re-auth required. Rate limited (1/hour). 30-day grace period. Redirected to confirmation page + signed out. Returns 5 days later → DeletionPendingBanner visible → cancels deletion. All data intact. 2 months later, requests deletion again. This time doesn't cancel. After 30 days, purge job runs: soft-delete, anonymize PII. Tries to re-register with same email → fresh account, zero data from old account.

**Auth Touchpoints** (11):
1. Login
2. `POST /api/gdpr/delete` with password body
3. Re-auth: `signInWithPassword` verifies
4. Rate limit: `createAuthRateLimiter(1, "1 h")`
5. `createDeletionRequest` + audit log
6. Sign out
7. Return login (5 days) → DeletionPendingBanner
8. Cancel deletion → `scheduled_deletion_at = null`
9. Second deletion request (2 months later)
10. 30-day purge: soft-delete profile, anonymize PII
11. Re-register same email → completely new user

**Test Flow** (22 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as renter | Dashboard loads |
| 2 | Navigate to Settings → Privacy | Privacy settings page |
| 3 | Click "Delete Account" | Deletion summary shown |
| 4 | Review data summary | Saved properties count, applications count, etc. |
| 5 | Enter password | Re-auth validation |
| 6 | Enter wrong password | Error: "Invalid password" |
| 7 | Enter correct password | Deletion request created |
| 8 | Check `profiles` | `scheduled_deletion_at` set (30 days out) |
| 9 | Verify redirect | `/account-deletion-confirm` |
| 10 | Verify signed out | No active session |
| 11 | Return 5 days later, login | DeletionPendingBanner visible |
| 12 | Click "Cancel Deletion" | Confirmation dialog |
| 13 | Confirm cancellation | `scheduled_deletion_at = null` |
| 14 | Verify data intact | All saved properties, applications present |
| 15 | Request deletion again (2 months later) | Deletion request created |
| 16 | Do NOT cancel | Wait for 30-day grace period |
| 17 | Verify purge job runs | Profile soft-deleted, PII anonymized |
| 18 | Check `profiles` | `deleted_at` set, PII fields cleared |
| 19 | Check `auth.users` | User record removed or anonymized |
| 20 | Try login with old credentials | "Invalid credentials" |
| 21 | Register with same email | Fresh account created |
| 22 | Verify zero data from old account | Empty dashboard, no history |

**Failure Modes**:
- Rate limit: second deletion request within 1 hour → 429
- Password wrong 3x → lockout
- Purge job failure → data retained (fail-safe)
- Re-registration email collision → should not occur after auth.users cleanup

**Key Findings**:
- **Gap**: GDPR requires deletion from ALL systems — Storage, Resend, PostHog, Sentry, Redis caches. Current scope is DB-only.
- **Gap**: Soft delete (`deleted_at`) is not GDPR-compliant erasure. Need hard purge cron job after grace period.
- **Gap**: Confirmation email should include one-click cancel link (no login required).
- Re-registration safe: all FKs use UUID, not email.

---

## CUJ 9: Infrastructure Failure Recovery

**Persona**: Michael O'Brien, 40, electrician. Low tech tolerance.

### 9A: Supabase Auth Down During Signup

**Narrative**: Michael tries to register. `signUp` returns 503. Friendly error message displayed. Form data preserved (React Hook Form state, no navigation). Retries after 2 minutes — succeeds.

**Auth Touchpoints** (5):
1. Fill registration form
2. `signUp()` → 503 from Supabase
3. `handleSupabaseError` → friendly toast
4. Form data preserved (no page navigation)
5. Retry → 200

**Test Flow** (8 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Fill registration form | All fields populated |
| 2 | Click Submit | `signUp()` called |
| 3 | Simulate 503 response | Error returned |
| 4 | Verify error handling | Friendly message: "Service temporarily unavailable" |
| 5 | Verify form state | All fields still populated |
| 6 | Verify no page navigation | Still on `/register` |
| 7 | Wait 2 minutes, retry | `signUp()` called again |
| 8 | Verify success | Account created, redirect to verify-email |

### 9B: OAuth Provider Timeout

**Narrative**: Google OAuth takes 30+ seconds. Browser times out. Returns to `/login?error=auth_callback_error`. Retries — succeeds.

**Auth Touchpoints** (4):
1. `signInWithOAuth("google")` → redirect
2. Google timeout → browser error
3. Return to `/login?error=auth_callback_error`
4. Retry → success

**Test Flow** (6 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Click "Sign in with Google" | OAuth redirect |
| 2 | Simulate timeout | Browser connection error |
| 3 | Navigate back to login | `/login?error=auth_callback_error` |
| 4 | Verify error message | "Authentication failed. Please try again." |
| 5 | Retry Google sign-in | OAuth redirect |
| 6 | Complete successfully | Account created/logged in |

### 9C: Corrupt JWT Mid-Session

**Narrative**: Browser extension corrupts session cookie. `getUser()` in middleware catches exception. Redirect to login with `redirectTo` preserving context. Re-auth restores session.

**Auth Touchpoints** (5):
1. Active session with corrupt JWT
2. `getUser()` in middleware throws (line 158-161)
3. Redirect to `/login?redirectTo={current_path}`
4. Re-auth → new valid session
5. `getSafeRedirectTarget` validates → redirect to original page

**Test Flow** (8 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Active session on `/dashboard/renter` | Page loads normally |
| 2 | Corrupt session cookie (DevTools) | Cookie modified |
| 3 | Navigate/refresh | Middleware `getUser()` fails |
| 4 | Verify redirect | `/login?redirectTo=/dashboard/renter` |
| 5 | Login with valid credentials | New session created |
| 6 | Verify redirect | → `/dashboard/renter` (from redirectTo) |
| 7 | Test malicious redirectTo: `/\evil.com` | Should be blocked |
| 8 | Test malicious redirectTo: `//evil.com` | Should be blocked |

**Key Findings**:
- **Gap**: No circuit breaker for Supabase calls — hammers failing service on retries.
- **BUG**: Middleware creates Supabase client and calls `getUser()` even for PUBLIC_ROUTES (after env var check). Public routes should not require auth calls.
- **Gap**: `console.error` in middleware should be structured Sentry logging.
- `redirectTo` validation covers `/` and `//` but **not** `\` (backslash escape → some browsers interpret as `//`).

---

## CUJ 10: Adversarial Security Scenario

**Persona**: Automated bot network + manual attacker.

### 10A: Brute Force Login

**Narrative**: 10 rapid wrong-password attempts against known email. Supabase rate limiting kicks in → 429. LoginForm detects lockout (line 73-87) → redirect to `/account-locked`. Audit log captures all attempts with IP/UA.

**Auth Touchpoints** (5):
1. 10 rapid `signInWithPassword` attempts
2. Supabase returns 429 after threshold
3. LoginForm detects lockout response
4. Redirect to `/account-locked`
5. `auth_audit_log`: 10 `login_failed` entries

**Test Flow** (8 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Submit wrong password (attempt 1) | Error: "Invalid credentials" |
| 2 | Submit wrong password (attempts 2-9) | Same error |
| 3 | Submit wrong password (attempt 10+) | 429 rate limited |
| 4 | Verify LoginForm detection | Lockout detected (line 73-87) |
| 5 | Verify redirect | → `/account-locked` |
| 6 | Check `auth_audit_log` | 10+ `login_failed` entries with IP/UA |
| 7 | Wait for lockout window | Timer expires |
| 8 | Login with correct password | Success |

### 10B: JWT Token Manipulation

**Narrative**: Attacker modifies JWT payload (e.g., `is_admin: true`). Invalid signature → `getUser()` rejects. Even with valid JWT, admin guard checks `profiles.is_admin` in DB (defense-in-depth).

**Auth Touchpoints** (3):
1. Modify JWT payload
2. Invalid signature → `getUser()` rejects
3. Even if bypassed, DB-level admin check blocks

**Test Flow** (6 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Capture valid JWT | Token obtained |
| 2 | Modify payload (`role: "admin"`) | JWT re-encoded |
| 3 | Send request with modified JWT | `getUser()` rejects (invalid signature) |
| 4 | Verify 401 response | Unauthorized |
| 5 | Test with valid JWT but non-admin user | JWT passes signature check |
| 6 | Access `/admin` route | Admin guard checks `profiles.is_admin` → 403 |

### 10C: CSRF on Sensitive Actions

**Narrative**: External page auto-posts to `/api/gdpr/delete`. Multiple layers block this: CSP `form-action 'self'`, `SameSite=Lax` cookies, password re-auth requirement.

**Auth Touchpoints** (3):
1. Cross-origin POST to `/api/gdpr/delete`
2. `SameSite=Lax` → no cookies sent
3. Even if cookies sent, password re-auth required

**Test Flow** (5 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Create external HTML page with auto-submit form | Form targets `/api/gdpr/delete` |
| 2 | Open external page while logged in | Form auto-submits |
| 3 | Verify `SameSite=Lax` blocks | No auth cookies sent cross-origin |
| 4 | Manually send POST without password | 400: password required |
| 5 | Verify no deletion request created | `profiles.scheduled_deletion_at` unchanged |

### 10D: Legitimate Lockout Recovery

**Narrative**: Real user types wrong password 5 times. Rate limited. Sees lockout page with timer. Waits → retries → succeeds.

**Auth Touchpoints** (4):
1. 5 wrong attempts
2. Rate limited → `/account-locked`
3. Wait for lockout window
4. Successful login

**Test Flow** (6 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Submit wrong password 5 times | Rate limited |
| 2 | Verify redirect | → `/account-locked` |
| 3 | Verify lockout page content | Timer, recovery instructions |
| 4 | Try login before timer expires | Still blocked |
| 5 | Wait for timer to expire | Lockout lifted |
| 6 | Login with correct password | Success → dashboard |

**Key Findings**:
- Defense-in-depth on admin: JWT claims + DB lookup (excellent)
- **Gap**: `redirectTo` validation doesn't cover backslash escape (`/\evil.com`)
- **Gap**: `auth_audit_log` RLS must be verified as insert-only (no UPDATE/DELETE)
- **Gap**: CSP nonce propagation to Next.js script injection needs verification
- Rate limiting has 3 layers: Supabase built-in, Upstash Redis, middleware — but not all endpoints use all layers

---

## Cross-Cutting Findings Summary

### Bugs Found

| # | Severity | Description | File |
|---|----------|-------------|------|
| 1 | **P0** | OAuth callback hardcodes "homebuyer" — renters get wrong role | `src/app/auth/callback/route.ts:32` |
| 2 | **P1** | Middleware calls `getUser()` on PUBLIC_ROUTES — unnecessary auth calls | `src/middleware.ts` |
| 3 | **P2** | `redirectTo` doesn't block backslash URLs (`/\evil.com`) | `src/components/auth/LoginForm.tsx` |

### Architecture Gaps

| # | Priority | Description | Affects CUJs |
|---|----------|-------------|--------------|
| 1 | **P0** | No in-context re-auth modal — full-page redirect destroys form state | 4, 7 |
| 2 | **P1** | No localStorage draft persistence for application forms | 3, 4, 7 |
| 3 | **P1** | No `onboarding_completed_at` — incomplete onboarding not detected | 2 |
| 4 | **P1** | `buyer_preferences` single row per user — multi-role preferences conflict | 6 |
| 5 | **P2** | No Realtime subscriptions on verification_level changes | 3 |
| 6 | **P2** | No idempotency keys on application submission | 4 |
| 7 | **P2** | Data sync relies on polling, not Realtime | 7 |
| 8 | **P2** | GDPR deletion doesn't cover Storage/PostHog/Sentry/Redis | 8 |
| 9 | **P2** | No circuit breaker for Supabase calls | 9 |
| 10 | **P3** | No password history enforcement | 5 |

### What Works Well

- Atomic role RPCs prevent partial state (assign, select, switch)
- Defense-in-depth: middleware + layout.tsx + API route handlers all verify auth independently
- Anti-enumeration on registration and password reset
- Immutable audit log captures full auth lifecycle
- CSP Level 3 with nonce generation
- JWT claims fast-path (feature-flagged) for performance
- GDPR 30-day grace period with cancel option

## Verification Plan

To validate these CUJs:

1. **Manual walkthrough**: Execute each CUJ's step-by-step test flow against the running app (`pnpm dev` from `britv3.0/`)
2. **Database verification**: After each flow, query `auth_audit_log`, `user_roles`, `profiles`, `provider_verifications` to confirm state
3. **Failure mode testing**: Use browser DevTools to simulate network failures, cookie corruption, session expiry
4. **Security testing**: Use curl/Postman for JWT manipulation, CSRF attempts, brute force simulation
5. **Cross-device testing**: Use multiple browser profiles or incognito windows for concurrent session scenarios
6. **Future**: Convert step-by-step flows into Playwright E2E tests when testing framework is installed

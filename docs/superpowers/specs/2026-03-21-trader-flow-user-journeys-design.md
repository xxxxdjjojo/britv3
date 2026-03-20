# Trader Registration + Recommendation User Flow: 13 Critical User Journeys (CUJs)

## Context

13 FAANG-level end-to-end user flow scenarios covering the full tradesperson lifecycle in Britestate — from registration and 3+3 verification through to marketplace discovery and being hired. Each scenario combines a realistic UK persona with testable acceptance criteria. Goal: find what works and what doesn't before implementation.

**Destination file:** `docs/superpowers/specs/2026-03-21-trader-flow-user-journeys-design.md`

## Infrastructure Summary

- **Auth**: Supabase Auth (JWT 1h + refresh 7d), OAuth (Google/Apple), atomic role RPCs
- **Middleware**: 5 guards (route protection, role guard, admin guard, subscription gate, URL role match)
- **Verification tiers**: basic (email) → standard (+phone) → enhanced (+ID) → professional (+insurance, +qualifications, +3 client refs, +3 peer refs)
- **Provider gates**: dashboard=basic, leads/quotes=standard, marketplace listing=enhanced, verified badge=professional
- **3+3 system**: 3 client references + 3 peer references required for "professional" verification level
- **Trust score**: 0-100 composite (ID 25pts, Insurance 25pts, Qualifications 20pts, Client refs 15pts, Peer refs 15pts)

## Critical Files

| File | Role |
|------|------|
| `src/middleware.ts` | Central auth enforcement, all 5 guards |
| `src/app/auth/callback/route.ts` | OAuth callback — **BUG: hardcodes "homebuyer" default** |
| `src/services/auth/auth-service.ts` | signUp, signIn, OAuth, password reset |
| `src/services/auth/role-service.ts` | Atomic RPCs (assign, select, switch) |
| `src/services/provider/provider-verification-service.ts` | 5-step verification flow, reference requests, badges |
| `src/app/(protected)/dashboard/provider/verification/page.tsx` | Trust Centre UI with stepper + trust score gauge |
| `src/app/(protected)/dashboard/provider/verification/credentials/page.tsx` | Credential upload (Gas Safe, NICEIC, CSCS, etc.) |
| `src/app/(protected)/dashboard/provider/verification/client-references/page.tsx` | Request 3 client references |
| `src/app/(protected)/dashboard/provider/verification/peer-references/page.tsx` | Request 3 peer references |
| `src/components/auth/RegisterForm.tsx` | Registration with `?professional=provider` param support |
| `src/components/auth/OnboardingFlow.tsx` | Role-specific onboarding wizard |
| `src/app/(auth)/register/onboarding/[role]/slug-mapping.ts` | `provider` slug → `service_provider` role mapping |
| `src/components/properties/detail/RecommendedTradespeople.tsx` | 3 verified tradespeople by postcode district |
| `src/components/providers/ProviderSearchPage.tsx` | Marketplace search + filters |
| `src/components/providers/QuoteModal.tsx` | Multi-step quote request |
| `src/services/provider/provider-quote-service.ts` | Quote builder, line items, PDF generation |
| `src/services/provider/provider-job-service.ts` | Job enquiry management |
| `src/services/provider/provider-payment-service.ts` | Stripe Connect integration |

---

## PART A: TRADER SIDE (Registration + 3+3 Verification)

---

## CUJ 1: Fresh Plumber Signup → Onboarding → Dashboard

**Persona**: Dave Morris, 35, sole trader plumber in Croydon. 8 years experience, Gas Safe registered. Found Britestate through a mate who's already on the platform. Wants more work beyond word-of-mouth. Comfortable with phones, less so with laptops.

**Narrative**: Visits Britestate homepage on his phone. Sees "List your trade" CTA. Clicks through to `/register?professional=provider`. RegisterForm detects `?professional=provider` param → sets `professionalRole` to `service_provider`. Fills in name, email, password. Creates account. Verifies email → callback routes to `/register/onboarding/provider` (slug-mapping resolves `provider` → `service_provider`). Completes provider onboarding (business name, trade category: plumbing, service area: CR0/CR2/CR7, brief bio). Lands on empty provider dashboard. Sees Trust Centre CTA showing 0/100 trust score.

**Auth Touchpoints** (10 total):
1. Anonymous browse on homepage (PUBLIC_ROUTES, no auth)
2. Click "List your trade" → `/register?professional=provider`
3. RegisterForm reads `?professional=provider` → `setProfessionalRole("service_provider")`
4. `signUp()` + `assign_role_atomic("service_provider")`
5. Email verification → `/auth/callback` → exchange code → find existing service_provider role
6. Redirect to `/register/onboarding/provider` (slug-mapping: `provider` → `service_provider`)
7. Onboarding wizard saves `service_provider_details` (business_name, services, service_postcodes, bio)
8. Dashboard access: middleware auth check + role guard matches `service_provider`
9. Dashboard layout loads KPI cards (all zero), Trust Centre widget
10. Audit log: signup, email_verified, role_assigned, onboarding_completed

**Test Flow** (22 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to homepage | Loads without auth |
| 2 | Click "List your trade" CTA | Navigate to `/register?professional=provider` |
| 3 | Verify RegisterForm state | `professionalRole` = `service_provider`, buy/rent toggle hidden or irrelevant |
| 4 | Fill: Dave, Morris, dave@example.com, StrongPass1 | No validation errors |
| 5 | Accept terms, click Continue | Loading → redirect to `/verify-email` |
| 6 | Check `auth.users` | User created |
| 7 | Check `user_roles` | Row: role="service_provider" |
| 8 | Click email verification link | Through `/auth/callback` |
| 9 | Verify redirect | `/register/onboarding/provider` (NOT homebuyer) |
| 10 | Step 1: Enter business name "Dave Morris Plumbing" | Saved |
| 11 | Step 2: Select trade category "Plumbing & Heating" | Saved |
| 12 | Step 3: Add service postcodes CR0, CR2, CR7 | `service_postcodes` array populated |
| 13 | Step 4: Write bio (50+ chars) | Saved |
| 14 | Click "Complete Setup" | → `/dashboard/provider` |
| 15 | Verify `service_provider_details` row | business_name, services, service_postcodes, bio all populated |
| 16 | Verify `slug` generated | `dave-morris-plumbing` or similar |
| 17 | Dashboard shows empty state | 0 leads, 0 jobs, £0 earnings |
| 18 | Trust Centre widget visible | 0/100 score, "Get Verified" CTA |
| 19 | Click "Get Verified" | → `/dashboard/provider/verification` |
| 20 | Verification stepper shows 5 steps all "not_started" | ✓ |
| 21 | Check `profiles.provider_verification_status` | "unverified" |
| 22 | Check `auth_audit_log` | All events present |

**Failure Modes**:
- `?professional=provider` param missing → RegisterForm shows buy/rent toggle, user must manually find provider path (**gap**: no fallback CTA)
- Weak password → inline error with PasswordStrengthMeter feedback
- Email already exists → same redirect to verify-email (anti-enumeration)
- `assign_role_atomic("service_provider")` fails → callback fallback assigns "homebuyer" (**BUG**: same OAuth callback issue)
- Onboarding incomplete + browser close → no `onboarding_completed_at` flag → user returns to dashboard with missing profile data (**gap**)
- Slug collision (another "Dave Morris Plumbing" exists) → service should append numeric suffix

**FAANG Quality Bar**:
- **Gap**: RegisterForm `intent` field (buy/rent) is irrelevant for providers but still part of the zod schema → provider flow must bypass or hide this field
- **Gap**: No `onboarding_completed_at` timestamp → incomplete onboarding not detected on return visit
- **BUG**: OAuth callback hardcodes "homebuyer" — if Dave uses Google signup with `?professional=provider`, intent is lost
- Slug generation in `provider-service.ts` handles collisions (confirmed in codebase)
- Mobile-first flow is critical — Dave will use his phone

---

## CUJ 2: Electrician OAuth Signup + Professional Toggle

**Persona**: Aisha Patel, 28, NICEIC-registered electrician in Leeds. Runs a 2-person operation with an apprentice. Tech-savvy, uses Google for everything. Wants to expand beyond Leeds LS postcodes.

**Narrative**: Finds Britestate via Google search "electrician jobs platform UK." Lands on `/services/tradespeople`. Sees "Join as a Professional" link → navigates to `/register?professional=provider`. Clicks "Sign in with Google" → OAuth flow. Callback assigns "homebuyer" (BUG — intent lost through OAuth). Confused by homebuyer dashboard. Navigates to `/register/role-select` → adds `service_provider` role. Switches active role. Completes provider onboarding. Lands on provider dashboard.

**Auth Touchpoints** (12):
1. Anonymous browse on `/services/tradespeople` (PUBLIC_ROUTES)
2. Click "Join as a Professional" → `/register?professional=provider`
3. Click "Sign in with Google" → `signInWithOAuth("google")`
4. Google OAuth redirect + consent
5. Callback: exchange code → **BUG: assigns "homebuyer"** (ignores `?professional=provider`)
6. Redirect to `/register/onboarding/homebuyer` (wrong!)
7. Confusion — navigates to role management
8. `/register/role-select` → `select_roles_atomic(["service_provider"])`
9. `switch_role_atomic("service_provider")`
10. `/register/onboarding/provider` → completes wizard
11. `/dashboard/provider` loads
12. Audit: oauth_login, role_assigned(homebuyer), role_added(service_provider), role_switched

**Test Flow** (18 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to `/services/tradespeople` | Public listing page loads |
| 2 | Click "Join as a Professional" | → `/register?professional=provider` |
| 3 | Verify `?professional=provider` in URL | ✓ |
| 4 | Click "Sign in with Google" | OAuth redirect to Google |
| 5 | Complete Google consent | Redirect to `/auth/callback` |
| 6 | Check `user_roles` | Row: role="homebuyer" (**BUG**) |
| 7 | Check redirect | `/register/onboarding/homebuyer` (**BUG** — should be provider) |
| 8 | Navigate to `/register/role-select` | Role selection page loads |
| 9 | Select "Service Provider" | `select_roles_atomic` called |
| 10 | Check `user_roles` | Two rows: homebuyer + service_provider |
| 11 | Verify active role switch | `active_role = "service_provider"` |
| 12 | Verify redirect | → `/register/onboarding/provider` |
| 13 | Complete provider onboarding | Business details saved |
| 14 | Click "Complete Setup" | → `/dashboard/provider` |
| 15 | Verify dashboard loads | Provider KPIs, not homebuyer |
| 16 | Navigate to `/dashboard/homebuyer` | Redirected back (URL guard) |
| 17 | Check `service_provider_details` | Row populated |
| 18 | Check `auth_audit_log` | oauth_login, role_assigned, role_added, role_switched |

**Failure Modes**:
- Google OAuth timeout → return to `/login?error=auth_callback_error`
- OAuth callback loses `?professional=provider` state (**confirmed BUG**)
- Role selection RPC fails → user stuck on homebuyer
- Onboarding wizard crashes → incomplete provider profile

**Key Findings**:
- **P0 BUG**: OAuth callback does not preserve professional role intent. Fix: store intent in cookie or `state` parameter before OAuth redirect, read it in callback.
- **Gap**: No "Join as Professional" CTA visible on `/services/tradespeople` listing page — user discovery path unclear.
- **Gap**: After OAuth assigns wrong role, there's no prompt saying "Did you mean to join as a professional?" — user must self-navigate to role-select.
- **Workaround works**: Role-select + switch recovers, but adds 3-4 extra steps = drop-off risk.

---

## CUJ 3: 3+3 Verification Happy Path (Full Pipeline)

**Persona**: Dave Morris (continues from CUJ 1). Now on provider dashboard. Ready to get verified. Has Gas Safe certificate on his phone (photo), public liability insurance PDF from broker, 3 past clients who'll vouch for him, and 3 plumber mates in the trade.

**Narrative**: Dashboard → Trust Centre (0/100). Starts Step 1: uploads driving licence photo. Status: "submitted" (pending admin). Admin approves within 24h → Step 1 "approved" (25pts). Step 2: uploads insurance PDF. Approved (50pts). Step 3: uploads Gas Safe certificate. Approved (70pts). Step 4: sends 3 client reference requests via email. All 3 clients submit references within a week. Status: "approved" (85pts). Step 5: sends 3 peer reference requests. All 3 peers submit. Status: "approved" (100pts). Trust score hits 100. "Professional Verified" badge earned. Profile now appears in marketplace search and RecommendedTradespeople widget.

**Auth Touchpoints** (8):
1. Login → `/dashboard/provider`
2. Navigate to `/dashboard/provider/verification`
3. Upload documents → `provider_documents` rows created (status: "pending")
4. Admin approval → status: "approved" (server-side)
5. Reference requests → `provider_references` rows created (status: "pending")
6. Referee clicks email link → submits reference (may or may not require auth)
7. Admin verifies references → status: "verified"
8. Badge auto-awarded → `profiles.provider_verification_status` = "verified"

**Test Flow** (35 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as Dave | → `/dashboard/provider` |
| 2 | Click Trust Centre | → `/dashboard/provider/verification` |
| 3 | Verify 5 steps shown, all "not_started" | Trust score: 0/100 |
| 4 | Click Step 1: Identity Verification | → `/dashboard/provider/verification/credentials` |
| 5 | Upload driving licence (JPEG, 2MB) | Upload succeeds |
| 6 | Check `provider_documents` | Row: document_type="identity_proof", status="pending" |
| 7 | Verify Step 1 status | "submitted" (orange badge) |
| 8 | Verify trust score | 12/100 (partial credit: 25 × 0.5) |
| 9 | **Admin action**: approve identity document | status → "approved" |
| 10 | Refresh verification page | Step 1: "approved" (green tick) |
| 11 | Verify trust score | 25/100 |
| 12 | Click Step 2: Insurance | Upload page loads |
| 13 | Upload public liability insurance (PDF, 500KB) | Upload succeeds |
| 14 | **Admin action**: approve insurance | status → "approved" |
| 15 | Refresh | Step 2: "approved", trust score: 50/100 |
| 16 | Click Step 3: Qualifications | Upload page loads |
| 17 | Upload Gas Safe certificate | Upload succeeds |
| 18 | **Admin action**: approve qualification | status → "approved" |
| 19 | Refresh | Step 3: "approved", trust score: 70/100 |
| 20 | Click Step 4: Client References | → `/dashboard/provider/verification/client-references` |
| 21 | Enter client 1: "Mrs Johnson", johnson@email.com | Reference request sent |
| 22 | Enter client 2: "Mr Ahmed", ahmed@email.com | Reference request sent |
| 23 | Enter client 3: "Ms Williams", williams@email.com | Reference request sent |
| 24 | Check `provider_references` | 3 rows: reference_type="client", status="pending" |
| 25 | **Client actions**: all 3 click email link, submit positive references | status → "submitted" |
| 26 | **Admin action**: verify all 3 client references | status → "verified" |
| 27 | Refresh | Step 4: "approved", trust score: 85/100 |
| 28 | Click Step 5: Peer References | → `/dashboard/provider/verification/peer-references` |
| 29 | Enter 3 peer tradespeople emails | 3 reference requests sent |
| 30 | **Peer actions**: all 3 submit endorsements | status → "submitted" → "verified" |
| 31 | Refresh | Step 5: "approved", trust score: 100/100 |
| 32 | Verify badge awarded | `profiles.provider_verification_status` = "verified" |
| 33 | Check `provider_badges` | "professional_verified" badge row |
| 34 | Search for Dave on `/services/tradespeople?q=plumber&location=CR0` | Dave appears in results |
| 35 | View property in CR0 → check RecommendedTradespeople widget | Dave appears as recommended |

**Failure Modes**:
- File too large (>10MB) → client-side validation error
- Wrong file type (e.g., .doc instead of PDF/JPEG) → type validation error
- Admin rejects document → status "rejected" with reason → user must re-upload
- Reference email bounces → no delivery notification to provider (**gap**)
- Referee submits blank/spam reference → admin must manually review quality
- Badge not auto-awarded after all 5 steps complete → need trigger/webhook (**gap**)

**FAANG Quality Bar**:
- **Gap**: No email delivery tracking — provider doesn't know if referee got the email
- **Gap**: No Realtime subscription on step status — must manually refresh to see admin approvals
- **Gap**: Badge award logic — is it automatic when all 5 steps reach "approved", or does admin manually trigger? Code shows `getProviderBadges` reads from table but unclear what writes to it.
- **Gap**: Trust score is computed client-side in `verification/page.tsx` (line 16-38) — not persisted. If marketplace search needs to filter by trust score, it must be stored server-side.
- Partial credit for "submitted" status (50% of step weight) is good UX — encourages patience.

---

## CUJ 4: Reference Request Friction — Referee Never Responds

**Persona**: Dave Morris (continues). Has requested 3 client references. Mrs Johnson and Mr Ahmed submitted. Ms Williams (client 3) — old phone number, changed email, never responds. Dave is stuck at 2/3 client references.

**Narrative**: Week 1: Dave sends all 3 requests. Week 2: 2 of 3 respond. Week 3: Ms Williams hasn't responded. Dave tries to resend — does the UI allow resending? Can he replace the non-responding referee with a different client? Does the system remind referees automatically?

**Auth Touchpoints** (5):
1. Login → verification page
2. Check reference status (2 verified, 1 pending)
3. Attempt to resend reference request
4. Attempt to cancel/replace a reference request
5. Audit: reference_resent or reference_replaced

**Test Flow** (16 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login → `/dashboard/provider/verification` | Trust score: 70/100 (ID + Insurance + Quals approved) |
| 2 | Click Step 4: Client References | Reference status page |
| 3 | Verify 3 references listed | 2 "verified", 1 "pending" |
| 4 | Check pending reference (Ms Williams) | Status: "pending", sent 14 days ago |
| 5 | Look for "Resend" button on pending reference | **Does it exist?** |
| 6 | If resend exists: click it | New email sent, timestamp updated |
| 7 | If resend doesn't exist: **gap** | User has no way to nudge referee |
| 8 | Look for "Cancel" or "Replace" option | **Does it exist?** |
| 9 | If replace exists: enter new client details | New reference request created, old one cancelled |
| 10 | If replace doesn't exist: **gap** | User stuck indefinitely |
| 11 | Wait 7 more days, no response | Total 21 days pending |
| 12 | Check for automatic reminder emails | **Does the system send reminders?** |
| 13 | If no reminders: **gap** | Single email is not enough |
| 14 | Eventually: Dave finds a 4th client, enters their details | Can he add a 4th reference? Or is it capped at 3? |
| 15 | 4th client responds | Now has 3/3 verified client refs |
| 16 | Step 4 status → "approved" | Trust score updates |

**Failure Modes**:
- No resend mechanism → provider has no recourse except contacting referee offline
- No replace mechanism → stuck reference blocks entire verification pipeline
- No automatic reminder emails → single email easily missed/spam-filtered
- Hard cap at 3 references → can't submit a 4th as backup
- Referee email in spam → provider has no visibility into email delivery

**Key Findings**:
- **P1 Gap**: `provider-verification-service.ts` has `sendReferenceRequest` but no `resendReferenceRequest` or `cancelReferenceRequest` functions
- **P1 Gap**: No automatic reminder system (no cron job, no scheduled emails)
- **P2 Gap**: No email delivery status tracking (opened, bounced, etc.)
- **Design decision needed**: Should providers be able to request >3 references and have the system accept the first 3 verified? This is more resilient than requiring exactly 3.
- **FAANG pattern**: Show "Last sent: 14 days ago" + "Resend" button + "Replace referee" option. Auto-remind at 3, 7, 14 days.

---

## CUJ 5: Document Rejection + Re-Upload Loop

**Persona**: Aisha Patel (from CUJ 2). Uploads her insurance certificate, but it expired last month. Admin rejects it with reason: "Insurance certificate expired. Please upload a current certificate."

**Narrative**: Aisha uploads expired insurance PDF. Admin reviews → rejects with reason. Aisha sees rejection on verification page. She contacts her insurance broker, gets updated certificate (takes 3 days). Returns, re-uploads. Admin approves. Trust score jumps.

**Auth Touchpoints** (6):
1. Login → verification → Step 2: Insurance
2. Upload expired certificate → `provider_documents` status: "pending"
3. Admin rejects → status: "rejected", rejection_reason populated
4. Aisha returns 3 days later → session may need refresh
5. Re-upload valid certificate → new `provider_documents` row or status reset
6. Admin approves → status: "approved"

**Test Flow** (18 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login → `/dashboard/provider/verification` | Verification stepper loads |
| 2 | Click Step 2: Insurance | Upload page |
| 3 | Upload expired-insurance.pdf (valid PDF, 400KB) | Upload succeeds, status: "pending" |
| 4 | Verify `provider_documents` | Row created, status: "pending" |
| 5 | Trust score | Partial credit (25 × 0.5 = 12.5 → 12pts for insurance) |
| 6 | **Admin action**: reject with reason "Certificate expired" | status → "rejected" |
| 7 | Refresh verification page | Step 2: "rejected" (red badge) |
| 8 | Verify rejection reason displayed | "Certificate expired" message visible |
| 9 | Verify trust score dropped | Back to pre-submission score |
| 10 | Check for email notification of rejection | **Was Aisha emailed?** |
| 11 | Return 3 days later | Session may need refresh token |
| 12 | Navigate to Step 2 | Rejection reason still visible |
| 13 | Click "Re-upload" or "Upload new document" | **Does this button exist?** |
| 14 | Upload valid-insurance-2026.pdf | Upload succeeds |
| 15 | Check `provider_documents` | New row or updated row? |
| 16 | Verify old rejected document handling | Archived? Deleted? Visible in history? |
| 17 | **Admin action**: approve | status → "approved" |
| 18 | Refresh | Step 2: "approved", trust score updated |

**Failure Modes**:
- No rejection reason shown → user doesn't know what to fix
- No email notification on rejection → user doesn't know to return
- No "re-upload" button after rejection → user can't proceed
- Old rejected document clutters the UI → need document history/versioning
- Admin rejects again (wrong document type this time) → multiple rejection loop

**Key Findings**:
- **P1 Gap**: Unclear if rejection triggers email notification to provider
- **P1 Gap**: Unclear if re-upload creates a new document row or updates existing one — affects UI flow
- **P2 Gap**: No document version history — provider can't see what was previously rejected and why
- **Gap**: `computeTrustScore` in verification page gives 0 points for "rejected" status (correct) but the step shows "rejected" without clear remediation instructions
- **FAANG pattern**: Rejection email with one-click link back to the specific upload step. Show rejection history. Allow re-upload in same step without navigating away.

---

## CUJ 6: Abandoned Verification — Returns 3 Weeks Later

**Persona**: Kevin O'Reilly, 52, general builder in Bristol. 30 years in the trade, distrustful of technology. His daughter set up the account. He completed Step 1 (ID) and Step 2 (insurance) then got busy with a kitchen extension job. Returns 3 weeks later to finish.

**Narrative**: Kevin returns after 3 weeks. Refresh token still valid (7-day default — **might be expired**). If expired, must re-login (forgot password likely). If valid, dashboard loads. Trust Centre shows 2/5 steps complete, 50/100 score. Kevin needs to remember where he left off. Starts Step 3 (qualifications) — uploads CSCS card. Sends reference requests. Confused by email-based reference flow. Calls daughter for help.

**Auth Touchpoints** (7):
1. Return visit after 3 weeks — check session validity
2. Refresh token expired (>7 days) → redirect to login
3. Forgot password (likely) → reset flow
4. Re-login → `/dashboard/provider`
5. Trust Centre shows progress (2/5 steps)
6. Resume verification from Step 3
7. Audit: login (or password_reset + login), document_uploaded, reference_requested

**Test Flow** (20 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Open Britestate after 3 weeks | Site loads |
| 2 | Check session state | Refresh token expired (>7 days default) |
| 3 | Verify redirect | → `/login` |
| 4 | Kevin forgot password | Click "Forgot password?" |
| 5 | Reset flow completes | New password set |
| 6 | Login with new password | → `/dashboard/provider` |
| 7 | Dashboard loads | KPI cards: 0 leads, 0 jobs (hasn't been in marketplace yet) |
| 8 | Trust Centre widget | 50/100 score, "Continue Verification" |
| 9 | Click Trust Centre | → `/dashboard/provider/verification` |
| 10 | Verify steps show correct state | Steps 1-2: "approved", Steps 3-5: "not_started" |
| 11 | **Key UX check**: is it obvious where Kevin left off? | Active step highlighted? Progress bar? |
| 12 | Click Step 3: Qualifications | Upload page |
| 13 | Upload CSCS card photo | Upload succeeds |
| 14 | **Admin action**: approve | ✓ |
| 15 | Click Step 4: Client References | Reference request page |
| 16 | Kevin sees email input fields | Confused — "I don't have my clients' emails" |
| 17 | Check for alternative reference methods | **Phone number? Link to share via WhatsApp?** |
| 18 | If email-only: **friction point** | Builder trades often don't have client emails |
| 19 | Kevin calls daughter for help | Eventually submits 3 emails |
| 20 | Check reference request emails sent | ✓ |

**Failure Modes**:
- Refresh token expired → login required (Kevin may not remember password)
- Password reset email goes to spam → Kevin stuck
- Verification progress lost → would be catastrophic (**verify it persists in DB**)
- No visual indicator of "resume here" → Kevin restarts from Step 1
- Email-only reference collection → excludes tradespeople whose clients don't use email

**Key Findings**:
- **P0 Gap**: Reference collection is email-only. Builders' clients are often older homeowners who communicate by phone/WhatsApp. Need alternative: shareable link (copy to clipboard / WhatsApp) + phone number (SMS link).
- **P1 Gap**: No "Continue where you left off" indicator — stepper shows all steps equally. Should highlight the first incomplete step.
- **P2**: Verification progress is stored in `provider_documents` and `provider_references` tables — survives session expiry (confirmed good).
- **Gap**: 3-week return means Kevin's profile has been sitting incomplete — no "nudge" email at 7 or 14 days (**gap**: no re-engagement emails for stalled verification).
- **FAANG pattern**: Email at 3, 7, 14 days: "You're 50% verified — complete your profile to start receiving leads." Deep link to the next incomplete step.

---

## CUJ 7: Stripe Connect Onboarding Failure Mid-Flow

**Persona**: Aisha Patel (from CUJ 2). Now fully verified (100/100 trust score). Wants to accept payments through the platform. Navigates to `/dashboard/provider/payments` → Stripe Connect onboarding.

**Narrative**: Aisha clicks "Set up payments." Redirected to Stripe Connect Express onboarding. Enters bank details — sort code wrong. Stripe rejects. Returns to Britestate with error. Tries again, enters correct details. Stripe identity verification asks for selfie + ID match. Upload fails (camera permission denied on phone). Gives up, tries later on laptop. Completes. Stripe account active. Can now receive payments.

**Auth Touchpoints** (8):
1. Login → `/dashboard/provider/payments`
2. Click "Set up payments" → redirect to Stripe Connect Express
3. Stripe session (external auth)
4. Bank details wrong → Stripe error → redirect back with error state
5. Retry → correct bank details
6. Stripe identity verification → camera permission denied
7. Return later on laptop → complete Stripe verification
8. Stripe webhook → `stripe_connect_accounts` row updated

**Test Flow** (16 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login → `/dashboard/provider/payments` | Payments page loads |
| 2 | Verify "Set up payments" CTA | Stripe Connect not yet configured |
| 3 | Click "Set up payments" | Redirect to Stripe Connect Express |
| 4 | Enter business details | Accepted |
| 5 | Enter wrong sort code | Stripe validation error |
| 6 | Fix sort code, resubmit | Bank details accepted |
| 7 | Stripe requests identity verification | Camera/selfie flow |
| 8 | Deny camera permission | Upload fails |
| 9 | Click "Skip for now" or close | **Does Stripe allow partial completion?** |
| 10 | Return to Britestate | Payments page shows "Setup incomplete" |
| 11 | Return on laptop later | Login → payments page |
| 12 | Click "Continue setup" | Resume Stripe onboarding |
| 13 | Complete identity verification | Stripe account active |
| 14 | Stripe webhook fires | `stripe_connect_accounts` updated |
| 15 | Payments page shows balance | £0.00 balance, account active |
| 16 | Verify can receive test payment | Stripe test mode transfer succeeds |

**Failure Modes**:
- Stripe redirect back loses session → re-auth required
- Stripe partial completion not resumable → must restart from scratch
- Webhook delivery failure → Britestate doesn't know account is active
- No "Continue setup" button on payments page → user can't resume

**Key Findings**:
- **P1 Gap**: Stripe Connect Express handles most of the UX, but error handling on return is critical. Does `/dashboard/provider/payments` check `stripe_connect_accounts` status on load?
- **P2 Gap**: Webhook retry policy — if Stripe webhook for `account.updated` fails, is there a polling fallback?
- Stripe Connect Express is a black box — can't control its UX. Focus on handling all return states (success, failure, incomplete).
- **FAANG pattern**: Show clear status on payments page: "Not started" / "Setup incomplete" / "Verification pending" / "Active". Include "Resume setup" button for incomplete states.

---

## CUJ 8: Multi-Role — Existing Homebuyer Adds Provider Role

**Persona**: Dave Morris (again). Has been using Britestate as a homebuyer for 2 months (searching for a house to flip). Decides to also list his plumbing services. Adds `service_provider` role without losing homebuyer data.

**Narrative**: Dave is on `/dashboard/homebuyer` with 5 saved properties and 2 viewings booked. Navigates to role management. Adds "Service Provider" role. `select_roles_atomic` adds role without removing homebuyer. Active role switches to `service_provider`. Completes provider onboarding. Can switch between homebuyer (5 saves, 2 viewings) and provider (empty dashboard) freely.

**Auth Touchpoints** (8):
1. Existing login, active_role = "homebuyer"
2. Role management → add `service_provider`
3. `select_roles_atomic(["service_provider"])` — adds, doesn't replace
4. Active role auto-switches to "service_provider"
5. `/register/onboarding/provider` loads
6. Complete onboarding → `/dashboard/provider`
7. Switch back to homebuyer → all data intact
8. Audit: role_added, role_switched, onboarding_completed

**Test Flow** (18 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as homebuyer | `/dashboard/homebuyer` with 5 saves, 2 viewings |
| 2 | Navigate to role management | Role management UI |
| 3 | Click "Add Service Provider" | Confirmation dialog |
| 4 | Confirm | `select_roles_atomic` called |
| 5 | Check `user_roles` | Two rows: homebuyer + service_provider |
| 6 | Verify active role | `active_role = "service_provider"` |
| 7 | Verify redirect | → `/register/onboarding/provider` |
| 8 | Complete provider onboarding | Business details saved |
| 9 | Click "Complete Setup" | → `/dashboard/provider` |
| 10 | Verify provider dashboard | Empty state, 0/100 trust score |
| 11 | Open role switcher | Both roles listed |
| 12 | Switch to homebuyer | `switch_role_atomic("homebuyer")` |
| 13 | Verify `/dashboard/homebuyer` | 5 saves, 2 viewings intact |
| 14 | Navigate to `/dashboard/provider` | Redirected (URL guard, active_role=homebuyer) |
| 15 | Switch to provider | Provider dashboard loads |
| 16 | Start verification | Step 1 available |
| 17 | Switch to homebuyer mid-verification | Homebuyer dashboard, verification progress preserved |
| 18 | Check `auth_audit_log` | role_added, role_switched events |

**Failure Modes**:
- `select_roles_atomic` fails → error toast, role not added
- Onboarding wizard shows homebuyer-specific steps → wrong wizard loaded
- Role switch doesn't update JWT claims fast enough → stale role in middleware check
- Provider dashboard shows homebuyer's saved properties → data leakage

**Key Findings**:
- Data segregation confirmed: `service_provider_details` is separate from `buyer_preferences`
- **Gap**: Role switcher may not be discoverable — is it in the header? Sidebar? Settings?
- **Gap**: What happens to the "Get Verified" nudge emails if Dave is active as homebuyer? Should provider nudges only send when provider is active role, or always?
- JWT role claim refresh timing — fast-path feature flag controls this.

---

## PART B: BUYER/LANDLORD SIDE (Discovery + Recommendation + Hire)

---

## CUJ 9: Property Detail → Recommended Tradespeople → View Profile

**Persona**: Sarah Jenkins, 41, homebuyer. Just had an offer accepted on a Victorian terrace in TW7 (Isleworth). Browsing the property detail page. Notices "Local Tradespeople" widget in the sidebar.

**Narrative**: Sarah is on the property detail page for 42 Woodlands Road, TW7 4LR. The `RecommendedTradespeople` component queries `service_provider_details` for verified providers whose `service_postcodes` contains "TW7". Shows 3 results: Dave Morris Plumbing (4.8★, 23 reviews), Spark Right Electrical (4.5★, 15 reviews), BuildRight Construction (New). Sarah clicks "View" on Dave → `/services/tradespeople/dave-morris-plumbing` (or `/tradespeople/dave-morris-plumbing`). Sees full profile: reviews tab, portfolio tab, services tab, quote request button.

**Auth Touchpoints** (4):
1. Property detail page (PUBLIC_ROUTES — no auth needed to view)
2. RecommendedTradespeople server component fetches from Supabase (server client, no user auth)
3. Click "View" → provider public profile (PUBLIC_ROUTES)
4. Click "Request Quote" → auth gate (basic minimum, may need standard)

**Test Flow** (18 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to property detail page (TW7 4LR) | Page loads without auth |
| 2 | Scroll to sidebar | "Local Tradespeople" section visible |
| 3 | Verify heading | "Verified professionals near this property" |
| 4 | Verify 3 providers shown | Cards with name, service, rating, review count |
| 5 | Verify only verified providers | All have `provider_verification_status = "verified"` |
| 6 | Verify postcode match | All serve TW7 area |
| 7 | Verify rating display | Stars + numeric rating (e.g., "4.8") |
| 8 | Verify "New" label for unrated | Provider with no reviews shows "New" |
| 9 | Click "View" on Dave Morris | Navigate to profile page |
| 10 | Verify profile URL | `/services/tradespeople/dave-morris-plumbing` or `/tradespeople/dave-morris-plumbing` |
| 11 | Verify profile hero | Business name, avatar, rating, verified badge |
| 12 | Verify tabs | Reviews, Portfolio, Services, About |
| 13 | Click Reviews tab | Paginated review list |
| 14 | Click Portfolio tab | Before/after image gallery |
| 15 | Click Services tab | Service list with pricing |
| 16 | Click "Request a Quote" | **Auth check**: if anonymous → redirect to login |
| 17 | If authenticated: QuoteModal opens | Multi-step quote form |
| 18 | Check `provider_analytics` | Profile view counted |

**Failure Modes**:
- No verified providers in TW7 → widget hidden (confirmed: `if (tradespeople.length === 0) return null`)
- Postcode mismatch — `service_postcodes` stores full postcodes vs district prefix → matching logic fragile
- Profile link goes to `/tradespeople/` but route is at `/services/[category]/[slug]` → **potential 404**
- Quote modal requires auth but user was browsing anonymously → context lost after login redirect

**Key Findings**:
- **P1 BUG**: `RecommendedTradespeople.tsx` line 152 links to `/tradespeople/${tp.slug}` but the actual route is `/services/[category]/[slug]` — this will 404. Should be `/services/tradespeople/${tp.slug}`.
- **P2 Gap**: Postcode matching uses `contains("service_postcodes", [district])` — this requires exact district match in the array. If provider stored "CR0 1AA" but query uses "CR0", no match. Needs consistent storage format.
- **Gap**: RecommendedTradespeople doesn't sort by rating — just returns first 3 from query. Should `ORDER BY average_rating DESC`.
- **FAANG pattern**: Widget should show relevance reason: "Plumber · Serves TW7 · 4.8★ from 23 reviews · Responds in <2 hours"

---

## CUJ 10: Marketplace Search → Filter → Compare → Request Quote

**Persona**: Marcus Thompson, 55, landlord with 3 BTL properties in SE15 (Peckham). Bathroom leak in Property #2. Needs a plumber urgently. Wants to compare options before committing.

**Narrative**: Marcus navigates to `/services/tradespeople`. Searches "plumber" near "SE15". Gets results filtered by distance and rating. Uses filters: "Emergency available", "Verified only". Sees 5 results. Clicks "Compare" on 3 of them → CompareBar appears. Opens compare view → side-by-side: rating, reviews, pricing, response time, services, badges. Selects Dave Morris. Clicks "Request Quote" → QuoteModal opens. Fills: bathroom leak, emergency, photos of damage. Quote request submitted.

**Auth Touchpoints** (6):
1. `/services/tradespeople` (PUBLIC_ROUTES — browse without auth)
2. Search + filter (no auth required for public search)
3. Compare feature (localStorage-based, no auth)
4. Click "Request Quote" → auth gate
5. If not logged in → redirect to `/login?redirectTo=/services/tradespeople/dave-morris-plumbing`
6. After login → QuoteModal → `provider_job_enquiries` row created

**Test Flow** (22 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to `/services/tradespeople` | Listing page loads |
| 2 | Enter "plumber" in search | Filter applied |
| 3 | Enter "SE15" in location | Postcode-based results |
| 4 | Apply "Verified only" filter | Unverified providers removed |
| 5 | Apply "Emergency available" filter | Results filtered |
| 6 | Verify result cards | Name, rating, reviews, services, verified badge |
| 7 | Click "Compare" on provider 1 | CompareBar appears at bottom |
| 8 | Click "Compare" on provider 2 | CompareBar: 2 items |
| 9 | Click "Compare" on provider 3 | CompareBar: 3 items |
| 10 | Click "Compare Now" on CompareBar | Navigate to `/compare` |
| 11 | Verify side-by-side comparison | 3 columns: rating, reviews, pricing, response time |
| 12 | Select preferred provider (Dave) | Highlight selection |
| 13 | Click "Request a Quote" | Auth check |
| 14 | If anonymous → login redirect | `/login?redirectTo=...` |
| 15 | Login as Marcus | Redirect back to provider profile |
| 16 | QuoteModal opens | Multi-step form |
| 17 | Step 1: Describe issue ("bathroom leak, emergency") | Text input |
| 18 | Step 2: Upload photos (3 images) | Upload succeeds |
| 19 | Step 3: Select urgency ("Emergency — today/tomorrow") | ✓ |
| 20 | Step 4: Review + submit | Quote request created |
| 21 | Check `provider_job_enquiries` or equivalent | Row created with Marcus's request |
| 22 | Dave's dashboard → `/jobs/leads` | New lead appears |

**Failure Modes**:
- "SE15" not recognized as valid postcode → search fails
- No plumbers in SE15 → empty results with unhelpful message
- Compare uses localStorage → lost on browser change/clear
- QuoteModal loses context after login redirect → user must re-enter details
- Photo upload fails on mobile (camera permission / file size)

**Key Findings**:
- **P1 Gap**: After login redirect, does the QuoteModal auto-open with preserved context? Or does user land on profile page and must click "Request Quote" again?
- **P2 Gap**: Compare feature uses localStorage — not synced across devices, lost on clear. Acceptable for MVP.
- **Gap**: Emergency urgency flag — does it trigger push notification to provider? Or just appears in leads inbox?
- **FAANG pattern**: "Last active: 2 hours ago" and "Average response time: 45 minutes" on provider cards help landlords assess responsiveness for urgent jobs.

---

## CUJ 11: Quote Received → Accept → Job Starts → Review Left

**Persona**: Sarah Jenkins (from CUJ 9). Requested a quote from Dave Morris for a full bathroom renovation. Dave responds with a detailed quote. Sarah accepts. Job completes. Sarah leaves a review.

**Narrative**: Dave receives lead in `/dashboard/provider/jobs/leads`. Opens it, creates quote via `/quotes/builder` (line items: labour, materials, VAT). Sends quote to Sarah. Sarah receives email notification. Opens quote link → views breakdown. Accepts quote. Job status: "active". Dave marks job as "in_progress", then "completed". Sarah receives "Job completed — leave a review" email. Navigates to review form. Leaves 5-star review with photos. Review appears on Dave's profile. Rating stats updated.

**Auth Touchpoints** (8):
1. Dave: login → `/dashboard/provider/jobs/leads`
2. Dave: create and send quote (authenticated provider action)
3. Sarah: email notification → click link → auth gate
4. Sarah: accept quote (authenticated action)
5. Dave: update job status (authenticated provider action)
6. Sarah: receive "leave review" email → click link → auth gate
7. Sarah: submit review (authenticated action)
8. Audit: quote_created, quote_sent, quote_accepted, job_status_changed, review_submitted

**Test Flow** (28 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Dave: login → `/dashboard/provider/jobs/leads` | New lead from Sarah visible |
| 2 | Dave: click lead | Lead detail page with Sarah's description + photos |
| 3 | Dave: click "Create Quote" | → `/dashboard/provider/quotes/builder` |
| 4 | Dave: add line items (labour: £1,200, materials: £800, VAT: £400) | Total: £2,400 |
| 5 | Dave: add notes ("Includes full tiling, fixtures, 2-week timeline") | ✓ |
| 6 | Dave: click "Send Quote" | Quote sent to Sarah |
| 7 | Check `provider_quotes` or equivalent | Row created, status: "sent" |
| 8 | Sarah: receives email "Quote received from Dave Morris Plumbing" | Email delivered |
| 9 | Sarah: clicks link in email | → quote view page (auth required) |
| 10 | Sarah: login/auth | Redirect to quote view |
| 11 | Sarah: views quote breakdown | Line items, total, notes, Dave's profile link |
| 12 | Sarah: clicks "Accept Quote" | Confirmation dialog |
| 13 | Sarah: confirms | Quote status → "accepted" |
| 14 | Dave: dashboard shows notification | "Sarah accepted your quote" |
| 15 | Dave: `/dashboard/provider/jobs/active` | Job listed as "accepted" |
| 16 | Dave: marks job as "in_progress" | Status updated |
| 17 | Dave: marks job as "completed" (after 2 weeks) | Status updated |
| 18 | Sarah: receives email "Job completed — leave a review" | Email delivered |
| 19 | Sarah: clicks link | → review form (auth required) |
| 20 | Sarah: selects 5 stars | Star rating widget |
| 21 | Sarah: writes review text (100+ chars) | ✓ |
| 22 | Sarah: uploads 2 before/after photos | Upload succeeds |
| 23 | Sarah: clicks "Submit Review" | Review created |
| 24 | Check `reviews` table | Row with rating=5, text, photos |
| 25 | Dave's profile → Reviews tab | Sarah's review visible |
| 26 | Check `provider_rating_stats` | average_rating recalculated |
| 27 | Dave: `/dashboard/provider/reviews` | New review with "Respond" button |
| 28 | Dave: writes response | Response visible on public profile under review |

**Failure Modes**:
- Quote email goes to spam → Sarah never sees it
- Quote link expired → must log in and find quote manually
- Accept button fails → quote stuck in "sent" status
- Job marked complete by provider but client disputes → no dispute mechanism (**gap**)
- Review bombing (fake reviews) → no review verification gate
- Review edit/deletion after submission → should be time-limited or admin-only

**Key Findings**:
- **P1 Gap**: No dispute mechanism if client disagrees with "completed" status
- **P2 Gap**: No payment integration in this flow — quote acceptance doesn't trigger deposit/payment. Is this intentional (off-platform payment) or missing?
- **Gap**: Review verification — should only users who hired the provider be able to review? Current `reviews` table may not enforce this.
- **FAANG pattern**: Escrow-style payment: 50% deposit on acceptance, 50% on completion. Stripe Connect handles the split.

---

## CUJ 12: No Verified Providers in Area — Empty State

**Persona**: Rural buyer in LL55 (Snowdonia), viewing a property. Sidebar widget queries for local tradespeople — none found.

**Narrative**: Property detail page loads. `RecommendedTradespeople` queries `service_provider_details` WHERE `service_postcodes` contains "LL55" AND `provider_verification_status = "verified"`. Returns 0 results. Component returns `null` — section hidden entirely. Buyer has no awareness that tradespeople exist on the platform. Navigates to `/services/tradespeople` manually, searches "LL55" — empty results page.

**Auth Touchpoints** (2):
1. Property detail page (PUBLIC_ROUTES)
2. Marketplace search (PUBLIC_ROUTES)

**Test Flow** (10 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to property in LL55 | Page loads |
| 2 | Check sidebar for "Local Tradespeople" | **Section hidden (not shown at all)** |
| 3 | Inspect page source / network tab | `RecommendedTradespeople` returned null |
| 4 | Navigate to `/services/tradespeople` | Listing page loads |
| 5 | Search "plumber" near "LL55" | Search executes |
| 6 | Verify results | Empty — 0 providers |
| 7 | Check empty state message | **What does it say?** |
| 8 | Check for "Expand search area" option | **Does it exist?** |
| 9 | Check for "Request a tradesperson" CTA | **Does it exist?** |
| 10 | Check for "Become the first tradesperson in LL55" CTA | **Does it exist?** |

**Failure Modes**:
- Widget completely hidden → buyer doesn't know the feature exists
- Empty search results with generic "No results" → unhelpful
- No radius expansion option → locked to exact postcode district

**Key Findings**:
- **P2 Gap**: `RecommendedTradespeople` returns `null` on empty — silently hiding the feature. Better: show skeleton with "No verified tradespeople in LL55 yet — be the first to join" CTA (targets providers) or "Expand your search to nearby areas" (targets buyers).
- **P2 Gap**: Search doesn't offer radius expansion. If no results in LL55, try LL54, LL56, or "within 20 miles."
- **FAANG pattern**: Two-sided marketplace cold start: show "Tradespeople wanted in LL55 — register now" to incentivize supply. Show "We're expanding here soon — get notified" to retain demand.

---

## CUJ 13: Unverified Provider in Search — Trust Signal Gap

**Persona**: First-time buyer in SE1 sees a mix of verified and unverified providers in search results. Confused about what "verified" means vs. the unverified listing.

**Narrative**: Buyer searches `/services/tradespeople?location=SE1`. Results show 8 providers: 5 verified (green badge), 3 basic/standard (no badge or grey badge). Buyer doesn't understand the difference. Clicks on an unverified provider — no reviews, no portfolio, no credentials shown. Clicks "Request Quote" — quote goes through, no warning. Buyer later has a bad experience. Wonders why platform let unverified providers accept jobs.

**Auth Touchpoints** (3):
1. Marketplace search (PUBLIC_ROUTES)
2. Provider profile (PUBLIC_ROUTES)
3. Quote request (auth gate)

**Test Flow** (16 steps):

| # | Action | Expected |
|---|--------|----------|
| 1 | Search `/services/tradespeople?location=SE1` | Results load |
| 2 | Verify mix of verified and unverified | Both types in results |
| 3 | Check verified provider card | Green "Verified" badge, trust score, review count |
| 4 | Check unverified provider card | **What badge/label is shown?** |
| 5 | Check sort order | **Are verified providers ranked higher?** |
| 6 | Check for filter "Verified only" | **Does it exist and is it prominent?** |
| 7 | Click unverified provider | Profile page loads |
| 8 | Check profile trust signals | No reviews, no portfolio, no credentials, no verified badge |
| 9 | Check for "This provider is not yet verified" warning | **Does it exist?** |
| 10 | Click "Request a Quote" | **Any warning about unverified status?** |
| 11 | If no warning: **gap** | Buyer may not understand the risk |
| 12 | Complete quote request | Quote submitted |
| 13 | Check provider's dashboard | Lead received (even though unverified) |
| 14 | Back to search → apply "Verified only" filter | Only verified results shown |
| 15 | Check filter UX | Is filter on by default? Toggle? Checkbox? |
| 16 | Check what "Verified" means — help text | **Is there a tooltip/explainer?** |

**Failure Modes**:
- No visual distinction between verified and unverified → trust signals invisible
- Unverified providers ranked equally → verified providers lose incentive to verify
- No warning when requesting quote from unverified provider → buyer unaware of risk
- No explanation of what "Verified" means → badge is meaningless to users

**Key Findings**:
- **P1 Gap**: Unclear if unverified providers can receive leads/quotes. If they can, there must be a clear warning: "This provider has not completed Britestate verification. Proceed at your own risk."
- **P1 Gap**: Search results should rank verified providers above unverified by default (boost verified in sort order).
- **P2 Gap**: "Verified" badge needs a tooltip: "This provider has verified their identity, insurance, qualifications, and has 6 references confirmed."
- **P2 Gap**: "Verified only" filter should be ON by default or at least prominently suggested.
- **FAANG pattern**: Airbnb "Superhost" model — verified badge is aspirational, gives ranking boost + "Verified" label in search cards. Unverified providers shown with softer styling and "Not yet verified" label.

---

## Cross-Cutting Findings Summary

### Bugs Found

| # | Severity | Description | File |
|---|----------|-------------|------|
| 1 | **P0** | OAuth callback hardcodes "homebuyer" — providers get wrong role via Google/Apple signup | `src/app/auth/callback/route.ts` |
| 2 | **P1** | RecommendedTradespeople links to `/tradespeople/${slug}` but route is `/services/[category]/[slug]` → 404 | `src/components/properties/detail/RecommendedTradespeople.tsx:152` |
| 3 | **P2** | RegisterForm `intent` (buy/rent) irrelevant for providers but still required by zod schema | `src/components/auth/RegisterForm.tsx:31` |

### Architecture Gaps

| # | Priority | Description | Affects CUJs |
|---|----------|-------------|--------------|
| 1 | **P0** | Reference collection is email-only — builders' clients often don't use email. Need shareable link + SMS option | 4, 6 |
| 2 | **P0** | OAuth flow loses `?professional=provider` intent — provider OAuth signup broken | 2 |
| 3 | **P1** | No resend/replace mechanism for non-responding referees | 4 |
| 4 | **P1** | No automatic reminder emails for stalled references (3, 7, 14 day cadence) | 4, 6 |
| 5 | **P1** | No re-engagement emails for stalled verification (7, 14 day nudge) | 6 |
| 6 | **P1** | No "Continue where you left off" indicator in verification stepper | 6 |
| 7 | **P1** | Badge award trigger unclear — auto or manual? | 3 |
| 8 | **P1** | Trust score computed client-side only — not persisted for marketplace search ranking | 3, 13 |
| 9 | **P1** | Unverified providers shown equally in search — no ranking boost for verified | 13 |
| 10 | **P1** | No warning when requesting quote from unverified provider | 13 |
| 11 | **P2** | No email delivery tracking for reference requests | 4 |
| 12 | **P2** | Document rejection doesn't clearly show re-upload flow | 5 |
| 13 | **P2** | No Realtime subscription on verification step status changes | 3, 5 |
| 14 | **P2** | RecommendedTradespeople silently hides on empty — no CTA for expansion | 12 |
| 15 | **P2** | Search doesn't offer radius expansion for empty results | 12 |
| 16 | **P2** | No dispute mechanism for completed jobs | 11 |
| 17 | **P2** | "Verified" badge has no tooltip/explainer | 13 |
| 18 | **P3** | Compare feature uses localStorage — not synced cross-device | 10 |
| 19 | **P3** | No `onboarding_completed_at` flag for providers | 1 |

### What Works Well

- Atomic role RPCs (`assign_role_atomic`, `select_roles_atomic`, `switch_role_atomic`) prevent partial state
- 5-step verification pipeline with clear ordering and weights
- Trust score partial credit for "submitted" status (50%) — reduces anxiety during admin review wait
- `RecommendedTradespeople` server component with zero client JS — fast, SEO-friendly
- Provider dashboard is comprehensive: 25 pages across 7 functional groups
- Slug generation handles collisions
- Data segregation between roles: `service_provider_details` separate from `buyer_preferences`
- Verification data persists in DB — survives session expiry and device switches
- `?professional=provider` param on RegisterForm — good intent-passing for email signup
- CompareBar + compare page — useful for multi-provider evaluation

### Design Decisions Needed

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Reference collection method | A) Email only B) Email + shareable link C) Email + link + SMS | **C** — tradespeople clients span all tech levels |
| 2 | Reference count flexibility | A) Exactly 3 required B) Request 3+, first 3 verified count C) Min 3, no max | **B** — resilient to non-responders |
| 3 | Verified-only search default | A) Show all B) Default to verified-only C) Boosted ranking for verified | **C** — don't hide supply, but incentivize verification |
| 4 | Unverified quote warning | A) No warning B) Soft warning (banner) C) Hard gate (block quotes) | **B** — inform, don't block |
| 5 | Badge award trigger | A) Auto when all 5 steps approved B) Admin manual award C) Auto + admin override | **C** — automation with safety valve |

---

## Verification Plan

To validate these CUJs against the running application:

1. **Manual walkthrough**: Execute each CUJ's test flow step-by-step against `pnpm dev` (from `britv3.0/`)
2. **Database verification**: After each flow, query `provider_documents`, `provider_references`, `provider_badges`, `provider_rating_stats`, `auth_audit_log`
3. **Bug confirmation**: Test the 3 bugs (OAuth role, RecommendedTradespeople link, RegisterForm intent field)
4. **Reference flow testing**: Send actual reference request emails (use test email addresses), verify delivery, test referee submission form
5. **Empty state testing**: Query with postcodes that have no providers (LL55, TD15, etc.)
6. **Trust signal audit**: Screenshot search results with mixed verified/unverified — evaluate visual distinction
7. **Cross-device**: Test verification progress persistence across logout/login, device switch
8. **Future**: Convert step-by-step flows into Playwright E2E tests

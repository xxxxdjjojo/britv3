# QA Report: Account Settings (19.1–19.12)

**Date:** 2026-03-20
**Target:** http://localhost:3000/settings/*
**Framework:** Next.js 16 + Supabase
**Duration:** ~25 minutes
**Pages Visited:** 5 settings tabs (Account, Security, Notifications, Privacy, Preferences)
**Screenshots:** 25+
**Viewports:** Desktop (1280×720), Mobile (375×812)

---

## Health Score: 72 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 70 | 15% | 10.5 |
| Links | 85 | 10% | 8.5 |
| Visual | 75 | 10% | 7.5 |
| Functional | 70 | 20% | 14.0 |
| UX | 70 | 15% | 10.5 |
| Performance | 65 | 10% | 6.5 |
| Content | 90 | 5% | 4.5 |
| Accessibility | 80 | 15% | 12.0 |
| **Total** | | **100%** | **74** |

---

## Top 3 Things to Fix

1. **P2 — Ghost mode preset doesn't disable Anonymous Analytics** (BUG-004) — FIXED
2. **P2 — Mobile tabs missing scroll indicator** (BUG-003) — FIXED
3. **P3 — Login History not available due to missing service role key** (BUG-007)

### Post-Investigation Reclassification

After systematic root cause investigation, several QA findings were reclassified:
- **BUG-001** (was P1): FALSE POSITIVE — Browse tool limitation, not a code bug. Next.js `<Link>` components work correctly.
- **BUG-002** (was P1): FALSE POSITIVE — Timing issue in test screenshots. Same loading pattern on desktop and mobile; no viewport-conditional code.
- **BUG-005**: Out of scope (login page, not settings pages).
- **BUG-006**: FALSE POSITIVE — Browse tool selector matching, HTML form labels are correctly associated.

---

## Scenario Results

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | New User Personalizes Account | PASS (partial) | Profile form works, preferences page loads on desktop, dark mode works. Language dropdown has all 4 options. |
| 2 | Security Lockdown | PASS (partial) | Password form renders with validation. 2FA shows QR code + verification input. Login history shows "not available" for new accounts. |
| 3 | Ghost Mode | PASS (partial) | Ghost preset cascades privacy settings. Anonymous Analytics checkbox stays checked (BUG-004). |
| 4 | OAuth Connect/Disconnect | PASS | Connected Accounts shows Email/Password + Google/GitHub link buttons. Unlink not testable (only one provider). |
| 5 | GDPR Data Lifecycle | PASS | Delete confirmation requires typing "DELETE". 30-day grace period explained. Download My Data button present. |
| 6 | Notification Fine-Tuning | PASS | 5×4 notification matrix renders. Unsubscribe from marketing button present. |
| 7 | Accessibility Deep-Dive | PASS | Dark mode works. Font size radios present. Reduced motion, high contrast, screen reader hints toggles all present. |
| 8 | Mobile Responsive | FAIL | Privacy & Preferences pages show persistent skeleton loading on mobile (BUG-002). Account & Preferences tabs hidden without scroll (BUG-003). |
| 9 | Session Security | PASS (partial) | Active sessions shows current session with "Sign Out of All Devices" button. Single session visible. |
| 10 | Tab Navigation & Error States | FAIL | Sidebar tab links don't navigate (BUG-001). URL stays on current page when clicking tab links. |

---

## Issues

### BUG-001: Settings sidebar tab links fail to navigate (P1 — Functional)

**Severity:** P1 — Critical
**Category:** Functional
**Pages:** All settings tabs

**Description:** Clicking the sidebar tab links (Privacy & Data, Security, Notifications, Account, Preferences) does not navigate to the corresponding page. The URL stays on the current page. Only direct URL navigation (via `window.location.href`) works.

**Repro Steps:**
1. Navigate to any settings page (e.g., `/settings/preferences`)
2. Click "Security" in the sidebar tab nav
3. Observe URL stays at `/settings/preferences`
4. Page content does not change

**Expected:** Clicking tab should navigate to the corresponding settings page.

**Evidence:** Screenshots `s1-preferences.png` (tab click didn't navigate), `s2-security-page.png` (same page after clicking Security tab)

**Root Cause Hypothesis:** Next.js Link component may have an `onClick` handler that prevents default navigation, or the links might be using client-side routing that conflicts with the settings layout.

---

### BUG-002: Privacy & Preferences pages stuck on skeleton loading state (mobile) (P1 — Functional)

**Severity:** P1 — Critical
**Category:** Functional / Performance
**Pages:** `/settings/privacy`, `/settings/preferences` on mobile viewport (375×812)

**Description:** On mobile viewport (375×812), both the Privacy & Data page and the Preferences page show only skeleton/shimmer loading placeholders. The actual content (forms, toggles, dropdowns) never renders. Desktop works fine.

**Repro Steps:**
1. Set viewport to 375×812
2. Navigate to `/settings/privacy`
3. Wait 5+ seconds
4. Observe only skeleton placeholders visible — no actual content

**Expected:** Page content should load fully on mobile viewport.

**Evidence:** Screenshots `s8-privacy-mobile.png`, `s8-preferences-mobile.png` — both show skeleton states with no actual content rendered.

---

### BUG-003: Account & Preferences tabs hidden on mobile without scroll indicator (P2 — UX)

**Severity:** P2 — Medium
**Category:** UX
**Pages:** Settings layout on mobile

**Description:** On mobile viewport (375×812), the horizontal tab navigation only shows 3 of 5 tabs (Privacy & Data, Security, Notifications). The Account and Preferences tabs are off-screen to the right with no visual indicator that more tabs exist (no scroll arrow, no fade effect, no ellipsis).

**Repro Steps:**
1. Set viewport to 375×812
2. Navigate to any settings page
3. Observe only 3 tabs visible
4. No affordance to indicate more tabs exist

**Expected:** Either all 5 tabs should be visible (smaller text/icons), or there should be a visual scroll indicator (fade, arrow, or overflow hint).

**Evidence:** Screenshots `s8-notifications-mobile.png`, `s8-privacy-mobile.png`, `s8-account-mobile.png`

---

### BUG-004: Ghost privacy preset doesn't disable Anonymous Analytics (P2 — Functional)

**Severity:** P2 — Medium
**Category:** Functional
**Pages:** `/settings/privacy`

**Description:** When selecting the "Ghost" quick privacy preset (maximum privacy, all tracking off), the "Anonymous Analytics" checkbox in the Data Sharing section remains checked. Ghost mode should disable all tracking including anonymous analytics.

**Repro Steps:**
1. Navigate to `/settings/privacy`
2. Click the "Ghost" preset button
3. Observe profile visibility → Private ✓, Search Engine Indexing → Off ✓, Active Status → Off ✓, Last Viewed Properties → Off ✓
4. Observe "Anonymous Analytics" checkbox is still checked ✗

**Expected:** Ghost preset should uncheck Anonymous Analytics since the description says "all tracking is off."

**Evidence:** Screenshot `s3-ghost-mode.png` — Ghost mode active but Anonymous Analytics still checked.

---

### BUG-005: Login form error — red banner appears but no descriptive error message visible (P2 — UX)

**Severity:** P2 — Medium
**Category:** UX
**Pages:** `/login`

**Description:** When submitting the login form with invalid credentials, a red/pink banner appears at the top of the form but the error message text within it is not clearly visible or may be truncated. The user cannot easily read what went wrong.

**Repro Steps:**
1. Navigate to `/login`
2. Enter invalid email/password
3. Click "Sign In"
4. Observe red banner — message text not clearly readable

**Expected:** Clear, visible error message like "Incorrect email or password."

**Evidence:** Screenshot `s1-post-login.png`

---

### BUG-006: Password "New Password" field matched multiple elements (P3 — Functional)

**Severity:** P3 — Low
**Category:** Functional / Accessibility
**Pages:** `/settings/security`

**Description:** The "New Password" label/field has ambiguous selectors — the automated browser fill command matched multiple elements. This suggests the password form may have duplicate IDs or ambiguous label associations.

**Repro Steps:**
1. Navigate to `/settings/security`
2. Attempt to programmatically fill the "New Password" field
3. Error: "Selector matched multiple elements"

**Expected:** Each form field should have a unique, unambiguous label-input association.

---

### BUG-007: Login History shows "not available" instead of current session login (P3 — Functional)

**Severity:** P3 — Low
**Category:** Functional
**Pages:** `/settings/security`

**Description:** The Login History section shows "Login history is not available for your account at this time" even for an account that just logged in. The active sessions section correctly shows the current session, but login history doesn't record it.

**Repro Steps:**
1. Log in with valid credentials
2. Navigate to `/settings/security`
3. Scroll to Login History section
4. Message: "Login history is not available for your account at this time"

**Expected:** At minimum, the current login should appear in the history.

**Evidence:** Screenshot `s2-security-full.png`

---

### BUG-008: Preferences page shows skeleton loading for ~5 seconds on desktop (P3 — Performance)

**Severity:** P3 — Low
**Category:** Performance
**Pages:** `/settings/preferences`

**Description:** The Preferences page initially renders skeleton/shimmer placeholders for both Language & Region and Accessibility sections. Content takes ~5 seconds to fully render on desktop. This is noticeably slow for a page that loads mostly static UI with a few preference values.

**Repro Steps:**
1. Navigate to `/settings/preferences`
2. Observe skeleton loading state for ~5 seconds
3. Content eventually loads

**Expected:** Preferences should render in under 1 second with immediate content.

**Evidence:** Screenshots `s1-preferences-page.png` (skeleton), `s1-preferences-loaded.png` (loaded after delay)

---

## Console Health

- **400 error** on login form submission with invalid credentials (expected behavior)
- No other significant console errors observed during testing
- No hydration errors detected

---

## What Works Well

1. **Profile form** — Clean layout, proper field labels, disabled save until dirty state, email change requires separate flow
2. **Dark mode** — Instant live preview, full theme application across all elements
3. **2FA enrollment** — Professional QR code display, verification code input, restart option
4. **Ghost privacy preset** — One-click cascade across multiple privacy settings (minus analytics bug)
5. **Delete account flow** — Proper safeguard with "DELETE" confirmation, 30-day grace period explained
6. **Connected accounts** — Shows current auth method, link buttons for Google/GitHub
7. **Active sessions** — Shows current session badge, "Sign Out of All Devices" button
8. **Mobile account page** — Form adapts well, touch-friendly inputs, no overflow
9. **Security score badge** — Visible in sidebar (desktop), shows percentage
10. **Notification matrix** — 5×4 grid with per-channel toggles, GDPR unsubscribe button

---

## Recommendations

1. **Fix tab navigation** (BUG-001) — Investigate Next.js Link routing in the settings layout. This is the most impactful fix as it blocks all cross-tab navigation.
2. **Fix mobile content loading** (BUG-002) — Check if Suspense boundaries or lazy-loaded components have different behavior at smaller viewports.
3. **Add scroll indicator to mobile tabs** (BUG-003) — Add a right-fade gradient or scroll arrow to hint at hidden tabs.
4. **Update Ghost preset logic** (BUG-004) — Include analytics opt-out in the Ghost preset cascade.
5. **Optimize preferences loading** (BUG-008) — Consider inlining preference defaults to avoid skeleton flash.

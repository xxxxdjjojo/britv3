# QA Report — Agent Dashboard
**URL:** http://localhost:3000/dashboard/agent
**Date:** 2026-03-15
**Duration:** ~45 minutes
**Tester:** Claude (automated QA via gstack/browse)
**Framework:** Next.js 16 (App Router)
**Mode:** Full
**Scope:** `/dashboard/agent` and all sub-routes

---

## Summary

| Metric | Value |
|--------|-------|
| Health Score | **64 / 100** |
| Pages Visited | 6 (Overview, Listings, Leads, Viewings, Revenue, Team) |
| Pages Timeout | 2 (Revenue, Team) — >15s each |
| Issues Found | 8 |
| Critical | 2 |
| High | 2 |
| Medium | 2 |
| Low | 2 |
| Screenshots | 7 |

---

## Health Score Breakdown

| Category | Score | Weight | Contribution |
|----------|-------|--------|--------------|
| Console | 40 | 15% | 6.0 |
| Links | 85 | 10% | 8.5 |
| Visual | 90 | 10% | 9.0 |
| Functional | 45 | 20% | 9.0 |
| UX | 77 | 15% | 11.6 |
| Performance | 55 | 10% | 5.5 |
| Content | 50 | 5% | 2.5 |
| Accessibility | 80 | 15% | 12.0 |
| **Total** | | | **64.1** |

---

## Top 3 Things to Fix

1. **Mock data shipped as real data** (Leads + Revenue) — Both pages display hardcoded fictional data to all users. A real agent sees someone else's pipeline and commission history. Data integrity failure, not just UX.
2. **Navigation timeouts on Revenue and Team** — Both pages take >15s to respond, crashing the browser session. Unacceptable for any production page.
3. **"Add Listing" button is a dead link** — The primary CTA on the Listings page loops back to the same URL. Agents cannot create listings via the dashboard.

---

## Setup Note

No test agent account existed. One was created via direct SQL insertion into `auth.users`, `auth.identities`, `public.profiles`, and `public.user_roles`:

- **Email:** `agent.test@britestate.com`
- **Password:** `TestAgent123!`
- **Role:** `agent`

The SQL creation required fixing three issues before auth worked: missing `auth.identities` row, NULL `email_change` column, and missing `user_roles` entry.

---

## Issues

---

### ISSUE-001 — Hardcoded mock data on Leads page
**Severity:** Critical
**Category:** Content / Functional
**URL:** `/dashboard/agent/leads`

#### Description
The Leads page displays 5 hardcoded fictional leads with realistic-looking personal data (names, email addresses, budgets, property interests, stages). KPI cards also show static values unrelated to the actual logged-in user's data.

#### Evidence
```
Total Leads: 5  (+3 this week)
New Enquiries: 2   Viewings Booked: 1   Offers Pending: 1

Leads shown:
- Oliver & Emma Williams | williams@email.com | £1.2M–£1.5M | Kensington | Viewing Booked
- Dr. Priya Sharma | sharma@email.com | £450K–£500K | Canary Wharf | Qualified
- James & Sophie Clark | clark@email.com | £600K–£700K | Guildford | New Enquiry
- Marcus Johnson | johnson@email.com | £3M–£4M | South Bank | Offer Pending
- Lisa & Tom Anderson | anderson@email.com | £2M–£2.5M | Richmond | New Enquiry
```

Our test account has zero real leads. All of the above is static const data in the component.

**Screenshot:** `screenshots/agent-leads.png`

#### Repro
1. Log in as any estate agent (including a brand-new account)
2. Navigate to `/dashboard/agent/leads`
3. Observe: 5 leads with realistic personal information are shown regardless of actual data

#### Impact
Every agent sees the same fictional pipeline. The page is non-functional for real use.

---

### ISSUE-002 — Hardcoded mock data on Revenue page
**Severity:** Critical
**Category:** Content / Functional
**URL:** `/dashboard/agent/revenue`

#### Description
The Revenue page displays entirely fabricated financial data: commission totals, monthly performance figures, and a list of recent completed transactions with specific property addresses and sale prices.

#### Evidence
```
Total Revenue (6mo): £142,350  (+22.4% vs prior period)
Sales Completed: 15   Avg Commission: £9,490   Pipeline Value: £4.45M

Monthly bar chart: Oct £18,500 / Nov £24,200 / Dec £12,750 / Jan £35,600 / Feb £28,900 / Mar £22,400

Recent Commissions:
- 2 Bed Maisonette, Clapham — Sold £575,000 → £8,625 (Paid)
- 3 Bed End Terrace, Lewisham — Sold £510,000 → £7,650 (Pending)
- 4 Bed Detached, Epsom — Sold £825,000 → £12,375 (Paid)
- 2 Bed Flat, Battersea — Sold £465,000 → £6,975 (Paid)
```

Our test account has no transactions. All figures are static.

**Screenshot:** `screenshots/agent-revenue.png`

#### Repro
1. Log in as any estate agent
2. Navigate to `/dashboard/agent/revenue`
3. Observe: Six months of commission history and recent sales are shown despite having no real data

---

### ISSUE-003 — "Add Listing" button links to the same page
**Severity:** High
**Category:** Functional
**URL:** `/dashboard/agent/listings`

#### Description
The primary CTA button on the Listings page ("Add Listing") resolves to `/dashboard/agent/listings` — the current page. Clicking it does nothing.

#### Evidence
```js
// Confirmed via JS:
Array.from(document.querySelectorAll('a'))
  .filter(a => a.textContent.includes('List') || a.textContent.includes('Add'))
// Result: both "Add Listing" and "Listings" nav link point to the same URL
// http://localhost:3000/dashboard/agent/listings
```

The expected destination would be `/dashboard/agent/listings/new` or a create listing modal.

**Screenshot:** `screenshots/agent-listings.png`

#### Repro
1. Navigate to `/dashboard/agent/listings`
2. Click "Add Listing"
3. Page does not change — URL stays the same, no form appears

---

### ISSUE-004 — Revenue and Team pages timeout (>15s)
**Severity:** High
**Category:** Performance
**URLs:** `/dashboard/agent/revenue`, `/dashboard/agent/team`

#### Description
Both the Revenue and Team pages consistently exceed a 15-second response threshold, causing browser session crashes in automated testing. On the Revenue page, the sidebar showed "Loading..." for an extended period before content appeared.

#### Evidence
```
goto: Timeout 15000ms exceeded.  (Revenue page — first attempt)
goto: Timeout 15000ms exceeded.  (Team page — repeated attempts)
```

Both pages caused the headless browser process to crash and required a full session restart before further testing was possible.

#### Repro
1. Log in as an estate agent
2. Navigate to `/dashboard/agent/revenue` or `/dashboard/agent/team`
3. Observe: Page takes >15 seconds to respond (or times out entirely)

#### Likely Cause
These pages likely fire expensive database queries or many sequential API calls on mount, with no loading skeleton or streaming while data is fetched.

---

### ISSUE-005 — Base UI nativeButton accessibility errors (repeated)
**Severity:** Medium
**Category:** Accessibility / Console
**URLs:** All agent dashboard pages

#### Description
Every page load triggers repeated console errors from Base UI about components acting as buttons without using a native `<button>` element. This is flagged in `AgentDashboardHome` and `Header` components.

#### Evidence
```
[error] Base UI: A component that acts as a button expected a native <button>
because the `nativeButton` prop is true. Rendering a non-<button> removes native
button semantics, which can impact forms and accessibility.
  at Button (src_76a27849._.js:168:421)
  at AgentDashboardHome (src_components_9aefb04a._.js:382:438)
```

This error appears 2–4 times per page load.

#### Impact
Keyboard navigation and screen reader behaviour for these buttons may be broken. Affects WCAG 2.1 compliance.

---

### ISSUE-006 — Invalid HTML nesting on Revenue page
**Severity:** Medium
**Category:** Visual / Console
**URL:** `/dashboard/agent/revenue`

#### Description
The Revenue page triggers two React hydration/HTML nesting warnings indicating block-level elements are nested inside `<p>` tags.

#### Evidence
```
[2026-03-15T15:21:55.793Z] [error] In HTML, %s cannot be a child of <%s>.
[2026-03-15T15:21:55.794Z] [error] <%s> cannot contain a nested %s.
```

These cause React to abandon server-rendered markup and re-render from scratch, which can cause layout flicker and defeats SSR.

---

### ISSUE-007 — Login page renders for authenticated users
**Severity:** Low
**Category:** UX
**URL:** `/login`

#### Description
When an authenticated user navigates to `/login`, the page renders the login form rather than redirecting to the dashboard. The `auth/v1/user` endpoint returns 200 (user is authenticated), but the middleware/page does not detect this.

#### Evidence
- Network showed `GET /auth/v1/user → 200` while the login page was rendered
- User had to manually navigate to `/dashboard/agent` to access the dashboard

---

### ISSUE-008 — Missing scroll-behavior data attribute on `<html>`
**Severity:** Low
**Category:** UX / Console
**URLs:** All pages

#### Description
Next.js warns that `scroll-behavior: smooth` is set on the `<html>` element without the recommended `data-scroll-behavior="smooth"` attribute, causing unintended smooth scrolling during client-side route transitions.

#### Evidence
```
[warning] Detected `scroll-behavior: smooth` on the `<html>` element.
To disable smooth scrolling during route transitions, add
`data-scroll-behavior="smooth"` to your <html> element.
```

**Fix:** Add `data-scroll-behavior="smooth"` to the `<html>` tag in the root layout.

---

## Page Coverage

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Overview | `/dashboard/agent` | ✅ Loads | All KPIs show 0 correctly for new user |
| Listings | `/dashboard/agent/listings` | ⚠️ Partial | Empty state correct; "Add Listing" CTA broken |
| Leads | `/dashboard/agent/leads` | ❌ Mock data | 5 hardcoded fictional leads shown to all users |
| Viewings | `/dashboard/agent/viewings` | ✅ Loads | Calendar renders for March 2026; no mock issues |
| Revenue | `/dashboard/agent/revenue` | ❌ Mock + timeout | Hardcoded financials, >15s first-load |
| Team | `/dashboard/agent/team` | ❌ Timeout | Consistent >15s timeout; could not load |
| Inbox | `/dashboard/agent/inbox` | ⚠️ Not tested | Session lost due to browser crash |
| Notifications | `/dashboard/agent/notifications` | ⚠️ Not tested | Not reached |
| Profile | `/dashboard/agent/profile` | ⚠️ Not tested | Not reached |

---

## Console Health

Unique error types observed:
1. `500` on auth token endpoint (pre-fix, during setup) — 2 occurrences
2. Base UI `nativeButton` — 6+ occurrences across pages
3. HTML nesting invalid — 2 occurrences (Revenue only)
4. `scroll-behavior: smooth` warning — all pages

**Console score: 40** (4–10 meaningful errors per session)

---

## Positive Observations

- **Overview KPIs**: Correctly show 0 for a new user — real data binding works on the summary page.
- **Empty states**: Listings shows a clear, actionable empty state ("No active listings yet. Click 'Add Listing' to publish your first property.") — good UX even if the CTA is broken.
- **Viewings calendar**: Renders the correct month (March 2026) and is visually functional.
- **Authentication**: Login flow works end-to-end once user account is fully set up.
- **Sidebar navigation**: Collapses/expands correctly, displays user initials.

---

## Test Account

| Field | Value |
|-------|-------|
| Email | `agent.test@britestate.com` |
| Password | `TestAgent123!` |
| Role | `agent` |
| User ID | `b54bd0f3-8165-47a3-8bb2-e94703633a04` |

---

*Generated by Claude Code QA — 2026-03-15*

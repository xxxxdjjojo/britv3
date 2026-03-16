# QA Report — Britestate Marketplace
Date: 2026-03-15
Pages tested: 11
Framework: Next.js (App Router, Turbopack)
Duration: ~10 minutes
Screenshots: 4

## Summary
Health score: **38/100**

| Category | Score |
|----------|-------|
| Console | 70/100 |
| Links | 40/100 |
| Functional | 0/100 |
| Visual | 85/100 |
| UX | 25/100 |
| Performance | 70/100 |
| Content | 60/100 |
| Accessibility | 70/100 |

**Weighted score:**
- Console (15%): 70 × 0.15 = 10.5
- Links (10%): 40 × 0.10 = 4.0
- Functional (20%): 0 × 0.20 = 0
- Visual (10%): 85 × 0.10 = 8.5
- UX (15%): 25 × 0.15 = 3.75
- Performance (10%): 70 × 0.10 = 7.0
- Content (5%): 60 × 0.05 = 3.0
- Accessibility (15%): 70 × 0.15 = 10.5
**Total: 47.25/100** → rounded **47/100**

---

## Issues Found

### ISSUE-001: All marketplace sub-pages redirect unauthenticated users to login
**Severity:** Critical
**Page:** `/services/tradespeople`, `/agents`, `/mortgage-brokers`, `/conveyancers`, `/surveyors`, `/architects`, `/architects/test-slug`, `/services/tradespeople/plumbers/london`
**Description:** 9 out of 11 pages under test are public discovery/search pages but are not listed in `PUBLIC_ROUTES` in `src/lib/constants.ts`. The middleware checks all routes against `PUBLIC_ROUTES` and redirects unauthenticated visitors to `/login` with a `redirectTo` param. These pages return HTTP 200 but render the login form instead of their intended content. The only marketplace pages that load correctly are `/marketplace` (explicitly listed in `PUBLIC_ROUTES`) and `/post-a-job` (which lives in `(main)` but is also being redirected — see ISSUE-002).
**Root cause:** `src/lib/constants.ts` lines 189–203 — `PUBLIC_ROUTES` array is missing the service discovery routes:
- `/services` (and all sub-paths)
- `/agents`
- `/mortgage-brokers`
- `/conveyancers`
- `/surveyors`
- `/architects`
- `/post-a-job`
**Evidence:** `services-tradespeople-login-redirect.png`
**Repro:**
1. Open a private/incognito browser window (no Britestate session)
2. Navigate to `http://localhost:3000/services/tradespeople`
3. Observe: login form is rendered instead of the tradesperson search page

---

### ISSUE-002: `/post-a-job` silently redirects to login instead of showing inline sign-in prompt
**Severity:** High
**Page:** `/post-a-job`
**Description:** The page spec says unauthenticated users should see a "sign-in prompt" (not the form). Instead, the middleware silently redirects the entire page to the login route. The user has no context that they were trying to post a job — the login page appears with no explanation. The `redirectTo=/post-a-job` query param is set, so post-login redirect works, but the UX is jarring with no sign-in prompt in-situ.
**Note:** This is a consequence of ISSUE-001 — once `/post-a-job` is added to `PUBLIC_ROUTES` and the page renders, it will need to conditionally show a sign-in prompt inside the page rather than redirecting. The page file exists at `src/app/(main)/post-a-job/page.tsx`.
**Evidence:** `post-a-job-login-redirect.png`
**Repro:**
1. In private/incognito, navigate to `http://localhost:3000/post-a-job`
2. Observe: full redirect to login page, no context about posting a job

---

### ISSUE-003: `/architects/test-slug` does not show a 404 — renders login redirect instead
**Severity:** High
**Page:** `/architects/test-slug`
**Description:** A non-existent architect profile slug should render Next.js `not-found.tsx` (HTTP 404). Instead, because `/architects` is not in `PUBLIC_ROUTES`, the middleware redirects to login before Next.js even gets a chance to return 404. This masks 404 handling entirely for unauthenticated users on any missing service provider profile.
**Evidence:** Page returns HTTP 200 and renders login form.
**Repro:**
1. In private/incognito, navigate to `http://localhost:3000/architects/test-slug`
2. Expected: 404 Not Found page
3. Actual: HTTP 200 login form

---

### ISSUE-004: Three marketplace category links map to `?category=other` losing specificity
**Severity:** Medium
**Page:** `/marketplace`
**Description:** The category grid shows distinct tiles for "Plasterers", "Painters", and "Carpenters", but all three link to `/services/tradespeople?category=other`. A user clicking "Plasterers" and then "Painters" would land on the same URL. When the tradespeople page is fixed (ISSUE-001), both tiles will show the same result set, breaking the UX promise of the category grid.
**Evidence:** Link inspection on `/marketplace`:
- `PlasterersVerified professionals → ...?category=other`
- `PaintersVerified professionals → ...?category=other`
- `CarpentersVerified professionals → ...?category=other`
**Repro:** On `/marketplace`, inspect the href of the Plasterers, Painters, or Carpenters card — all resolve to the same URL with `?category=other`.

---

### ISSUE-005: Recurring Base UI button accessibility console errors on every page
**Severity:** Medium
**Page:** All pages (originates in `Header` component)
**Description:** Every page load emits 2 identical console errors:
```
Base UI: A component that acts as a button expected a native <button> because
the `nativeButton` prop is true. Rendering a non-<button> removes native button
semantics, which can impact forms and accessibility.
```
The errors originate from the `Header` component (`src_f7b96f3f._.js`). Two `Button` elements in the header are rendered with a non-`<button>` element despite `nativeButton={true}`. This affects accessibility (screen readers, keyboard navigation) and produces console noise on every page.
**Evidence:** Observed on `/marketplace` and all pages tested.
**Repro:**
1. Navigate to any page
2. Open browser DevTools console
3. Observe 2 Base UI errors referencing the Header component

---

### ISSUE-006: `Builders` category maps to `?category=handyman` — label/value mismatch
**Severity:** Low
**Page:** `/marketplace`
**Description:** The "Builders" category tile links to `/services/tradespeople?category=handyman`. A builder and a handyman are distinct trade categories. This may cause confusing search results when the tradespeople page is functional.
**Evidence:** `BuildersVerified professionals → http://localhost:3000/services/tradespeople?category=handyman`

---

## Top 3 to Fix

1. **ISSUE-001 (Critical): Add missing service discovery routes to `PUBLIC_ROUTES`**
   Add `/services`, `/agents`, `/mortgage-brokers`, `/conveyancers`, `/surveyors`, `/architects`, `/post-a-job` to the `PUBLIC_ROUTES` array in `src/lib/constants.ts`. This single fix will unblock all 9 broken pages.

2. **ISSUE-002 (High): Implement in-page sign-in prompt on `/post-a-job` for unauthenticated users**
   Once `/post-a-job` is public, the page component should render a contextual "Sign in to post a job" UI panel rather than expecting the middleware to handle gating. This preserves UX context.

3. **ISSUE-005 (Medium): Fix Base UI `nativeButton` prop violations in Header**
   Audit the two `Button` components in the `Header` that are causing console errors — either set `nativeButton={false}` or replace the render element with a native `<button>`. This affects accessibility on every page.

---

## Pages Visited

- [x] `/marketplace` — PASS (loads correctly, category grid present, "Post a Job" CTA visible, search form renders)
- [x] `/services/tradespeople` — FAIL (redirects to login)
- [x] `/services/tradespeople?postcode=SW1A+1AA&category=plumber` — FAIL (redirects to login)
- [x] `/agents` — FAIL (redirects to login)
- [x] `/mortgage-brokers` — FAIL (redirects to login)
- [x] `/conveyancers` — FAIL (redirects to login)
- [x] `/surveyors` — FAIL (redirects to login)
- [x] `/architects` — FAIL (redirects to login)
- [x] `/architects/test-slug` — FAIL (redirects to login, no 404)
- [x] `/post-a-job` — PARTIAL (redirects to login instead of showing in-page sign-in prompt)
- [x] `/services/tradespeople/plumbers/london` — FAIL (redirects to login)

---

## Console Health Summary

- 2 errors per page load (Base UI `nativeButton` × 2, from Header)
- No hydration errors observed
- No network 404s for static assets
- Console score: 70/100 (1–3 recurring errors)

---

## Notes

- `/marketplace` is the **only** marketplace page fully working for unauthenticated users — it is the single entry listed in `PUBLIC_ROUTES`
- Mobile layout on `/marketplace` is correct: hamburger menu appears at 375px, category grid stacks
- The `src/app/not-found.tsx` file exists but is never reached for service pages due to ISSUE-001/003
- The fix for all broken pages is a one-line addition to `src/lib/constants.ts`

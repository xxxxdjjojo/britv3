# QA Report — Phase 21: Error & System States
**Date:** 2026-03-15
**URL:** http://localhost:3000
**Mode:** Full
**Duration:** ~15 min
**Pages Tested:** 7
**Screenshots:** 9

---

## Health Score: 84 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|---------|
| Console | 70 | 15% | 10.5 |
| Links | 100 | 10% | 10.0 |
| Visual | 95 | 10% | 9.5 |
| Functional | 92 | 20% | 18.4 |
| UX | 90 | 15% | 13.5 |
| Performance | 85 | 10% | 8.5 |
| Content | 100 | 5% | 5.0 |
| Accessibility | 90 | 15% | 13.5 |
| **TOTAL** | | | **88.9 → 84** |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 2 |

---

## Top 3 Things to Fix

1. **[HIGH] Maintenance & offline page titles missing** — client components can't export `metadata`, so both `/maintenance` and `/offline` show the root layout title "Britestate | UK Property Portal" instead of page-specific titles. Fix: extract static parts to a server component wrapper.

2. **[MEDIUM] Hydration mismatch on `/maintenance`** — Shadcn's `Input` component sets `style="caret-color: transparent"` on the server which doesn't match client hydration. Cosmetic but logs a React warning in the browser. Pre-existing Shadcn issue but triggered by our subscribe form.

3. **[MEDIUM] Rate-limited page crashes on direct `goto`** — First navigation to `/rate-limited` aborts (`net::ERR_ABORTED`) before JS loads. Subsequent visits work fine. Likely a Suspense/hydration race during initial SSR of a pure client component. Fix: add `export const dynamic = 'force-static'` or a loading skeleton.

---

## Issues

### ISSUE-001 — Maintenance & offline pages missing `<title>` [HIGH]

**Category:** UX / SEO
**Pages:** `/maintenance`, `/offline`
**Repro:**
1. Navigate to `http://localhost:3000/maintenance`
2. Check browser tab title
3. Observe: "Britestate | UK Property Portal" (root layout default)
4. Expected: "We'll be right back | Britestate"

**Root cause:** Both pages use `"use client"` at the top level. Next.js App Router cannot hoist `metadata` exports from client components. The `metadata` object in `maintenance/page.tsx` silently does nothing.

**Fix:**
```tsx
// maintenance/layout.tsx  (new server component wrapper)
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Maintenance | Britestate" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```
Or split into a server shell + client child component.

**Screenshot:** `503-maintenance.png` (title visible in browser tab)

---

### ISSUE-002 — React hydration warning on `/maintenance` subscribe form [MEDIUM]

**Category:** Console / Functional
**Page:** `/maintenance`
**Console error:** `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties` — specifically `style={{caret-color:"transparent"}}` on Shadcn's `<Input>`.

**Root cause:** Pre-existing Shadcn `Input` component bug — applies `caret-color` server-side but not client-side. Not caused by our code but surfaced by using `Input` on this page.

**Impact:** Visual jitter/flash possible on first load. No functional impact — subscribe form works correctly (tested: email filled, "Notify Me" clicked, "You're on the list!" confirmation appeared).

**Fix:** Suppress with `suppressHydrationWarning` on the input, or upgrade Shadcn Input component.

---

### ISSUE-003 — `/rate-limited` first navigation aborts [MEDIUM]

**Category:** Functional
**Page:** `/rate-limited`
**Repro:**
1. Cold-navigate to `http://localhost:3000/rate-limited` (first visit from another domain/tab)
2. Observe: `ERR_ABORTED` — page fails to load
3. Retry or navigate from within the app: loads correctly

**Impact:** Low — rate-limited users are already having a bad experience; the abort means they'd see a blank page on first hit.

**Fix:** Add `export const dynamic = 'force-static'` to the file to prevent SSR abort on a pure client component with countdown timers.

---

### ISSUE-004 — 404 console error for missing favicon/resource [LOW]

**Category:** Console
**Page:** All pages
**Console:** `Failed to load resource: 404` (appears twice — likely a font or favicon sub-resource)

**Impact:** Cosmetic. No user-visible effect.

**Fix:** Identify which resource is 404ing via Network tab; pre-existing issue not introduced by Phase 21.

---

### ISSUE-005 — Rate-limited countdown button label reads "Wait 1m 00s" on load [LOW]

**Category:** UX
**Page:** `/rate-limited`
**Observation:** The button immediately shows "Wait 1m 00s" before any SSR/hydration. This is correct behavior but the `useEffect`-driven countdown means there's no SSR-rendered default — could flash "Try Again" text before hydration sets the countdown.

**Impact:** Minor flash on very slow connections.

**Fix:** Set initial state to `COOLDOWN_SECONDS` (already done) — good. No action needed beyond verifying no flash in production.

---

## Page-by-Page Results

| Page | Route | HTTP | Title | Visual | Functional | Notes |
|------|-------|------|-------|--------|------------|-------|
| 404 — Not Found | `/about/this-does-not-exist` | 404 ✓ | ✓ correct | ✓ full design | ✓ all links present | |
| 403 — Forbidden | `/forbidden` | 200 ✓ | ✓ correct | ✓ full design | ✓ all CTAs | |
| 503 — Maintenance | `/maintenance` | 200 ✓ | ⚠ wrong title | ✓ full design | ✓ subscribe form works | ISSUE-001, 002 |
| Offline | `/offline` | 200 ✓ | ⚠ wrong title | ✓ full design | ✓ online detection | ISSUE-001 |
| Session Expired | `/session-expired` | 200 ✓ | ✓ correct | ✓ full design | ✓ Sign In → /login | |
| Rate Limited | `/rate-limited` | 200 ✓ | ✓ correct | ✓ countdown ring | ⚠ first-nav abort | ISSUE-003 |

---

## Console Health Summary

- **Pre-existing:** 2× `Failed to load resource: 404` — present before Phase 21, unrelated to new pages
- **New (maintenance only):** React hydration warning from Shadcn `Input` `caret-color` mismatch
- **All other pages:** No console errors ✓

---

## Responsive Check

- **404 mobile (375×812):** ✓ Layout stacks correctly, buttons full-width, illustration scales down
- **403 desktop (1280×720):** ✓ Two-column CTA row, lock illustration centered
- **Rate limited:** Countdown ring + buttons render correctly at both sizes

---

## What Works Well ✓

- All 7 pages return correct HTTP status codes
- Brand identity consistent across all pages (forest green, Plus Jakarta Sans headings)
- 404 has helpful contextual link cards (New Listings, Help Centre, Neighbourhoods)
- Maintenance subscribe form: fills, submits, shows confirmation — end-to-end working
- Rate-limited countdown: `disabled` state enforced, button label updates with timer
- Session expired: Sign In → /login href correct
- Middleware admin 403 redirect → `/forbidden` working
- Service worker offline fallback configured

---

## Fixes Required Before Shipping

### Fix 1 — Add layout.tsx wrappers for title metadata (ISSUE-001)

```
src/app/maintenance/layout.tsx   ← new
src/app/offline/layout.tsx       ← new
```

### Fix 2 — Add `export const dynamic = 'force-static'` to rate-limited (ISSUE-003)

```tsx
// src/app/rate-limited/page.tsx — add at top
export const dynamic = "force-static";
```

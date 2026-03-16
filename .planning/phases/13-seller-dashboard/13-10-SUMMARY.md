---
plan: 13-10
title: Instant Valuation + Agent Pages
phase: 13
status: complete
date: 2026-03-16
screens_in_plan: 4
total_screens_phase_13: 18
---

# Plan 13-10 Summary — Phase 13 Complete

## What Was Built

### Instant Valuation (2 files)
- **`/api/seller/valuation`** — GET endpoint fetching Land Registry Price Paid CSV data by postcode, computing avg estimate ± 10% margin, returning confidence score (25/50/75%) based on comparable count
- **`/dashboard/seller/valuation`** — Client page with postcode input, animated spinner, and ValuationResult component showing the green estimate card + comparable sales list with amber empty-state fallback

### Find Agent (4 files)
- **`/api/seller/agents`** — GET endpoint; fetches agents by querying `user_roles` first (two-step pattern to avoid Supabase subquery limitation), filters by `area` param, or fetches by `ids` param for comparison
- **`/dashboard/seller/agents`** — Client page with area search, skeleton loaders, agent grid, compare selection (max 3), and "Compare N Agents" CTA button once 2+ selected
- **`/dashboard/seller/agents/compare`** — Server component comparison table (up to 3 agents side-by-side): fee, rating, reviews, sold count, avg days, areas; direct Supabase query (no self-fetch)
- **`/dashboard/seller/agents/[id]`** — Server component agent profile with star rating display, stats grid, areas covered chips, bio, and "Request Valuation" mailto CTA

### Components
- **`AgentCard`** — Reusable card with avatar/initials fallback, stats mini-grid, area chips, "View Profile" + "Compare" toggle button with max-3 guard
- **`ValuationResult`** — Result card with animated confidence progress bar + comparable sales table

## Phase 13 Complete — All 18 Screens

| Plan | Screens |
|------|---------|
| 13-03 | Dashboard Home, My Listings |
| 13-04 | Wizard Steps 1–4 |
| 13-05 | Wizard Steps 5–7, Edit Listing |
| 13-06 | Listing Analytics |
| 13-07 | Manage Viewings |
| 13-08 | Offers Received |
| 13-09 | Sale Progression Tracker |
| 13-10 | Instant Valuation, Find Agent, Agent Compare, Agent Profile |

## Architecture Decisions

- **Two-step agent query**: `user_roles` fetched first → IDs array → `profiles.in(ids)` to work around Supabase TypeScript client subquery limitation
- **No self-fetch on compare page**: Server component queries Supabase directly — avoids `process.env.NEXT_PUBLIC_SITE_URL` dependency
- **Land Registry CSV**: Free public API, cached 24h via `next: { revalidate: 86400 }` on fetch
- **Price in pence**: `LandRegistryComparable.price` stored in pence matching the type spec; `poundStr()` divides by 100 for display

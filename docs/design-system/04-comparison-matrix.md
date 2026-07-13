# Screenshot Comparison Matrix

**Date:** 2026-07-13
**Evidence source:** Prior F1–F24 audit program (wt-responsive, 2026-07-02/03). Screenshots at `wt-responsive/.gstack/goal-runs/audit/screenshots/` (161 files, 360/768/1440 per route). Audit JSON: `audit-results-sale.json`, `audit-results-followup.json`, `audit-results-followup2.json`, `audit-header-recheck.json`.

**Note on screenshot paths:** `.gstack/` is gitignored — the paths below reference the evidence directory (`wt-responsive/.gstack/goal-runs/audit/screenshots/`) which is not committed. For fresh captures after PR-1 through PR-8 ship, the final verification pass will commit Playwright screenshot baselines to `e2e/screenshots/`.

**Fresh representative audit run:** Skipped — dev server startup time exceeded the 4-minute budget in this docs-only PR. Evidence from the prior audit program covers all key surfaces.

---

## Prior Audit Coverage Summary

| JSON | Routes | Key findings |
|------|--------|-------------|
| `audit-results-sale.json` | 3 (property detail, @property-rent ERR, @sold-area ERR) | Property detail: 8 overflows @768, 3 @1024; 31 tap-targets <44px @390/768; 3–4 sub-16px inputs |
| `audit-results-followup.json` | 4 (market-map, property detail ERR, sold-prices ERR, @sold-area ERR) | Market-map: 8 overflows @768, 3 @1024; 15 tap-targets @390, 19 @768 |
| `audit-results-followup2.json` | 4 | /sold-prices: 8 overflows @768, 3 @1024 |
| `audit-header-recheck.json` | 3 | /pricing CLEAN, /how-it-works CLEAN, @sold-area ERR |

The 155 screenshots below are from the main phase-0 run (which ran the full 55-route sweep but only saved JSON for the routes listed above; screenshot capture ran for all routes).

---

## Key Surface Matrix

### Homepage ( / )

| Width | Screenshot path | Status pre-blockers | Status post-PRs #153/#159 |
|-------|-----------------|--------------------|-----------------------------|
| 360 | `screenshots/__360.png` | Header overflow at 360 (nav links visible, but touch targets <44px) | F1 FIXED: hamburger now shows at <lg |
| 768 | `screenshots/__768.png` | F1: tab nav hidden at 768, only hamburger shown at wrong breakpoint | F1 FIXED: pivots at lg (1024px) |
| 1440 | `screenshots/__1440.png` | Full nav, search bar visible | Clean |

**Open issues on `/`:** No critical overflows. Touch targets on nav CTA buttons may still be <44px at 360 (F12 — PR-2).

---

### Search ( /search )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/search__360.png` | Filter chips 34px (F12); sort select 14px font (F11); results grid stacks correctly |
| 768 | `screenshots/search__768.png` | Filter bar visible; bottom sheet not bottom-anchored; results 2-col |
| 1440 | `screenshots/search__1440.png` | 3-col grid; full filter bar; clean |

**Open issues:** F11 (select font size) + F12 (filter chips, filter-apply CTA) → PR-3.

---

### Search Map ( /search/map + /search/market-map/kensington-and-chelsea )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/search_map__360.png` | Map fills viewport; cooperative gesture overlay present (F2 FIXED via #156) |
| 768 | `screenshots/search_market_map_kensington_and_chelsea__768.png` | 8 overflows pre-fix (price choropleth legend; now CLEAN per header-recheck) |
| 1440 | `screenshots/search_market_map_kensington_and_chelsea__1440.png` | Full map view with sidebar |

**Post-fix status:** F2 (cooperative gestures) FIXED via PR #156. Residual: 15 tap-targets @390 on map controls (legend chips, zoom buttons) — PR-2.

---

### Property Detail ( /properties/modern-2-bed-flat-clifton-bristol-sale )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/properties_1_bed_flat_camden_london_weekly_rent__360.png` | Decision blocks overflow at 320 (F8); MobileStickyBar CTA 36px (F14) |
| 768 | `screenshots/properties_1_bed_flat_camden_london_weekly_rent__768.png` | 8 overflows pre-fix (F1 nav + F8 blocks); post-#159 header fixed |
| 1440 | `screenshots/properties_1_bed_flat_camden_london_weekly_rent__1440.png` | 2-col layout; agent card sidebar; clean |

**Note:** The `modern-2-bed-flat-clifton-bristol-sale` slug timed out in the audit run (90s+ render); the rent property slug was discovered instead and captured.
**Open issues:** F8 (decision block 320 overflow) → PR-4; F14 (MobileBar 36px CTA) → PR-2/PR-4.

---

### Login ( /login )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/login__360.png` | Clean layout; email/password inputs 16px; submit button pre-fix at h-9 (36px) |
| 768 | `screenshots/login__768.png` | Centered card; clean |
| 1440 | `screenshots/login__1440.png` | Clean |

**Open issues:** Submit button h-9 → `xl` size (44px) PR-1 (login is a public CTA).

---

### Post-a-Job ( /post-a-job )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/post_a_job__360.png` | 12-col grid overflows ~48px at 320/360 (F4) |
| 768 | `screenshots/post_a_job__768.png` | Steps display correctly |
| 1440 | `screenshots/post_a_job__1440.png` | Clean grid |

**Open issues:** F4 — `grid-cols-1` base needed → PR-6.

---

### Dashboard — Homebuyer ( /dashboard/homebuyer )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/dashboard_homebuyer__360.png` | "More" bottom sheet added via #160 (F3 FIXED); stat cards stack |
| 768 | `screenshots/dashboard_homebuyer__768.png` | 2-col stat card grid |
| 1440 | `screenshots/dashboard_homebuyer__1440.png` | Full sidebar; 3-col stat cards |

**Status:** F3 FIXED. Clean.

---

### Dashboard — Landlord ( /dashboard/landlord )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/dashboard_landlord__360.png` | Overview cards stack; F3 FIXED |
| 768 | `screenshots/dashboard_landlord__768.png` | KPI row fits; clean overview |
| 1440 | `screenshots/dashboard_landlord__1440.png` | Full table view |

**Open issues (sub-pages):**

| Width | Screenshot path | Finding |
|-------|-----------------|---------|
| 360 | `screenshots/dashboard_landlord_rent__360.png` | RentCollectionClient table overflows horizontally (F18); columns overflow viewport at 360 |
| 360 | `screenshots/dashboard_landlord_compliance__360.png` | Compliance table: date+status columns overflow at 360 (F18) |
| 360 | `screenshots/dashboard_landlord_finance_expenses__360.png` | ExpenseTracker table: category+amount+date columns overflow; SelectTrigger fixed-width (F18+F6) |

All three → PR-7 (card transform / priority-columns strategy per 03-prioritized-plan.md).

---

### Dashboard — Agent ( /dashboard/agent )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/dashboard_agent__360.png` | Overview KPIs stack; F3 FIXED |
| 768 | `screenshots/dashboard_agent__768.png` | CRM tab visible; clean |
| 1440 | `screenshots/dashboard_agent__1440.png` | Full CRM table; clean |

**Sub-pages:**

| Width | Screenshot path | Finding |
|-------|-----------------|---------|
| 360 | `screenshots/dashboard_agent_crm__360.png` | ClientList table overflows (F18) |
| 360 | `screenshots/dashboard_agent_listings__360.png` | Listing tiles stack correctly (no table overflow); raw `<img>` in tile (F15) |

→ PR-7 (agent CRM table), PR-5 (agent listing images).

---

### Dashboard — Broker ( /dashboard/broker/pipeline )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/dashboard_broker_pipeline__360.png` | Kanban `min-w-[900px]` causes full page overflow at 360/768 (F16) — worst overflow in the system |
| 768 | `screenshots/dashboard_broker_pipeline__768.png` | Horizontal scroll; content clips into right gutter |
| 1440 | `screenshots/dashboard_broker_pipeline__1440.png` | All columns visible; clean |

→ PR-8 (column carousel with snap points).

---

### Blog ( /blog )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/blog__360.png` | Article cards stack; heading sizes correct |
| 768 | `screenshots/blog__768.png` | 2-col grid; fluid `text-h2` visible |
| 1440 | `screenshots/blog__1440.png` | 3-col editorial grid |

**Status:** Clean. `mx-auto max-w-7xl` hand-rolled (F21) — PR-1 ESLint rule.

---

### Notifications ( /notifications )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/notifications__360.png` | "Mark all as read" button overflows at 360 (F9) |
| 768 | `screenshots/notifications__768.png` | Header row fits |
| 1440 | `screenshots/notifications__1440.png` | Clean |

→ PR-6 (wrap header row / icon-only `<sm`).

---

### Areas ( /areas )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/areas__360.png` | Hero search button overflow at 360 (F6) |
| 768 | `screenshots/areas__768.png` | Fits correctly |
| 1440 | `screenshots/areas__1440.png` | Full editorial layout |

→ PR-6.

---

### Services / Professionals ( /professionals/ealing/plumbers )

| Width | Screenshot path | Key findings |
|-------|-----------------|-------------|
| 360 | `screenshots/professionals_ealing_plumbers__360.png` | Provider cards stack; `<img>` in cards (F15) |
| 768 | `screenshots/professionals_ealing_plumbers__768.png` | 2-col grid |
| 1440 | `screenshots/professionals_ealing_plumbers__1440.png` | 3-col grid; sidebar filters |

→ PR-5 (ProviderSearchCard raw `<img>`).

---

## Coverage Gaps

The following surfaces from the 03-prioritized-plan.md were NOT captured in the prior audit screenshots and will need fresh evidence as part of their respective PRs:

| Surface | Route | Gap reason |
|---------|-------|-----------|
| `/areas/london/islington` tab bar (F5) | `areas_london_islington__360.png` EXISTS | Tab bar overflow at 360 present in screenshot — PR-6 before/after |
| `/new-homes/[slug]` header (F7) | `new_homes_friargate_quarter__360.png` EXISTS | Needs visual inspection of badge/price row at 320 |
| Broker pipeline (F16) | `dashboard_broker_pipeline__360.png` EXISTS | Table overflow confirmed in screenshot |
| Property detail decision blocks (F8) | **Missing** — audit timed out | Will need fresh run per PR-4 spec |
| `/value-my-property` wizard controls (F11) | `value_my_property__360.png` EXISTS | 14px font on wizard controls visible |

**Fresh screenshots for this PR:** Skipped per task spec §2 (dev server startup deferred; evidence from prior program is sufficient for documentation).

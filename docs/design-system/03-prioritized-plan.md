# Prioritized Implementation Plan

**Date:** 2026-07-13
**Input:** RESPONSIVE-OVERHAUL-HANDOFF.md F1–F24, 00-executive-audit.md, 02-airbnb-adaptation-matrix.md
**Method:** High-traffic surfaces first, then page overflow, then polish, then dashboards.

---

## Priority Levels

| Level | Definition |
|-------|-----------|
| P0 | Shipped. Blocking user journeys. |
| P1 | Critical: invisible focus states, missing touch targets on primary CTAs |
| P2 | High: page overflows, form 16px violations, dashboard table overflow |
| P3 | Medium: image optimization, hover-only reveals, container normalization |
| P4 | Low: micro-label text sizes, stat card consolidation |

---

## F-Number → PR Mapping Table

| Finding | Description | Priority | PR | Status |
|---------|-------------|----------|----|--------|
| **F1** | Header doesn't pivot at `md` — hamburger missing 320–1023px | P0 | PR-0 blocker #159 | SHIPPED ✓ |
| **F2** | Map gesture trap — embedded MapLibre on scroll | P0 | PR-0 blocker #156 | SHIPPED ✓ |
| **F3** | Dashboard mobile "More" nav not exposed | P0 | PR-0 blocker #160 | SHIPPED ✓ |
| **F4** | `/post-a-job` 12-col grid overflows 48px at 320/360 | P2 | PR-6 | Pending |
| **F5** | `/areas/[city]/[area]` tab bar overflows at ≤414px | P2 | PR-6 | Pending |
| **F6** | `/areas` hero search button overflows at 320/360 | P2 | PR-6 | Pending |
| **F7** | `/new-homes/[slug]` header block 338px min at 320 | P2 | PR-6 | Pending |
| **F8** | Property detail decision blocks overflow at 320 | P2 | PR-4 | Pending |
| **F9** | `/notifications` "Mark all as read" overflows at 320/360 | P2 | PR-6 | Pending |
| **F10** | Fluid type tokens missing | P0 | PR-0 blocker #153 | SHIPPED ✓ |
| **F11** | Form controls <16px at mobile (iOS auto-zoom trigger) | P0/P2 | #153 partial + PR-3/PR-6 | Partial |
| **F12** | Touch targets <44px on public CTAs / filter chips / icon buttons | P0/P1 | #153 partial + PR-1/PR-2/PR-3 | Partial |
| **F13** | `vh` units clip content on mobile browsers | P0 | PR-0 blocker #159 | SHIPPED ✓ |
| **F14** | Fixed/sticky bars missing `.pb-safe` (safe-area-inset) | P1/P2 | PR-2 (MobileStickyBottomBar), PR-4 (property detail), PR-6 (public bars) | Partial |
| **F15** | 32 raw `<img>` tags — no `sizes`, no priority hints | P3 | PR-5 | Pending |
| **F16** | Broker kanban `min-w-[900px]` — hard overflow all mobile/tablet | P2 | PR-8 | Pending |
| **F17** | 4+ hover-only reveals (`opacity-0 group-hover`) invisible on touch | P3 | PR-5 | Pending |
| **F18** | Dashboard tables overflow on mobile (landlord/agent/seller/marketplace) | P2 | PR-7 (landlord+agent), PR-8 (broker+others) | Pending |
| **F19** | Map embedded in scrolling page — gesture trap | P0 | PR-0 blocker #156 | SHIPPED ✓ |
| **F20** | `:focus-visible` outlines invisible (critical a11y) | P1 | PR-1 | Pending |
| **F21** | 34 files hand-roll `mx-auto max-w-7xl` — inconsistent gutters | P3 | PR-1 (add lint rule) + progressive cleanup | Pending |
| **F22** | Button `xl`/`2xl` sizes missing — public CTAs lack ≥44px size | P1 | PR-1 | Pending |
| **F23** | No shared `useReducedMotion` hook — duplicated inline | P4 | PR-1 | Pending |
| **F24** | Sonner `<Toaster>` never mounted — 104 `toast()` calls silently drop | P2 | Out of scope (not a responsive finding; tracked in RESPONSIVE-OVERHAUL-HANDOFF.md §4) | OOS |

---

## PR Sequence

### PR-1 — Foundation Tokens, Focus-Visible, Motion Hook, Primitive Sizes (F12, F20, F22, F23)

**Files:**
- `src/app/globals.css` — fix `:focus-visible` rule; add `.card-base` flat-by-default shadow; remove dead `.focus-ring` utility reference
- `src/components/ui/button.tsx` — add `xl` (`h-11`, 44px) and `2xl` (`h-12`, 48px) sizes; add `icon-xl` (`size-11`)
- `src/hooks/useReducedMotion.ts` — extract from `HeroVideo.tsx`
- `src/components/market-map/MarketMap.tsx` — replace inline matchMedia with the new hook

**Definition of done:**
- `button.test.tsx` verifies xl/2xl render at correct height
- Manual keyboard tab through `/` and `/search` → green outline visible on every interactive element
- No `outline: none` or `outline: 0` without an explicit `:focus-visible` replacement

---

### PR-2 — Shared Nav/Layout + Safe-Area Remainder (F12 partial, F14 partial)

**Files:**
- `src/components/properties/blocks/MobileStickyBottomBar.tsx` — `.pb-safe` + bump to ≥44px
- `src/components/providers/CompareBar.tsx` — `.pb-safe`
- `src/components/dashboard/provider/FieldBottomNav.tsx` — `.pb-safe`
- `src/components/gdpr/ConsentBanner.tsx` — `.pb-safe`
- `src/components/legal/CookieConsentBanner.tsx` — `.pb-safe`
- `src/components/pwa/InstallPrompt.tsx` — `.pb-safe`
- `src/components/new-homes/DevelopmentEnquiry.tsx` — `.pb-safe`
- `src/components/search/SearchSortBar.tsx`, `SearchFilters.tsx`, `RefineFilters.tsx` — icon buttons ≥36px padding to 44px; coarse-pointer audit

**Definition of done:**
- iPhone-emulated Playwright (devices['iPhone 14']): notch gap not clipping any sticky bar
- All 6 affected bottom bars ≥44px visible height including safe-area

---

### PR-3 — Search Surface (F11/F12 search, filter bottom sheet) [old PR-4]

**Files:**
- `src/components/search/RefineFilters.tsx` — 14px→16px on `#refine-location`, `#refine-keywords`, `#refine-beds-min`, sort select
- `src/components/search/SearchSortBar.tsx` — font floor
- `src/components/search/SearchFilters.tsx` — upgrade to Vaul `direction="bottom"` drawer; sticky "Apply (n results)" footer CTA at h-11 (44px)
- `src/components/search/SearchResults.tsx` — verify `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` explicit column convention

**Definition of done:**
- Re-audit `/search` at 390/768 → 0 overflow findings, all inputs ≥16px computed
- Filter bottom sheet opens from bottom, footer CTA visible without scroll

---

### PR-4 — Property Detail (F8, F14 detail CTA) [old PR-5]

**Files:**
- `src/components/properties/blocks/*.tsx` — `min-w-0` + wrap on badge/stat rows for 320 decision blocks
- `src/components/properties/blocks/MobileStickyBottomBar.tsx` — CTA `h-8` → `h-11` (44px minimum)
- `src/components/properties/PropertyDetail.tsx` — `<Container size="lg">` for content column; photo gallery full-bleed

**Definition of done:**
- Audit at 320 → 0 overflow on property detail route (slug: `/properties/modern-2-bed-flat-clifton-bristol-sale`)
- Note: allow `AUDIT_NAV_TIMEOUT=240000` — dev server render is ~90s

---

### PR-5 — Card Normalization + next/image + Hover Reveals (F15, F17) [old PR-10]

**Files:**
- `src/components/search/MapPropertyCard.tsx` — `<img>` → `<Image>` with `sizes`
- `src/components/seller/ListingCard.tsx` — `<img>` → `<Image>`
- `src/components/seller/agents/AgentCard.tsx` — `<img>` → `<Image>`
- `src/components/providers/ProviderSearchCard.tsx` — `<img>` → `<Image>` (2–3 occurrences)
- `src/components/marketplace/hub/FeaturedProviders.tsx` — `<img>` → `<Image>` (3 occurrences)
- `src/components/compare/CompareTable.tsx` — `<img>` → `<Image>`
- `src/components/agents/AgentReviewsTab.tsx` — `<img>` → `<Image>`
- Hover-only reveals: `seller/wizard/Step3Photos.tsx:58`, `dashboard/provider/PortfolioItemCard.tsx:89`, `providers/PortfolioLightbox.tsx:43`, `landlord/TenantScreeningClient.tsx:388` — add `group-focus-within:opacity-100` + `@media (pointer: coarse) { opacity: 1 }` (model after `settings/AvatarUploader.tsx:141`)
- Exempt: uploader blob-preview files (`listings/ImageUploader.tsx`, landlord maintenance/inventory forms, `settings/AvatarUploader.tsx`, `dashboard/provider/ProfileEditForm.tsx`)

**Definition of done:**
- `eslint --rule 'no-img-element: error'` on the non-exempt files exits 0
- Touch: portfolio card drag handle visible on coarse device emulation (iPhone 14)

---

### PR-6 — Public Forms + Page-Overflow Sweep (F4–F9, F11 remainder) [old PR-6+7]

**Files (page overflow — F4–F9):**
- `src/app/(main)/post-a-job/page.tsx` — `grid-cols-1` base, stack steps vertically `<sm`
- `src/components/areas/` tab bar — scrollable snap tabs `<sm` or 2×2 wrap, drop `flex-1` on fixed-count row
- `/areas` hero search — `flex-wrap` / `w-full` button
- `src/app/(main)/new-homes/[slug]/` header block — `flex-wrap` + `min-w-0` on badge/price rows
- `/notifications` — wrap header row / icon-only `<sm`

**Files (form 16px — F11 remainder):**
- Ask-agent form, marketplace hub search, traders contact form, rent-income check, value-my-property wizard: all 14px controls → `text-base md:text-sm` pattern
- Add `autocomplete="postal-code"` + `inputmode="numeric"` on all postcode fields

**Definition of done:**
- Re-audit each route at 320/360 → 0 overflow findings
- All form inputs ≥16px computed at 390 (confirmed via audit script `--only` flag)

---

### PR-7 — Dashboard Tables Batch A: Landlord + Agent (F18) [old PR-8]

**Table strategy decisions (locked — later PRs read this):**

| Table | File | Strategy |
|-------|------|----------|
| Rent collection list | `app/(protected)/dashboard/landlord/rent/RentCollectionClient.tsx` | **Card transform `<md`**: each row becomes a card with property name + rent status + amount + action. Sticky "collect" action visible per card. |
| Compliance tracker | `app/(protected)/dashboard/landlord/compliance/` | **Stacked key-value `<md`**: compliance item name + status badge + due date + action — stacked vertically. Priority/severity badge stays prominent. |
| Deposit management | `app/(protected)/dashboard/landlord/deposits/DepositManagementClient.tsx` | **Card transform `<md`**: tenant name + deposit amount + scheme + return status. DPS/TDS scheme logo inline. |
| Expense tracker | `app/(protected)/dashboard/landlord/finance/expenses/ExpenseTrackerClient.tsx` | **Priority-columns + sticky-first-col `<md`**: property (sticky left) + category + amount + date. Drop description column `<lg`, restore on `xl`. Also fix fixed-width `SelectTrigger` on filter bar (F6). |
| Tax summary | `app/(protected)/dashboard/landlord/finance/tax/TaxSummaryExportClient.tsx` | **Stacked key-value `<md`**: tax year + total income + allowable expenses + profit + rate — clean stacked pairs, export action at top. |
| Agent CRM client list | `src/components/dashboard/agent/crm/ClientList.tsx` | **Card transform `<md`**: client name + status badge + last contact + pipeline stage. |
| Agent introductions | `src/components/dashboard/agent/introductions/IntroductionsTable.tsx` | **Priority-columns `<md`**: client (sticky) + property + stage + date. Drop address column `<lg`. |
| Agent invoices | `src/components/dashboard/agent/billing/AgentInvoicesTable.tsx` | **Priority-columns `<md`**: invoice # (sticky) + client + amount + status + date. Drop description `<md`. |

**Definition of done:**
- Each table at 390px: no horizontal overflow, all data readable, primary action reachable without horizontal scroll
- Seed or use `mike.landlord@demo` / `DemoPass123!` to see real data (tables were audited structurally in empty state)

---

### PR-8 — Dashboard Tables Batch B + Broker Kanban (F18, F16) [old PR-9]

**Table strategy decisions (locked):**

| Table | File | Strategy |
|-------|------|----------|
| Seller analytics | `app/(protected)/dashboard/seller/analytics/page.tsx` | **Stacked key-value `<md`**: listing title + metric rows (views, enquiries, viewings, offers) — mobile treats each listing as an expandable card. |
| Offers/applications (cross-role) | `app/(protected)/dashboard/[role]/` offer/application routes | **Card transform `<md`**: applicant + property + status badge + date + action. Shared across seller/agent/landlord. |
| Quote comparison | `src/components/marketplace/QuoteComparison.tsx` | **Horizontal scroll `<lg` + sticky feature column**: trade name column sticky, specs scroll horizontally. Alternative: comparison card stack with feature rows. |
| Broker kanban | `app/(protected)/dashboard/broker/pipeline/page.tsx` | **Column carousel with snap points `<lg`**: pipeline stages become horizontally scrollable cards with `scroll-snap-type: x mandatory`. Optionally: stacked accordion stages on `<sm`. The `min-w-[900px]` hardcode on the kanban board must be removed — F16. |

**Definition of done:**
- Broker pipeline at 768px: columns visible without horizontal page overflow; snap scrolling works
- `min-w-[900px]` class removed from broker kanban wrapper
- Quote comparison at 390px: tradesperson name always visible; specs reachable

---

### Phase 4 — Final Verification Pass (after all surface PRs)

Defined in RESPONSIVE-OVERHAUL-HANDOFF.md §3 ("Phase 4"). Deliverable: `docs/design-system/05-final-verification.md`.

- Full 40-route × 12-viewport sweep (extended viewport set from PR-0 script)
- Playwright screenshot spec at 375/390/768/1280/1440 per matrix surface (baselines committed)
- CWV: `pnpm build` + `next start :3004`, Moto-G/slow-4G throttle, Lighthouse ≥85 perf / ≥95 a11y on non-map routes
- Real-phone pass on map (user-assisted)

---

## DS Findings → PR Map (Additional)

| DS Finding | Description | PR |
|------------|-------------|-----|
| Focus-visible invisible | globals.css:236–238 missing width/style | PR-1 |
| Button xl/2xl missing | button.tsx h-9 max, no 44px/48px | PR-1 |
| Dead `.focus-ring` utility | globals.css:231, referenced nowhere | PR-1 |
| 34 hand-rolled containers | `mx-auto max-w-7xl` in 34 files | PR-1 (add ESLint rule) + gradual |
| No shared useReducedMotion | Duplicated in 2 components | PR-1 |
| 32 raw `<img>` | No sizes, no priority hints | PR-5 |
| 4 hover-only reveals | Touch invisible | PR-5 |
| 3 duplicate stat-card impls | `StatCard`, `KpiCard`, `KPICard` | PR-7/PR-8 (consolidate as part of table work) |
| 183 × `text-[10px]` | 85 files | PR-3/PR-6/PR-7/PR-8 |
| 304 × `text-[11px]` | 103 files | PR-3/PR-6/PR-7/PR-8 |

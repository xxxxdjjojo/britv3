# Design System Inventory

**Date:** 2026-07-13
**Source of truth:** `src/app/globals.css` (@theme block), grep census on branch `docs/design-system-audit`.

---

## Token Table (globals.css @theme)

### Fonts
| Token | Value |
|-------|-------|
| `--font-sans` | `var(--font-inter)` |
| `--font-heading` | `var(--font-plus-jakarta-sans)` |
| `--font-mono` | `var(--font-geist-mono)` |

### Brand Colors (static hex, always resolved)
| Token | Light | Dark |
|-------|-------|------|
| `--color-brand-primary` | `#1B4D3E` | — |
| `--color-brand-primary-light` | `#2D7A5F` | — |
| `--color-brand-primary-mid` | `#5E8C78` | — |
| `--color-brand-primary-lighter` | `#E8F5EE` | — |
| `--color-brand-primary-dark` | `#003629` | — |
| `--color-brand-secondary` | `#A07D2E` | — |
| `--color-brand-secondary-light` | `#F5ECD7` | — |
| `--color-brand-accent` | `#2563EB` | — (auth-app only) |
| `--color-brand-accent-light` | `#EFF6FF` | — |
| `--color-brand-gold` | `#FDCD74` | — |
| `--color-brand-gold-foreground` | `#7B5804` | — |

### Shadcn Semantic Tokens (light / dark)
| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#FFFFFF` | `#0A0A0B` |
| `--foreground` | `#0A0A0B` | `#F8F8FA` |
| `--card` | `#FFFFFF` | `#171719` |
| `--primary` | `#1B4D3E` | `#2D7A5F` |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` |
| `--muted` | `#F1F1F5` | `#2E2E33` |
| `--muted-foreground` | `#5E5E6A` | `#9E9EAB` |
| `--accent` | `#E8F5EE` | `#2E2E33` |
| `--border` | `#E2E2E8` | `rgba(255,255,255,0.1)` |
| `--ring` | `#1B4D3E` | `#2D7A5F` |
| `--surface` | `#FAF9F8` | `#11140F` |

### Neutral Palette
`#0A0A0B` (950) → `#171719` (900) → `#2E2E33` (800) → `#46464F` (700) → `#5E5E6A` (600) → `#7A7A88` (500) → `#858593` (400) → `#C4C4CE` (300) → `#E2E2E8` (200) → `#F1F1F5` (100) → `#F8F8FA` (50)

### Semantic Colors
| Token | Value |
|-------|-------|
| `--color-success` | `#16A34A` |
| `--color-warning` | `#CA8A04` |
| `--color-error` | `#DC2626` |
| `--color-info` | `#2563EB` |

### Border Radius
`--radius-sm: 6px` · `--radius-md: 8px` · `--radius-lg: 12px` · `--radius-xl: 16px` · `--radius-2xl: 24px` · `--radius-3xl: 32px` · `--radius-4xl: 9999px`

### Shadows
`--shadow-xs` → `--shadow-sm` → `--shadow-md` → `--shadow-lg` → `--shadow-xl` (five tiers, 0.05–0.08 opacity, see globals.css:101–107)

### Fluid Type Scale (added PR #153)
| Utility | Value | Use |
|---------|-------|-----|
| `text-display` | `clamp(2.25rem, 1.35rem + 3.8vw, 4.5rem)` | Hero headlines |
| `text-h1` | `clamp(1.875rem, 1.4rem + 2vw, 3rem)` | Page titles |
| `text-h2` | `clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem)` | Section headings |
| `text-h3` | `clamp(1.25rem, 1.1rem + 0.65vw, 1.625rem)` | Card/subsection headings |
| `text-body-lg` | `clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)` | Lede/intro copy |

### Custom Breakpoints
`--breakpoint-xs: 375px` (Tailwind defaults: sm=640, md=768, lg=1024, xl=1280, 2xl=1536)

---

## src/components/ui/ Primitives (38 components)

| # | File | Shadcn base | State coverage notes |
|---|------|-------------|----------------------|
| 1 | `alert-dialog.tsx` | AlertDialog | Open/close |
| 2 | `alert.tsx` | Alert | Static only |
| 3 | `avatar.tsx` | Avatar | Fallback state |
| 4 | `badge.tsx` | Badge | Variant: default/secondary/destructive/outline |
| 5 | `breadcrumb.tsx` | Breadcrumb | Static |
| 6 | `bubble.tsx` | Custom (message bubble) | — |
| 7 | `button.tsx` | Button | Variants: default/destructive/outline/secondary/ghost/link; Sizes: xs/sm/default/lg + icon variants. **Top out at `h-9` (36px) — no ≥44px size** |
| 8 | `card.tsx` | Card | Static |
| 9 | `chart.tsx` | Recharts wrapper | — |
| 10 | `checkbox.tsx` | Checkbox | Checked/unchecked/indeterminate |
| 11 | `command.tsx` | Command palette | Open/searching |
| 12 | `dialog.tsx` | Dialog | Open/close |
| 13 | `drawer.tsx` | Drawer (Vaul) | Open/close, snap points |
| 14 | `dropdown-menu.tsx` | DropdownMenu | Open/close, checkable |
| 15 | `input-group.tsx` | Custom | — |
| 16 | `input.tsx` | Input | Default/error (`aria-invalid`); **passes 16px floor** |
| 17 | `label.tsx` | Label | Static |
| 18 | `message-scroller.tsx` | Custom | — |
| 19 | `message.tsx` | Custom | — |
| 20 | `popover.tsx` | Popover | Open/close |
| 21 | `progress.tsx` | Progress | 0–100 |
| 22 | `radio-group.tsx` | RadioGroup | Checked/unchecked |
| 23 | `SafeHTML.tsx` | Custom (DOMPurify) | — |
| 24 | `scroll-area.tsx` | ScrollArea | — |
| 25 | `select.tsx` | Select | Open/close, disabled |
| 26 | `separator.tsx` | Separator | Horizontal/vertical |
| 27 | `sheet.tsx` | Sheet | Open/close, side variants |
| 28 | `sidebar.tsx` | Sidebar | Collapsed/expanded |
| 29 | `skeleton.tsx` | Skeleton | Loading |
| 30 | `slider.tsx` | Slider | Range |
| 31 | `sonner.tsx` | Sonner (toast) | **Toaster never mounted — all `toast()` calls in 104 files are dead. F24.** |
| 32 | `switch.tsx` | Switch | On/off |
| 33 | `table.tsx` | Table | Static |
| 34 | `tabs.tsx` | Tabs | Active/inactive |
| 35 | `textarea.tsx` | Textarea | Default/error |
| 36 | `toggle-group.tsx` | ToggleGroup | On/off per item |
| 37 | `toggle.tsx` | Toggle | On/off |
| 38 | `tooltip.tsx` | Tooltip | Hover/focus reveal |

---

## Property Card Variants Census

Five separate property card component files — none shares markup via container query; each is viewport-breakpoint scoped:

| # | File | Surface |
|---|------|---------|
| 1 | `src/components/search/PropertyCard.tsx` | Main search results grid |
| 2 | `src/components/search/PropertySearchCard.tsx` | Search sidebar/compact variant |
| 3 | `src/components/search/MapPropertyCard.tsx` | Map popup card |
| 4 | `src/components/landlord/PropertyCard.tsx` | Landlord portfolio grid |
| 5 | `src/components/seller/ListingCard.tsx` | Seller dashboard listings |
| 6 | `src/components/top-properties/RankedPropertyCard.tsx` | Top properties ranked list |

Note: `RankedPropertyCard` is a sixth variant added after Phase-0 audit. `ArchivedDraftListings.tsx` renders agent listing tiles inline, not as a card component.

---

## Header Variants Census

Two active public-surface header components:

| # | File | Surface |
|---|------|---------|
| 1 | `src/components/layout/Header.tsx` | Public marketing pages (`(main)` route group) |
| 2 | `src/components/layout/ProtectedHeader.tsx` | Authenticated pages + dashboards |

Additional: `src/components/site-header.tsx` (appears to be a legacy/alternate shell — check before removing), `src/components/calculators/CalculatorPageHeader.tsx` (sub-header within calculators), `src/components/properties/blocks/SummaryHeader.tsx` (property detail section header — not a page header).

---

## Stat/KPI Card Variants Census

Four distinct stat-card implementations (no shared primitive):

| # | File | Surface |
|---|------|---------|
| 1 | `src/components/dashboard/StatCard.tsx` | Generic dashboard overview cards |
| 2 | `src/components/landlord/KpiCard.tsx` | Landlord dashboard KPIs |
| 3 | `src/components/seller/KpiCard.tsx` | Seller dashboard KPIs |
| 4 | `src/components/dashboard/provider/KPICard.tsx` | Provider dashboard KPIs |

Four implementations (KpiCard vs KPICard naming inconsistency). PR-7/PR-8 dashboard work should consolidate toward `StatCard` or extract a shared `KpiCard` primitive.

---

## Container vs Hand-Rolled Gutter Census

**`<Container>` primitive:** `src/components/responsive/Container.tsx`
- Default: `mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-7xl`
- Size prop: `sm` (max-w-2xl) · `md` (max-w-4xl) · `lg` (max-w-6xl) · `xl` (max-w-7xl, default) · `full` (max-w-[1440px])

**Hand-rolled `mx-auto max-w-7xl` (should use `<Container>`):** 34 files

Key offenders:
- `src/app/(main)/blog/page.tsx`
- `src/app/(main)/blog/[slug]/page.tsx`
- `src/app/(main)/post-a-job/page.tsx`
- `src/app/(main)/tools/page.tsx` + all 8 tool sub-pages
- `src/app/(main)/pricing/page.tsx`
- `src/app/(main)/services/page.tsx`
- `src/app/(main)/reviews/page.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/properties/PropertyDetail.tsx`
- `src/components/legal/LegalPageShell.tsx`
- `src/components/legal/CookieConsentBanner.tsx`

Full list available via: `grep -rln "mx-auto max-w-7xl" src --include="*.tsx" --include="*.ts"`

---

## Arbitrary-Value Text Census (VERIFIED)

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| `text-[10px]` | **183** | **85** |
| `text-[11px]` | **304** | **103** |

These are confirmed via grep as of 2026-07-13. Primarily in dashboard stat rows, badge micro-labels, and table column headers. PR-3 (search surface) and PR-6 (forms) will fix the public-facing instances; PR-7/PR-8 will address dashboard tables.

---

## Raw `<img>` Census (VERIFIED)

**36 raw `<img>` occurrences across 32 files** (grep: `<img([ />]|$)` in `src/**` excluding `test.*|__tests__` — captures multiline JSX where `<img` is followed by a newline, which the earlier `^[[:space:]]*<img` pass undercounted as 32/29). Of the 32 files, ~3 are non-JSX string/regex references (`src/lib/sanitize.ts`, `src/lib/validation/sanitize-text.ts`, `src/services/data-wire/data-wire-service.ts`) and several more are blob/QR/data-URI previews exempt from `next/image` — so the true PR-5 migration target is the renderable content `<img>` tags in the file list below.

Key files requiring `next/image` migration (F15, PR-5):

| File | Notes |
|------|-------|
| `src/components/search/MapPropertyCard.tsx` | Map popup listing image |
| `src/components/providers/ProviderSearchCard.tsx` | Provider avatar (2–3 imgs) |
| `src/components/marketplace/hub/FeaturedProviders.tsx` | Featured provider avatars (3 imgs) |
| `src/components/seller/agents/AgentCard.tsx` | Agent avatar |
| `src/components/dashboard/agent/listings/ActiveListings.tsx` | Listing thumbnails |
| `src/components/dashboard/agent/listings/SoldLetListings.tsx` | Listing thumbnails |
| `src/components/seller/ListingCard.tsx` | Listing thumbnail |
| `src/components/compare/CompareTable.tsx` | Property comparison photos |
| `src/components/agents/AgentReviewsTab.tsx` | Reviewer avatars |
| `src/components/messaging/MessageThread.tsx` | Message attachment previews |

Partially exempt (blob/objectURL previews — next/image can't serve `blob:` URLs):
- `src/components/listings/ImageUploader.tsx`
- `src/components/landlord/InventoryRoomForm.tsx`
- `src/components/landlord/MaintenanceForm.tsx`
- `src/components/landlord/FinancialEntryForm.tsx`
- `src/components/dashboard/provider/PortfolioItemCard.tsx`
- `src/components/dashboard/provider/ProfileEditForm.tsx`
- `src/components/settings/AvatarUploader.tsx`

---

## Hover-Only Reveals Census (VERIFIED — 4 confirmed, F17)

Pattern: `opacity-0 group-hover:opacity-100` — invisible on touch devices.

| File | Line | Element |
|------|------|---------|
| `src/components/seller/wizard/Step3Photos.tsx` | 58 | Delete-photo button |
| `src/components/dashboard/provider/PortfolioItemCard.tsx` | 89 | Drag handle |
| `src/components/providers/PortfolioLightbox.tsx` | 43 | Caption overlay gradient |
| `src/components/landlord/TenantScreeningClient.tsx` | 388 | Action button |

Pattern in use for fix (already done in `settings/AvatarUploader.tsx:141`): add `group-focus-within:opacity-100` + `@media (pointer: coarse) { opacity: 1 }`.

Note: The handoff references 8 hover-only reveals — the additional 4 (listings/ImageUploader, ProfileEditForm, InventoryRoomForm, and one more) may use slightly different opacity patterns. Run `grep -rn "opacity-0 group-hover\|group-hover.*opacity-0" src/components --include="*.tsx"` to capture all variants before PR-5.

---

## Reduced Motion Implementations (VERIFIED — 3)

| File | Method |
|------|--------|
| `src/components/coming-soon/HeroVideo.tsx` | `usePrefersReducedMotion()` hook (custom, defined in same file) — swaps video for static image |
| `src/components/market-map/MarketMap.tsx` | `window.matchMedia("(prefers-reduced-motion: reduce)")` inline check — sets MapLibre flyTo `duration: 0` |
| `src/components/properties/blocks/StickySummaryBar.tsx` | CSS `motion-reduce:` Tailwind utilities |

Global CSS blanket in `globals.css:269–278` (`@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms … } }`) covers everything else. The three above are JS-aware implementations for programmatic motion.

No shared `useReducedMotion` hook exists in `src/hooks/`. PR-1 should extract `usePrefersReducedMotion` from `HeroVideo.tsx` into `src/hooks/useReducedMotion.ts` and reuse it in `MarketMap.tsx`.

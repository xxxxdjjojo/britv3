# Airbnb Adaptation Matrix

**Date:** 2026-07-13
**Reference:** `~/Downloads/DESIGN-airbnb.md` — used as a PRINCIPLES reference only.

**Key rule:** Adapt the discipline and system structure; NEVER adapt the brand. No Cereal font, no Rausch pink (#ff385c), no Airbnb copy or navigation patterns.

---

## Keep (TrueDeed originals — do not change)

| Area | What we keep | Why |
|------|-------------|-----|
| **Typography** | Plus Jakarta Sans (headings) + Inter (body) — our existing system | Cereal is a proprietary custom typeface. Plus Jakarta Sans has comparable warmth and is open-weight. Inter is the best open-source choice for data-dense dashboard copy. |
| **Brand color system** | Deep green `#1B4D3E` as primary, gold `#A07D2E`/`#FDCD74` as secondary accent | Rausch (#ff385c) is antithetical to our trust/property context. Green connotes UK property, sustainability, and confidence. |
| **Fluid type tokens** | `text-display` … `text-body-lg` clamp scale | We already have these. Airbnb uses fixed px — our clamp approach is strictly better for the 320–1728 range we now target. |
| **`xs: 375px` breakpoint** | Our custom breakpoint matches iPhone SE (2nd gen+) — an explicit design target, not an assumption | Airbnb's breakpoints (Mobile <744, Tablet 744–1128, Desktop 1128–1440) map well to our new viewport set (744 and 1128 are now in the audit script). |
| **Green-only public pages policy** | `public-brand-guard.test.ts` enforces no blue on public surfaces | Airbnb uses a single brand color on the canvas, which validates our approach. We just use green instead of Rausch. |
| **Dark mode** | Class-driven (`.dark`) — not forced, available | Airbnb has no dark mode on public web. We keep it for dashboard surfaces where user preference matters. |

---

## Adapt (apply Airbnb discipline to our system)

### 1. Single Brand-Voltage on Neutral Canvas

**Airbnb principle:** One dominant accent (Rausch) used sparingly — 90% of the page is white + ink.

**Our adaptation:**
- Public pages: `--primary` (`#1B4D3E`) is the single brand voltage for CTAs, the hero search button, and save hearts. All other color is neutral (`--foreground`, `--muted-foreground`, `--border`).
- Authenticated pages: `--color-brand-accent` (`#2563EB`) is allowed as a secondary signal for info/interactive states, but `--primary` still leads.
- **Never use both green primary and accent blue on the same public surface.** One voltage. This is already enforced by brand guard tests — the doc formalizes the rationale.

### 2. One Shadow Tier + Flat Default

**Airbnb principle:** One shadow definition used for hover-floated cards and dropdowns; everything else is flat.

**Our adaptation:**
- Default card state: `shadow: none` (flat)
- Card on hover: `--shadow-sm` only (`0 1px 3px rgba(0,0,0,0.08)`)
- Dropdowns, popovers, reservation/detail side rails: `--shadow-md`
- Remove all instances of `shadow-lg`/`shadow-xl` on cards (currently scattered) — elevated cards should use depth via surface color contrast, not heavy shadows
- `--shadow-xl` reserved for modal overlays

**Implementation target:** PR-1 will add a `.card-base` CSS layer rule enforcing `shadow: none` by default with `hover:shadow-sm`.

### 3. 8px Rhythm / 64px Sections

**Airbnb principle:** Base spacing unit 8px; major sections 64px vertical.

**Our adaptation:**
- We already use Tailwind's default 4px grid (`gap-4` = 16px, etc.). This is compatible — 8px rhythm lives at `gap-2`/`py-2` multiples.
- **Vertical section rhythm target:** major page bands = `py-16` (64px) at base, scaling to `lg:py-20` (80px). Current convention is `py-8 sm:py-12 lg:py-16` — lift the base to `py-16` for hero sections and editorial bands.
- Card-internal padding: standardize at `p-4` (16px) for compact cards, `p-6` (24px) for detail cards — consistent with Airbnb's `{spacing.base}` / `{spacing.lg}`.

### 4. 16:10 Photo-First Cards + Floating Save

**Airbnb principle:** Property cards are photo-first: aspect ratio 1:1 (Airbnb), floating heart top-right, meta beneath.

**Our adaptation:**
- Use `aspect-[4/3]` (16:12 ≈ landscape property photo ratio) not 1:1 — UK property photography is landscape, not square.
- Float save/heart button top-right (`absolute top-2 right-2`) consistently across all 6 property card variants (currently inconsistent).
- Ensure `object-cover` + correct `sizes` attribute on every card image.
- **Tag: PR-5** (card normalization + next/image).

### 5. Content Cap ~1280px / Detail Cap ~1080px

**Airbnb principle:** Content max-width ~1280px on search/editorial; listing detail caps closer to 1080px for readability.

**Our adaptation:**
- Public `<Container>` default: `max-w-7xl` (1280px) — already correct.
- Property detail: use `<Container size="lg">` (`max-w-6xl` = 1152px) for the main content column. The sticky reservation rail sits within this container as a 2-col grid. The photo gallery remains full-bleed.
- `<Container size="full">` (`max-w-[1440px]`) reserved for editorial hero bands.
- **Implementation note:** Do not create ad-hoc `max-w-[1080px]` values — use the `size` prop.

### 6. Grid Column Reduction

**Airbnb principle:** Property cards drop from 4-up (desktop) → 2-up (tablet) → 1-up (mobile). Never reflow rows; always reduce columns.

**Our adaptation:**
- Standardize all search/listing grids to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (or `lg:grid-cols-3` if 4-up is too dense for the content).
- Tablet (744–1024px) must never show a single-column grid for property results — ensure `sm:grid-cols-2` fires at 640px minimum.
- **Tag: PR-3** (search grid), **PR-5** (card normalization).

### 7. Mobile Filters Bottom Sheet

**Airbnb principle:** On mobile, filter UI collapses to a single tappable entry that opens a full-screen or bottom-sheet overlay.

**Our adaptation:**
- `SearchFilters.tsx` already renders in a `Sheet` — upgrade to a **bottom sheet** (Vaul drawer, `direction="bottom"`) with a **sticky "Apply (n results)" footer CTA** (≥44px, full-width, green primary).
- Filter chips on mobile: horizontal scroll strip, not wrapped grid.
- **Tag: PR-3**.

### 8. Side-Rail → Sticky Bottom Bar (property detail)

**Airbnb principle:** Reservation card flips from sticky right-rail (desktop) to sticky bottom bar (mobile) carrying just the primary CTA.

**Our adaptation:**
- `src/components/properties/blocks/MobileStickyBottomBar.tsx` already exists — verify it shows on mobile and hides on `lg:`.
- Ensure it carries price + primary CTA at ≥44px height, plus `.pb-safe`.
- The agent/enquiry card on desktop stays in the right rail (2-col layout: ~65% body + ~32% rail) and collapses to the sticky bar on mobile.
- **Tag: PR-4**.

### 9. 44–48px Touch Targets

**Airbnb principle:** Primary CTAs at 48px height minimum (above WCAG AAA). Search orb 48×48px.

**Our adaptation:**
- Button `xl` size: `h-11` (44px) as the minimum for public primary CTAs.
- Button `2xl` size: `h-12` (48px) for hero/search CTAs where visual weight matters.
- `[data-slot="button"]` coarse-pointer rule already in `globals.css` (`min-height: 44px`) — but `button.tsx` never defines `h-11` or `h-12` sizes so the coarse rule applies over the explicit `h-9` (36px), which means layout-shift on coarse devices. Explicit sizes will prevent this.
- **Tag: PR-1**.

### 10. 48px CTA / 56px Hero Input as Reference Points

**Airbnb principle:** `button-primary` = 48px; `text-input` = 56px (generous, touch-first).

**Our observation:** Our `input.tsx` already passes the 16px floor and the 44px coarse-pointer floor. The 56px Airbnb input height is aspirational — we use `h-10` (40px) by default which is below 44px for coarse at base size. The `@media (pointer: coarse)` rule heals this to 44px minimum. Consider 48px for prominent search/hero inputs (hero postcode, property search bar).

---

## Reject (Airbnb brand — not applicable)

| Element | Why rejected |
|---------|-------------|
| **Airbnb Cereal VF** | Proprietary custom typeface — cannot be licensed. We use Plus Jakarta Sans + Inter. |
| **Rausch (#ff385c)** | Airbnb's brand color — would conflict entirely with our deep green brand identity. |
| **Airbnb Luxe / Plus sub-brands** | Not applicable to a property marketplace context. |
| **Star ratings in ink (#222)** | Our ratings use semantic colors (gold/yellow). Ink stars are an Airbnb-specific design decision reflecting their brand restraint with color. |
| **Airbnb navigation patterns** (Homes / Experiences / Services) | UK property context needs a different information architecture. |
| **Pill-shaped search bar at 64px height** | Our search bar fits our design language. The pill shape and 64px height are Airbnb-specific. We use our existing search input patterns. |
| **White canvas only (no dark mode)** | Airbnb has no public dark mode. We keep dark mode for dashboard users. |
| **Airbnb copy, "Guest favorite" badge** | Brand copy — not applicable. |

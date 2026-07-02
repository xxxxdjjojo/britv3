# Responsive System — Conventions

One system, zero per-page hacks. Every rule here is enforced either by CSS in
`src/app/globals.css`, by a shared primitive, or by a guard test. Mobile-first:
base styles are the phone layout; enhance upward with `sm:`/`md:`/`lg:`/`xl:`.
320/360/390/414/640/768/1024/1280/1440 are **test viewports**, not design
targets — design fluidly between them.

## Type scale

Fluid tokens live in the `@theme` block of `globals.css` and generate Tailwind
utilities (Tailwind v4 — the CSS file *is* the config):

| Utility        | Value                                     | Use for |
|----------------|-------------------------------------------|---------|
| `text-display` | `clamp(2.25rem, 1.35rem + 3.8vw, 4.5rem)` | Hero headlines |
| `text-h1`      | `clamp(1.875rem, 1.4rem + 2vw, 3rem)`     | Page titles |
| `text-h2`      | `clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem)`  | Section headings |
| `text-h3`      | `clamp(1.25rem, 1.1rem + 0.65vw, 1.625rem)` | Card/subsection headings |
| `text-body-lg` | `clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)` | Lede/intro copy |

Adopt these when touching a surface; do not mass-replace existing headings in
unrelated diffs. **16px floor:** body text stays ≥16px (`text-base`); never set
a form control below 16px at mobile widths (iOS auto-zoom) — the pattern is
`text-base md:text-sm`, locked by
`src/__tests__/responsive/form-control-sizing.test.ts`.

## Spacing

- Horizontal page padding: `px-4 sm:px-6 lg:px-8` (built into
  `components/responsive/Container.tsx` — prefer the component).
- Vertical section rhythm: `py-8 sm:py-12 lg:py-16` (hero/major sections may
  step to `py-12 sm:py-16 lg:py-24`). Pick a step, don't invent values.
- Grid/stack gaps: `gap-4 sm:gap-6` for card grids; `gap-2`/`gap-3` inside
  components.

## Containers

- Content pages: `<Container>` (`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`
  by default; `size` prop for narrower shells).
- Full-bleed surfaces (maps, hero media): no container; the map pages own the
  viewport (`h-[calc(100dvh-…)]` — always `dvh`/`svh`, never `vh`; mobile
  browser chrome collapses).

## Card grids

Convention: **explicit column counts** — `grid grid-cols-1 sm:grid-cols-2
lg:grid-cols-3 gap-4 sm:gap-6` (step to `xl:grid-cols-3`/`lg:grid-cols-4` only
on very wide list surfaces). Why explicit over `auto-fit/minmax`: with known
columns per breakpoint, `next/image` `sizes` attributes are exact
(`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`) — with `auto-fit`
the rendered width is unknowable and mobile devices fetch oversized images.

## Container queries

Use `@container` on the grid wrapper + `@sm:`/`@md:` variants inside a card
**only when one component genuinely renders in containers of different widths**
(e.g. a shared card in both a full-width search grid and a narrow dashboard
rail). As of Phase 0 the property card has five separate implementations
(search, landlord, dashboard-saved, agent listings, landing) — none is
multi-context, so no container queries are in use yet. If those cards are ever
consolidated, the shared card adapts via container queries, not viewport
breakpoints.

## Touch

- 44×44 minimum targets. `@media (pointer: coarse)` in `globals.css` enforces
  `min-height: 44px` on `[data-slot="button"|"input"|"textarea"|"select-trigger"]`
  (button also gets `min-width`). Custom interactive elements must meet the
  floor themselves — pad the hit area (`p-*`, or the `.touch-target` utility),
  don't inflate the visual.
- Nothing may be gated behind hover. Pair `group-hover:` reveals with
  `group-focus-within:` and always-visible-on-coarse
  (see `settings/AvatarUploader.tsx` for the pattern).
- Every interactive element keeps a visible `focus-visible:` state.
- Fixed/sticky bottom elements use `.pb-safe` (safe-area-inset-bottom).

## Verification

`scripts/responsive-audit.mjs` (not CI-wired) scans routes × 9 viewports for
per-element horizontal overflow, sub-44px tap targets, and sub-16px form
controls. `body { overflow-x: hidden }` masks page-level overflow — always
audit per-element. Run against a dev server:
`node scripts/responsive-audit.mjs --base http://localhost:3170`.

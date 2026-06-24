# Design: `/search/map` postcode popup + type-only filter, and `/area-prices` polish

Date: 2026-06-24
Status: Approved (design)
Branch: `feat/map-ui`

Three queued UI changes across the public price-map surfaces. Changes 1 and 2
ship together (PR A, same surface); change 3 ships separately (PR B, visual).

## Change 1 — Postcode popup on `/search/map` (click → on-map price card)

**Goal:** clicking a choropleth area shows that area's Flat/House median prices
in a popup anchored at the click point, in addition to the existing right-hand
detail panel (the panel stays).

**Data source (decided): reuse the area card already fetched.** A click already
fires `onAreaSelect(props)` and `useMarketAreaCard` already loads the area's
Flat/House bands for the side panel. No reverse-geocoding, no new endpoint, no
second source of truth. The popup renders the same `MarketMapPriceCard`.

**Seam:**
- `MarketMap` owns the MapLibre `<Popup>` (it must be a child of `<MapGL>`). It
  already renders a hover tooltip popup and a `SoldParcelPopup`.
- Extend the click callback so the Explorer learns the click anchor:
  `onAreaSelect?(props, anchor?: { longitude: number; latitude: number })`.
  Existing callers that ignore the second arg keep working.
- Add one optional prop to `MarketMap`:
  `areaPopup?: { longitude: number; latitude: number; children: ReactNode } | null`.
  `MarketMap` renders `{areaPopup && <Popup ...>{areaPopup.children}</Popup>}`.
- The `Explorer` stores the anchor in state on select, and builds
  `areaPopup = selectedArea && anchor ? { ...anchor, children: <MarketMapPriceCard
  card={areaCard} areaName={...} isLoading={areaCardLoading} /> } : null`.
- Popup `onClose` clears the selection (`handleAreaSelect(null)`), which also
  clears the anchor.

**Scope notes:**
- Choropleth zoom (`< 14`) only. At street zoom the `SoldParcelPopup` already
  owns clicks; the area popup does not apply there.
- Desktop affordance. Mobile uses the existing bottom sheet; no popup on mobile
  (popups are cramped on small screens and the sheet already shows the card).

**Tests:** unit test that the Explorer passes a non-null `areaPopup` with the
card once an area is selected with an anchor, and null after close. Reuse the
existing maplibre mock.

## Change 2 — Slim `/search/map` filters to Property Type only

`MarketMapFilters` renders **only** the Property Type chip group + Apply button.
Remove the Date Window section, the Metric box (already static/disabled), and the
Scale toggle.

- The map query still needs a window + scale. The Explorer keeps its existing
  values (default 24 months, `national`) as fixed, no longer user-facing.
- Remove now-dead props from `MarketMapFilters` (`months`, `scaleMode`,
  `onMonthsChange`, `onScaleModeChange`) and the now-unused Explorer handlers
  (`handleMonthsChange`, `handleScaleModeChange`) if nothing else references them.
- The scale-indicator footer copy becomes a static statement (colours compared
  across the country) rather than implying a toggle.

**Tests:** update `MarketMapFilters` tests — assert Property Type chips render
and select; assert Date Window / Scale controls are gone.

## Change 3 — Stitch redesign of `/area-prices` (polish current structure)

Keep the structure (search hero → Flat/House cards + map) and behaviour
(autocomplete via `/api/address/autocomplete`, resolve via `/api/address/resolve`,
`market_map_postcode_card` via `/api/market-map/postcode-card`, empty/error/invalid
states, methodology note). Elevate the visual design:

- Stronger editorial type hierarchy and intentional spacing rhythm.
- Depth/layering (surfaces, shadows) instead of a flat layout.
- Refined green brand system: deep `#1B4D3E` + brand greens. **No blue, no
  rainbow** (public-side brand policy).
- Designed hover/focus/active states.

**Process:** generate in Stitch, screenshot for sign-off, then port the winner to
`AreaPricesExplorer.tsx` (+ `copy.ts` if copy changes), preserving all data wiring
and accessibility (combobox roles, labels). Visual-regression screenshots at 375 /
768 / 1440 before opening the PR.

## Delivery

- **PR A:** changes 1 + 2 (`feat/map-ui`).
- **PR B:** change 3 (`/area-prices` redesign) — separate branch off updated main.
- Each PR: `pnpm lint` clean, `pnpm build` exit 0, relevant tests green,
  `pnpm check:migrations` (n/a — no migrations), screenshots.

## Out of scope (YAGNI)

- Reverse-geocoding map clicks to postcodes.
- Removing the right-hand detail panel.
- Any change to the underlying RPCs / data layer.
- Mobile popup (kept on the existing sheet).

# Market map: remove on-map popups, reroute everything to the side panel

**Date:** 2026-06-29
**Route:** `/search/map` (and `/search/market-map/[areaId]`, same `MarketMapExplorer`)
**Branch:** `feat/map-panel-no-popups`

## Problem

The price map renders three on-map MapLibre `<Popup>`s:

1. **Hover tooltip** (`MarketMapTooltip`) — follows the cursor on every `onMouseMove`
   over a coloured area. This is the "extremely annoying" popup.
2. **Area click popup** (`MarketMapPriceCard` via `areaPopup`) — anchored price card
   on area click. Duplicates content already shown in the right-hand panel.
3. **Sold-parcel click popup** (`SoldParcelPopup`) — sale detail on parcel click at
   street zoom.

## Goal

Nothing pops up over the map. All detail lives in the side panel. The panel gains a
**Sales / Rent** tab strip so the structure is ready for rent data (which does not
exist yet — see "Rent data" below).

## Behaviour

- **Hover:** does nothing. Map shows only choropleth + sold-parcel fill + legends.
- **Click an area:** side panel "Sales" tab shows that area's price card + detail
  (unchanged content, no longer mirrored on the map).
- **Click a sold parcel** (street zoom): side panel "Sales" tab shows the sale detail
  (address, price, £/m², sale history) with a "Back" control. Mutually exclusive with
  area selection — selecting one clears the other.
- **Any map selection forces the Sales tab active**, so a click is never swallowed
  while the Rent tab is showing.
- **Rent tab:** an honest empty state — "Rental price data is coming soon: average
  private rents by area, sourced from ONS & the VOA." No fabricated numbers.

## Components

### `MarketMap.tsx` (behavioural change)
- Delete all three `<Popup>` blocks.
- Remove imports: `Popup`, `MarketMapTooltip`, `ReactNode`. Keep `SoldParcel` type.
- Remove hover plumbing: `TooltipState`, `tooltip` state, `handleMouseMove`,
  `handleMouseLeave`, and `onMouseMove`/`onMouseLeave` on `<MapGL>`.
- Remove `areaPopup` prop from `MarketMapProps` + destructure.
- Replace local `soldPopup` state with a new prop:
  `onParcelSelect?: (parcel: SoldParcel | null) => void`, fired from `handleClick`
  (parcel branch calls `onParcelSelect(parcel)`; clicking empty space / an area calls
  `onParcelSelect(null)` so the parent can clear parcel selection).
- `SOLD_FILL_LAYER_ID` stays in `interactiveLayerIds`. `resolveProperties` unchanged.

### `MarketMapExplorer.tsx`
- New local state: `activeTab: "sales" | "rent"` (default `"sales"`),
  `selectedParcel: SoldParcel | null`.
- New `handleParcelSelect(parcel)`: set `selectedParcel`, clear `selectedArea` +
  `area_id` URL param, force `activeTab = "sales"`.
- `handleAreaSelect`: also clears `selectedParcel`; forces `activeTab = "sales"` on a
  non-null selection.
- Remove `areaAnchor` state (only the popup used it) and `areaPopup` object + prop.
- Add a sticky **Sales / Rent** tab strip under the search header in BOTH the desktop
  `rightPanel` and the mobile drawer body.
- Sales tab body = existing list/area modes **plus** a new parcel-detail mode
  (`selectedParcel` → `SoldParcelDetail` + Back). Precedence: parcel > area > list.
- Rent tab body = `MarketMapRentPanel`.

### `SoldParcelDetail.tsx` (renamed from `SoldParcelPopup.tsx`)
- Same content, now a panel component. No popup chrome to change (already a `div`).
- Rename test `SoldParcelPopup.test.tsx` → `SoldParcelDetail.test.tsx`.

### `MarketMapRentPanel.tsx` (new)
- Rent empty state. Brand-green, matches panel styling. Cites ONS/VOA as the planned
  source. No data, no fake figures.

### Deleted orphan
- `MarketMapTooltip.tsx` + `MarketMapTooltip.test.tsx`.

## Kept untouched

Choropleth, sold-parcel coloured layer, both legends, granularity badge, search,
filters, area list, `MarketMapPriceCard` (also used by `/area-prices`),
`parseSoldParcelProperties`.

## Rent data (answer to "if you could find a way")

No rent data exists in the app (no table/view/RPC; only individual user-entered
`listings.price` with near-zero coverage). It **is** obtainable from two free,
OGL-licensed sources, but only down to **local-authority** level (coarser than the
street-level sold choropleth):

- **ONS Price Index of Private Rents (PIPR)** — average private rent by local
  authority, monthly.
- **VOA Private Rental Market Statistics** — median/mean rent by bedroom count per
  local authority / Broad Rental Market Area.

Building a real rent layer is a separate workstream paralleling the sold pipeline:
ingest script → `rental_stats` table → `market_map_rent_*` RPC → rent choropleth +
populated Rent tab. Out of scope here; the tab scaffold is the hook for it.

## Verification

- TDD: tests for parcel → panel routing, area/parcel mutual exclusion, tab switching,
  and selection forcing the Sales tab.
- `pnpm lint` (0 errors), `pnpm build` (exit 0), affected tests pass.
- Manual on `/search/map?property_type=flat`: no popups on hover or click; area click
  fills the Sales panel; parcel click fills the Sales panel with Back; Rent tab shows
  the empty state; mobile drawer has both tabs.

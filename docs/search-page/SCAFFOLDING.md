# Search Page — Scaffolding & Architecture

Rebuild of `/search` to the Google Stitch design **"Search — Hemnet Style with Right Filters"**
(Stitch project `15021896094385971092`, screen `e65e29737cb64d34bb6a57ddde1ed497`).
Reference assets: `reference/stitch-target.png` (design), `reference/stitch-code.html`
(structure only — not production code), `reference/impl-desktop-1440.png`,
`reference/impl-mobile-390.png` (the implemented page).

## Route & component tree

- Route: `src/app/(main)/search/page.tsx` — `"use client"`, wrapped in Suspense.
  The shared `<Header/>` + `<Footer/>` come from `src/app/(main)/layout.tsx` and are
  **not** modified (the Stitch "Invisible Estate" nav is design reference only).
- Body (two columns under the shared header):
  - **Left (`flex-1`)**: `SearchMap` (always-on, top) → results header + sort → list of
    `PropertySearchCard`.
  - **Right (`lg:w-[420px]` sticky aside)**: `RefineFilters` (location, property type,
    price, living area, bedrooms, must-haves, Search, Clear All) → a "Need a hand?"
    advisor card linking to `/agents`.

```
search/page.tsx
├── SearchMap                         components/search/SearchMap.tsx   (MapLibre + OSM fallback)
├── results header + Sort <select>
├── PropertySearchCard[]              components/search/PropertySearchCard.tsx
│   ├── SaveButton                    components/properties/SaveButton.tsx  (favourites)
│   └── LocalSupportChips             components/search/LocalSupportChips.tsx
└── RefineFilters                     components/search/RefineFilters.tsx
lib/search/url-state.ts               URL <-> filter state (serialize/parse/restore)
lib/search/card-model.ts             listing -> card view-model (honest fallbacks)
```

## Reused (not rebuilt)

| Concern | Source |
|---|---|
| Header / Footer / Breadcrumbs | `src/app/(main)/layout.tsx`, `components/layout/*` |
| Listing query + mock fallback | `src/app/(main)/search/actions.ts` (`searchProperties`, `search_live_data` flag) |
| Favourites (DB-backed, auth redirect) | `components/properties/SaveButton.tsx` + `hooks/useSavedProperties` |
| Map renderer | MapLibre GL + MapTiler (`NEXT_PUBLIC_MAPTILER_API_KEY`) |
| Provider directory | `/services/tradespeople?category=` and `/marketplace` (`/api/providers/*`) |
| Nav/footer routes | `src/config/navigation.ts` |

## Data flow

- **Listings**: `searchProperties(filters)` server action → `search_listings` materialized
  view when `NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA=true`, else the `MOCK_PROPERTIES`
  fallback (current default). Filters (price, type, beds, sqft, sort) are applied in the
  query; the page debounces filter changes and re-queries.
- **URL state**: `lib/search/url-state.ts` serialises location `q`, `type`, `minPrice`,
  `maxPrice`, `beds`, `propertyType[]`, `mustHaves[]`, `minSqft`, `maxSqft`, `sort`,
  `view`, `page` to the query string via `router.replace`; restored on load/refresh/back.
- **Map**: markers built from listing coordinates, keyed by stable listing id; card hover
  selects the matching marker (`selectedId`) and centres it; missing coordinates are
  filtered out without crashing. Deterministic e2e probes: `data-testid="search-map-status"`
  (`loading|loaded|empty|error`) and `data-testid="visible-map-marker-count"`.
- **Providers ("Local Support")**: `LocalSupportChips` link to the real
  `/services/tradespeople?category={enum}&postcode={listing postcode}` directory. No
  per-listing provider relationship exists in the schema, so these are honest
  category→directory links (spec Option A), never fabricated specific assignments.
- **Agent**: no per-listing agent is present in the mock/search dataset, so the card shows
  a "View listing agents" link to the real `/agents` directory rather than a fabricated name.

## Map resilience (recoverable error state)

`SearchMap` initialises with the MapTiler streets style when a key is present. If the key is
absent or rejected (e.g. origin-restricted → HTTP 403, as on localhost), the first map
`error` switches once to a **keyless OSM raster base** (same MapLibre renderer, no second map
library) so the area shows a real map instead of a dead box. A final "Retry" overlay covers
the case where even the fallback fails.

## Dependencies

No new runtime dependencies. MapLibre GL, MapTiler, Base UI tooltip, lucide-react, Next.js
App Router, Supabase — all already present.

## Deferred (documented, not built)

- **Area Insights** panel + "View Full Report" (Stitch right sidebar) — out of scope per
  product owner; the page omits it rather than showing placeholder stats.
- **Sold-price overlay** (Hemnet `salda/bostader` "for sale + sold price") — a later
  enhancement that will reuse the market-map sold-price data.
- **Live listings**: `search_live_data` is currently `false` (mock listings); the data path
  is wired and flips on by env when the seeded dataset is pointed at.

## Risks / notes

- MapTiler key is origin-restricted; the OSM fallback covers local/dev. Production uses the
  allowed key (streets tiles).
- Headless screenshot proof requires WebGL — use Playwright with SwiftShader
  (`--use-gl=angle --use-angle=swiftshader`), not the gstack browse daemon.

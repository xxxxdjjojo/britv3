# Search Page — Interaction Matrix

Every visible interactive element on `/search`, its behaviour, destination/action, and
state. Status legend: **Functional** / **Deferred (documented)** / **Reused (shared)**.
No element is an unexplained dead control.

## Header / Footer (shared `(main)` layout — not modified)
| Element | Behaviour | Destination | Status |
|---|---|---|---|
| Logo, Buy/Rent/Services/Tools/Advice/List, Sign In, List Property | Shared nav | Real routes via `config/navigation.ts` (validated by `configured-route-targets`/`navigation` tests) | Reused |
| Footer columns (Properties/Services/Tools/Company/Legal/Popular Areas) | Shared footer | Real routes | Reused |

## Map area (left, top)
| Element | Behaviour | Destination / action | States |
|---|---|---|---|
| Live map | MapLibre; markers from listing coords | — | `search-map-status`: loading→loaded; OSM fallback on key/403; empty when 0 markers; error overlay + Retry |
| "{Area}: N results" pill | Shows real result count | — | reflects `properties.length` |
| Expand Map Area | Opens map view | `/search?...&view=map` (preserves filters) | Functional |
| Full Map View (FAB) | Opens map view | `/search?...&view=map` | Functional |
| Satellite / Fullscreen / Zoom | Map controls | — | Functional |
| Property marker | Selects/centres matching card | card sync via `selectedId` | Functional |
| `visible-map-marker-count` | Deterministic e2e probe | — | integer marker count |

## Results area (left)
| Element | Behaviour | Destination / action | States |
|---|---|---|---|
| Sort `<select>` | Newest / Price asc / Price desc / Most popular | re-queries `searchProperties`, updates URL `sort` | Functional |
| Card image / title | Open property detail | `/properties/{slug}` (non-link when no slug) | Functional |
| Favourite heart | Save/unsave listing | `SaveButton` → `saved_properties`; redirects to `/login?redirectTo=` when signed out | Reused/Functional |
| Beds/Baths/Sqft | Display | honest fallbacks: "Price on application", "Floor area unavailable", "Image unavailable" | Functional |
| Verified badge | Renders only when `verified === true` | — | never fabricated |
| Listing Agent → "View listing agents" | Open agents directory | `/agents` | Functional (honest — no fake names) |
| Local Support chips (Plumber, Electrician) | Open filtered trades directory | `/marketplace?category={enum}&postcode={postcode}` | Functional (Option A) |

## Refine filters (right aside)
| Element | Behaviour | Wired through | Status |
|---|---|---|---|
| Location input | Sets area `q` | URL `q` → query | Functional |
| Property Type chips (Detached/Semi/Terraced/Flat/Bungalow) | Toggle type filter | URL `propertyType[]` → `searchProperties` (PROPERTY_TYPE_MAP → DB enum) | Functional |
| Price Range min/max | Numeric bounds | URL `minPrice`/`maxPrice` → `gte/lte price` | Functional |
| Living Area (sqft) min/max | Numeric bounds | URL `minSqft`/`maxSqft` → query | Functional |
| Min Bedrooms (Any/1+…5+) | Min beds | URL `beds` → `gte bedrooms` | Functional |
| Must-haves (Garden/Parking/Garage/Chain Free) | Toggle | URL `mustHaves[]` | Functional |
| Search button | Apply filters | re-query + URL update | Functional |
| Clear All Filters | Reset to defaults | clears URL params | Functional |
| "Speak to a local estate agent" → Contact Office | Open agents directory | `/agents` | Functional (honest) |

## Deferred (shown as omitted, not as placeholder)
| Element | Status |
|---|---|
| {Area} Insights (Avg Listing / Market Speed / View Full Report) | Deferred — omitted entirely (no placeholder stats) |
| Sold-price overlay | Deferred — future market-map integration |

## Link integrity
Grep over the changed files confirms **no `href="#"`, no `javascript:void(0)`, no empty
href**. Every chip/link/button resolves to a real route or performs a real state action.
Verified at runtime: 0 hydration errors, 0 app console errors (third-party PostHog/MapTiler
auth 404/401 excluded).

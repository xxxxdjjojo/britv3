# Search Page — Stitch Gap Audit & Visual Comparison

Target: `reference/stitch-target.png` (Stitch "Search — Hemnet Style with Right Filters").
Implementation: `reference/impl-desktop-1440.png`, `reference/impl-mobile-390.png`.

## Section-by-section

| Stitch section | Implemented | Difference / decision |
|---|---|---|
| Fixed top nav (Buy/Rent/Sold/New Homes/Inspiration, List a Property, favourites, account) | Real app `<Header/>` (Buy/Rent/Services/Tools/Advice/List, Sign In, List Property) | **Intentional**: the shared header is the production design system; the Stitch nav is reference only. Changing it would alter every page and break route-target tests. |
| Live map at top of left column, "{Area}: N results" pill, Expand Map Area | Yes — `SearchMap` (MapLibre), real marker count pill, Expand Map Area → `view=map` | Stitch shows a static illustration; we render a real interactive map. |
| Results header "Properties in {area}" + "Found N matching results" + Sort | Yes | Real count; Sort re-queries (not just a label). |
| Horizontal cards: image-left, badges, favourite, title+price, beds/baths/sqft, Listing Agent, Local Support chips | Yes | Agent = honest "View listing agents" link (no fabricated names); Verified badge only when true. |
| Right 420px filter rail: Location, Property Type chips, Price, Living Area, Min Bedrooms, Amenities, primary button, Clear All | Yes | Primary button labelled "Search" (Stitch's Swedish "Hitta bostäder" replaced with product copy). |
| {Area} Insights (Avg Listing / Market Speed / View Full Report) | **Omitted** | Deferred per product owner — omitted rather than shown with placeholder stats. |
| Featured Advisor / Contact Office | "Need a hand?" card → `/agents` | Honest: no fabricated advisor name; links to the real agents directory. |
| Floating "Full Map View" | Yes → `view=map` | Functional. |
| Footer (Company/Legal/Social/Support) | Real app `<Footer/>` | Reused. |

## Copy corrections (Stitch placeholders not shipped)
- "Hitta bostäder" → "Search"; "Refine Your Sanctuary Search" → "Refine your search".
- "Oxfordshire: 1,248 Results", "£1.4M", "18 days", "Julianne Deville", "Thomas Miller" —
  all Stitch sample data; **none shipped**. Counts and listings are real query results.

## Visual parity
- Layout composition (map-at-top → results → right filter rail; horizontal cards) matches
  the Stitch target closely at 1440px.
- Palette: brand green `#1B4D3E` + gold `#fdcd74`, Plus Jakarta Sans / Inter — consistent
  with both Stitch tokens and the public brand-green policy (no blue).
- Mobile (390px): stacks filters → map → results; a responsive adaptation of the
  desktop-only Stitch screen.

## Accepted deviations
| Deviation | Reason |
|---|---|
| App header instead of Stitch "Invisible Estate" nav | Shared design system; out of scope to restyle |
| Area Insights omitted | Deferred scope |
| Map base may be OSM (dev) vs MapTiler streets (prod) | Key origin restriction; resilience fallback |
| Listing agent shown as directory link, not named person | No per-listing agent data; no fabrication |

## Verification evidence
- Playwright (SwiftShader WebGL): `search-map-status=loaded`, `visible-map-marker-count=8`,
  8 marker elements, 8 cards, **0 hydration errors, 0 unknown-prop warnings, 0 app console
  errors**.
- Unit/component: 380 files / 3218 tests pass.

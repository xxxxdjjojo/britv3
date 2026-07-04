# Top Properties — ranked list pages

Valuation-led "top list" surfaces: a homepage module, a hub at
`/top-properties`, and one indexable page per category at
`/top-properties/[slug]`. Inspired by the category (ranked property lists),
not by any competitor's design, copy, or data.

## Architecture

| Layer | File | Role |
|---|---|---|
| Config | `src/lib/top-properties/top-list-config.ts` | Single source of truth: slugs, copy, methodology, `minItemsToIndex` |
| Types | `src/lib/top-properties/types.ts` | Shared shapes, no server-only imports |
| Scoring | `src/lib/top-properties/top-list-scoring.ts` | Pure ranking (eligibility, order, reason strings) |
| Service | `src/services/top-properties/top-list-service.ts` | One batched listings fetch → candidates → benchmark attach → rank |
| SEO | `src/lib/seo/top-list-jsonld.ts` | ItemList JSON-LD + robots helper |
| Components | `src/components/top-properties/` | `TopListCard`, `RankedPropertyCard`, `RankingBadge`, `TopListMethodology`, `TopPropertiesSection`, `TopListAnalytics` |
| Pages | `src/app/(main)/top-properties/{page,\[slug\]/page}.tsx` | ISR 1h, `generateStaticParams` from config |

**Direct queries by design.** At the current listing volume (<100 active),
snapshot tables (`top_list_snapshots` / `top_list_items`) and a scheduled
refresh would be premature. The service is the seam where snapshotting slots
in later: swap `fetchCandidates()`'s data source without touching pages.

## Categories

Defined in `TOP_LIST_CATEGORIES`. Current set:

`below-local-benchmark` (valuation-led flagship), `best-price-per-square-foot`,
`strongest-buyer-interest`, `most-saved-homes`, `newly-listed-homes`,
`largest-homes`, `most-expensive-homes`, `biggest-price-drops`,
`top-homes-in-london`.

Adding a category = adding one config entry. Pages, sitemap, homepage,
cross-links, and structured data all read from the config; the link-integrity
test (`src/__tests__/top-properties/top-list-links.test.tsx`) guards the wiring.

## Honesty & data rules

- **Every list is sale-only** and drawn from `status = active`,
  `deleted_at IS NULL` listings; the service defensively re-checks both.
- **Missing data excludes, never estimates.** No floor area → not on the
  £/sqft or largest lists. No saves → not on most-saved. No genuine price
  reduction → never on price drops.
- **Valuation signal is real**: asking price vs the HM Land Registry median
  from `market_map_postcode_card` (via `getPostcodeCard`, deduped per
  postcode, Redis-cached underneath). Confidence `Insufficient` → excluded.
  Copy says "below the local benchmark", never "undervalued".
- **Methodology is visible** on every page and states exactly what is
  counted (e.g. lifetime engagement totals — no invented 7-day windows).

## Thin-content protection

One gate drives everything: `minItemsToIndex` (5).

- Below it: page renders with a graceful empty/therin state, gets
  `robots: noindex, follow`, is left out of the sitemap, and is hidden from
  the hub and homepage module.
- At/above it: indexable, in the sitemap
  (`getIndexableTopListSlugs()`), visible everywhere.

So `biggest-price-drops` ships dark today (no reductions in the data) and
activates itself the moment real reductions exist.

## SEO

- Unique H1 / meta title / description / intro per category (config).
- Canonicals: `/top-properties` and `/top-properties/<slug>`.
- JSON-LD: `BreadcrumbList` on both page types; `ItemList` on category pages
  built from **exactly the rendered items** (never hidden ones), serialised
  through `safeJsonLd()`.
- Route is in `PUBLIC_ROUTES` (proxy) and linked from the footer
  ("Properties" column) so it is not an orphan.

## Analytics (PostHog via `trackEvent`)

| Event | Where |
|---|---|
| `homepage_top_list_view` | Homepage module mount |
| `homepage_top_list_click` | Any link click inside the homepage module |
| `top_properties_page_view` | Hub (`page: "hub"`) and category (`page: "list"`, `category`) |
| `top_property_card_click` | Hub card link clicks |
| `property_detail_click_from_top_list` | Category-page property clicks (with `category`, `rank`) |

`top_list_filter_change` is reserved — no filters at launch (each list is one
focused query); wire it when filters land.

## Tests

`src/__tests__/top-properties/` — config invariants, scoring, service
(mocked Supabase), JSON-LD/robots, and link integrity (routes exist, every
CTA/property/cross link resolves, route is public, footer links the hub).

## Manual QA

1. Homepage → "Top Properties" section renders with real listings.
2. Click each card → category page loads, ranked homes link to
   `/properties/<slug>`.
3. View source on a category page → title, meta description, canonical,
   two JSON-LD blocks; thin categories carry `noindex`.
4. `/sitemap.xml` → contains `/top-properties` + only indexable slugs.
5. Mobile 375px → single-column cards, no overflow.

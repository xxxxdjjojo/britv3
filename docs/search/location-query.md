# Property search — the location query (`q`)

How a renter/buyer's typed location ("Manchester", "M14", "EC1V 9HL") becomes a
filtered result set, and the roadmap for hardening it on live data.

## The bug this fixed

Three independent breaks made "type a town/postcode and nothing comes up":

1. **The homepage hero "search bar" was a dead `<Link>`** wrapping a `<span>`
   placeholder — there was no `<input>`, so you literally could not type. It
   navigated to `/search` with no query. (`renter-tools` had the same dead-CTA
   shape.)
2. **On `/search`, the Location box round-tripped `q` correctly** (input →
   `state.q` → `?q=` URL → `searchProperties(filters)`) **but `filters.q` was
   never read** by either the mock path or the live Supabase query. It was
   silently dropped: the heading said "Properties in London" while the results
   ignored the word.
3. **A correct geocode stack existed but was orphaned** (`SearchBar.tsx`,
   `/api/geocode`, `useGeocode`, `query-builder.ts`'s `.textSearch`) — wired to
   nothing the user touches.

## How it works now

```
HomeSearchBar (hero / renter-tools)            RefineFilters "Location" box
  type → /search?type=<buy|rent>&q=<location>     type → state.q → ?q=<location>
                         \                        /
                          ▼                      ▼
                 app/(main)/search/page.tsx  →  toSearchFilters()
                          ▼
              searchProperties(filters)  ── actions.ts
                ├─ mock path:  locationHaystack(p) = `${address} ${city} ${postcode}`
                │              every whitespace term must be a substring (case-insensitive)
                └─ live path:  per-term  .or(city.ilike / postcode.ilike / address_line1.ilike)
```

### `q` semantics (both paths)

- **Location-only.** Matches address + city + postcode. Deliberately *narrower*
  than the separate `keywords` filter (which also spans type/furnishing/
  amenities) so a town or postcode resolves to places, not features.
- **Partial-postcode tolerant.** `"M14"` matches `"M14 6FS"`; `"EC1V"` matches
  `"EC1V 9HL"`.
- **Multi-term AND.** `"EC1V 9HL"` → both terms must appear, so a full postcode
  with a space still matches.
- **Case-insensitive.** `"manchester"` == `"Manchester"`.
- **Empty/whitespace narrows nothing.**
- **Live path safety:** each term is sanitised to alphanumerics before being
  placed in the PostgREST `.or()` grammar (comma/parenthesis/dot-delimited).

`HomeSearchBar` (`src/components/search/HomeSearchBar.tsx`) is the one reusable
input: Buy/Rent tabs on the hero (`showTabs`), rent-scoped (`defaultType="rent"`,
`showTabs={false}`) on renter surfaces.

## Permanent-fix roadmap (proposed)

The text-match above makes search work on the current (mock + MV) data today.
The following hardening steps are the durable end-state:

1. **Live full-text / trigram index.** When the `search_listings` MV is
   refreshed, add a `description_tsv` (already referenced by the orphaned
   `query-builder.ts`) or `pg_trgm` GIN index on `city`/`postcode`/
   `address_line1`, and switch the live `q` path from chained `.ilike` to a
   single ranked `.textSearch` for relevance ordering.
2. **Wire the geocode/radius stack for true "near me" search.** The built-and-
   tested `SearchBar.tsx` → `useGeocode` → `/api/geocode` (postcodes.io) →
   `search_listings_by_radius` RPC path resolves a postcode to lat/lng + radius.
   Activate it **only on live data** (the mock path has no radius RPC, so wiring
   it onto mock data would be another silent no-op). Surface it as an optional
   "within N miles" mode alongside the text box.
3. **Consolidate duplicate geocoders.** `services/search/geocode-service.ts` and
   `services/geocoding/postcodes-io.ts` both wrap postcodes.io — collapse to one.
4. **Delete or adopt `SearchBar.tsx`.** It is currently imported nowhere; either
   wire it into `/search` (step 2) or remove it so the codebase has one search
   entry component.

## Tests

- `src/__tests__/search/filters.test.ts` — `q` location filtering on the mock
  path (town, partial postcode, full postcode, case-insensitivity, no-match,
  empty, composition with `type=rent`).
- `src/__tests__/home/hero-search.test.tsx` — `HomeSearchBar` renders a real
  input and navigates to `/search?type=&q=` (hero + rent-scoped variants).

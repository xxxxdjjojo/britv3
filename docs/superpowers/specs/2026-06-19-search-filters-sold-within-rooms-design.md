# Search Filters — Sold-Within (Land Registry) + Min/Max Bedrooms

**Date:** 2026-06-19
**Status:** Approved
**Surface:** `/search` (main map + filter panel)
**Component owner:** `src/components/search/RefineFilters.tsx`

---

## Overview

Add two filters to the search-map filter panel:

1. **Sold within the last few** — single-select radio group with options `3 months`, `6 months`, `12 months`, `Show all`. Default `Show all`. Filters listings by their property's most recent HM Land Registry sale date.
2. **Bedrooms** — replace the current single "Min Bedrooms" `<select>` with a paired Min–Max dropdown matching the layout in the reference mockup.

These ship together because (a) they touch the same filter component, the same `SearchState` type, and the same `searchProperties` query and (b) ship-as-a-whole completion is the team policy.

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Sold-within data source | New typed sidecar table `property_last_sold` joined into `search_listings` materialized view | Keeps Land Registry concerns isolated from the listings schema; allows independent refresh; an indexed `date` column gives clean range queries |
| Backfill strategy | One-shot migration that reads `property_insights.data` (JSON blob) where `insight_type='land_registry'` and upserts the latest `date_of_transfer` | LR data already cached lazily on property-detail views; we extract what we have without re-hitting the LR API |
| Ongoing ingestion | Extend `land-registry-service.ts` to upsert `property_last_sold` on every LR fetch | Single write-path; future detail-page visits keep the table fresh |
| Coverage gap behavior | Listings with no cached LR data drop out when `soldWithin != 'all'` | `>= floor` excludes NULLs naturally; correct semantics ("no known sale in the window") |
| Coverage gap UX | Empty-state copy explicitly names the constraint: "We only show listings whose last sale is in the Land Registry." | User can correlate "fewer results" to the filter without thinking it's a bug |
| `NOW()` usage | Compute the date floor in the action layer; pass as a literal ISO string to the Supabase query | Dev-env memory: NOW() in indexed expressions broke local Supabase; staying out of that footgun keeps the `last_sold_date` index usable |
| Bedrooms label | "Bedrooms" (matches existing copy and the underlying `bedrooms` column) | Mockup says "Room" but the existing surface and data say "Bedrooms"; consistent within the product |
| Bedrooms Min > Max behavior | Silent clamp at commit (Max ← Min); no error UI | Matches the no-error tone of the existing draft → commit pattern; avoids interrupting users mid-adjustment |
| Min/Max control primitive | Native `<select>` (not the Base UI `<Select>` primitive) | Consistency with the rest of the filter section, which is all native; primitive adoption is a separate concern |
| URL backward compat | None — `?beds=` is removed cleanly, replaced by `?bedsMin=` and `?bedsMax=` | Search URLs are not a durable contract |
| Default values omitted from URL | `soldWithin=all`, `bedsMin=Any`, `bedsMax=Any` are not serialized | Matches existing `serializeSearchState` policy for `Any`/empty defaults |
| Section placement | Sold-within added **above** Price Range; Bedrooms keeps its current position | Sold-within is a property-economics filter and reads naturally next to price |

---

## Routes & Files

| Path | Change |
|---|---|
| `src/components/search/RefineFilters.tsx` | Add sold-within radio group; replace bedrooms `<select>` with Min/Max pair |
| `src/lib/search/url-state.ts` | `SearchState`: remove `beds`, add `soldWithin`, `bedsMin`, `bedsMax`; update `parseSearchState`/`serializeSearchState` |
| `src/app/(main)/search/actions.ts` | `searchProperties`: replace `gte("bedrooms", N)` with min/max range; add `gte("last_sold_date", floor)` when soldWithin ≠ all |
| `src/app/(main)/search/page.tsx` | Update any `beds` references to the new state shape |
| `src/lib/search/sold-within.ts` _(new)_ | `type SoldWithin`, `computeSoldSince(soldWithin, now)`, default constant |
| `src/server/land-registry/land-registry-service.ts` | After fetching LR data, upsert latest sale into `property_last_sold` |
| `supabase/migrations/<ts>_create_property_last_sold.sql` _(new)_ | Table + index |
| `supabase/migrations/<ts>_backfill_property_last_sold.sql` _(new)_ | Backfill from `property_insights` |
| `supabase/migrations/<ts>_search_listings_add_last_sold_date.sql` _(new)_ | Drop/recreate matview with `LEFT JOIN property_last_sold` |
| `src/__tests__/search/filters.test.ts` | New bedrooms (Min/Max combos) + soldWithin cases |
| `src/__tests__/search/url-state.test.ts` _(extend or create)_ | Round-trip parse/serialize for the three new fields |
| `src/__tests__/search/sold-within.test.ts` _(new)_ | `computeSoldSince` against a frozen clock |
| `src/__tests__/server/land-registry-service.test.ts` _(extend)_ | LR fetch writes to `property_last_sold` |

---

## UI Specification

### Sold-within section

Placement: directly above the Price Range section.

```
SOLD WITHIN THE LAST FEW            (11px uppercase, tracking-widest, text-neutral-500)
┌────────────────┐  ┌────────────────┐
│ ○ 3 months     │  │ ○ 6 months     │
└────────────────┘  └────────────────┘
┌────────────────┐  ┌────────────────┐
│ ○ 12 months    │  │ ● Show all     │
└────────────────┘  └────────────────┘
```

- Native `<input type="radio" name="refine-sold-within">`, one per option, wrapped in label cards.
- Selected card: `border-brand-primary`, radio inner dot filled `brand-primary`.
- Unselected: `border-neutral-200`, hover `border-neutral-300`.
- Container: `grid grid-cols-2 gap-2`.
- `Show all` is the default and the selected state when state is fresh.

### Bedrooms section

Replaces lines 164–183 of `RefineFilters.tsx`.

```
BEDROOMS                            (11px uppercase, tracking-widest, text-neutral-500)
┌─────────────┐  ─  ┌─────────────┐
│ Min      ▾  │     │ Max      ▾  │
└─────────────┘     └─────────────┘
```

- Single label `Bedrooms` (not "Min Bedrooms").
- Two native `<select>` controls side by side, separated by an em-dash glyph (`—`) for visual continuity with the mockup.
- Each `<select>` options: `Any, 1, 2, 3, 4, 5+`. Placeholder displayed by the unselected/`Any` option.
- Styling identical to the current single select (`h-11 w-full ... rounded-lg bg-neutral-50 px-3 ...`).
- Both controls share `BEDROOM_OPTIONS` (already defined; reuse as-is).

### Empty state copy

When the result list is empty and `soldWithin !== 'all'`, append a single explanatory line under the existing empty-state message:

> "Only listings whose last sale is in HM Land Registry can be filtered by date. Try **Show all** to see listings without a recorded sale."

The "Show all" word in bold is a button that resets `soldWithin` to `all`.

---

## URL State

### Type changes (`src/lib/search/url-state.ts`)

```ts
export type SoldWithin = '3m' | '6m' | '12m' | 'all';

export type SearchState = {
  listingType: ListingType;
  q: string;
  propertyType: string[];
  mustHaves: string[];
  minPrice: string;
  maxPrice: string;
  minSqft: string;
  maxSqft: string;
  bedsMin: string;       // was: beds
  bedsMax: string;       // new
  soldWithin: SoldWithin; // new
  sort: SortOption;
  view: ViewMode;
  page: number;
};

export const DEFAULT_SOLD_WITHIN: SoldWithin = 'all';
```

### URL params

| Param | Values | Omitted when |
|---|---|---|
| `bedsMin` | `Any`, `1`, `2`, `3`, `4`, `5+` | `Any` |
| `bedsMax` | `Any`, `1`, `2`, `3`, `4`, `5+` | `Any` |
| `soldWithin` | `3m`, `6m`, `12m`, `all` | `all` |

### `parseSearchState`

- Read `bedsMin`/`bedsMax` from search params; fall back to `'Any'` when absent or invalid (not in `BEDROOM_OPTIONS`).
- Read `soldWithin`; fall back to `'all'` when absent or invalid.
- The legacy `beds` param is **not** read.

### `serializeSearchState`

- Append `bedsMin` only if not `'Any'`.
- Append `bedsMax` only if not `'Any'`.
- Append `soldWithin` only if not `'all'`.

### Min > Max clamp

Applied in `RefineFilters.tsx` at the commit step, not in the draft state:

```ts
function clampBedrooms(min: string, max: string): { bedsMin: string; bedsMax: string } {
  if (min === 'Any' || max === 'Any') return { bedsMin: min, bedsMax: max };
  return rankBeds(min) > rankBeds(max)
    ? { bedsMin: min, bedsMax: min }
    : { bedsMin: min, bedsMax: max };
}
```

`rankBeds` maps `'1' → 1, ..., '5+' → 5`.

---

## Data Layer

### Table: `property_last_sold`

```sql
create table public.property_last_sold (
  property_id uuid primary key references public.properties(id) on delete cascade,
  last_sold_date date not null,
  source text not null default 'hmlr',
  updated_at timestamptz not null default now()
);

create index property_last_sold_date_idx
  on public.property_last_sold (last_sold_date desc);
```

- RLS: enable; policy `select using (true)` (read-only, public-derived data; no PII).
- No service-role write policy needed beyond the existing definer-context inserts from `land-registry-service`.

### Backfill migration

Read `property_insights.data` where `insight_type = 'land_registry'`. The JSON shape (verified against `land-registry-service.ts`) contains an array of transactions; pick the maximum `date_of_transfer`:

```sql
insert into public.property_last_sold (property_id, last_sold_date, source)
select
  pi.property_id,
  max( (txn->>'date_of_transfer')::date ) as last_sold_date,
  'hmlr'
from public.property_insights pi,
     jsonb_array_elements(pi.data -> 'transactions') as txn
where pi.insight_type = 'land_registry'
  and pi.data ? 'transactions'
group by pi.property_id
on conflict (property_id) do update
  set last_sold_date = excluded.last_sold_date,
      updated_at = now()
where excluded.last_sold_date > public.property_last_sold.last_sold_date;
```

**Verification step before running:** confirm the actual JSON shape of `property_insights.data` for `land_registry` rows. If the array key is `transactions` (assumed here), this works as-is. If different, adjust the path. The implementation plan must include this verification as a pre-migration check.

### `search_listings` materialized view

The current matview definition lives in the property-portal migration (per the exploration report). The change:

```sql
-- in the matview SELECT
LEFT JOIN public.property_last_sold pls ON pls.property_id = l.property_id
-- expose
pls.last_sold_date as last_sold_date
```

A standard `drop materialized view ... cascade` + `create materialized view ...` will be used in the migration. Re-grant `select` to whatever roles already had it, and re-create any dependent indexes (re-grep the original definition for index `create` statements).

### `land-registry-service.ts` extension

After a successful LR fetch in the service:

```ts
const latestSale = extractLatestSaleDate(landRegistryResponse);
if (latestSale) {
  await supabaseAdmin
    .from('property_last_sold')
    .upsert(
      { property_id, last_sold_date: latestSale, source: 'hmlr' },
      { onConflict: 'property_id' },
    );
}
```

`extractLatestSaleDate` is a pure helper returning ISO date or null. No throw on missing data — LR sometimes returns empty arrays.

---

## Query Changes

### `searchProperties` in `src/app/(main)/search/actions.ts`

**Bedrooms (replace existing `gte("bedrooms", N)`):**

```ts
const minRank = state.bedsMin === 'Any' ? null : rankBeds(state.bedsMin);
const maxRank = state.bedsMax === 'Any' ? null : rankBeds(state.bedsMax);
if (minRank !== null) query = query.gte('bedrooms', minRank);
if (maxRank !== null) query = query.lte('bedrooms', maxRank);
```

Note: `5+` is treated as 5 for both bounds. Listings with `bedrooms = 6, 7, ...` are included by a Min of `5+`, and excluded by a Max of `5+` only if they exceed 5. The existing behavior treats `5+` as ≥ 5 for min; preserve that. For max, `5+` means "5 or more" → no upper bound applied. Implementation:

```ts
if (maxRank !== null && state.bedsMax !== '5+') query = query.lte('bedrooms', maxRank);
```

**Sold-within (new):**

```ts
const floor = computeSoldSince(state.soldWithin); // null when 'all'
if (floor) query = query.gte('last_sold_date', floor);
```

### `src/lib/search/sold-within.ts` _(new)_

```ts
export type SoldWithin = '3m' | '6m' | '12m' | 'all';
export const DEFAULT_SOLD_WITHIN: SoldWithin = 'all';

const MONTHS: Record<Exclude<SoldWithin, 'all'>, number> = {
  '3m': 3, '6m': 6, '12m': 12,
};

export function computeSoldSince(value: SoldWithin, now = new Date()): string | null {
  if (value === 'all') return null;
  const months = MONTHS[value];
  const floor = new Date(now);
  floor.setUTCMonth(floor.getUTCMonth() - months);
  return floor.toISOString().slice(0, 10); // YYYY-MM-DD
}
```

UTC-based, year-rollover safe, returns date-only string. No `NOW()` reaches the DB.

---

## Tests

### `src/__tests__/search/filters.test.ts` — add

- Bedrooms: Any/Any → no bedroom filter applied
- Bedrooms: `bedsMin='2'`, `bedsMax='Any'` → only `gte` applied
- Bedrooms: `bedsMin='Any'`, `bedsMax='3'` → only `lte` applied
- Bedrooms: `bedsMin='2'`, `bedsMax='4'` → both applied, correct bounds
- Bedrooms: `bedsMax='5+'` → no upper bound applied
- Bedrooms: clamp helper — Min > Max returns `{bedsMin, bedsMax: bedsMin}`
- SoldWithin: `all` → no `last_sold_date` filter
- SoldWithin: `3m`, `6m`, `12m` → `gte('last_sold_date', <floor>)` with correct ISO date (use `vi.setSystemTime`)

### `src/__tests__/search/url-state.test.ts` — add or extend

- Round-trip with all defaults: `bedsMin`, `bedsMax`, `soldWithin` not present in URL
- Round-trip with non-defaults: each shows up in URL
- Invalid values fall back to defaults (`bedsMin=banana` → `Any`; `soldWithin=foo` → `all`)
- Legacy `?beds=2` is ignored (not migrated)

### `src/__tests__/search/sold-within.test.ts` — new

- `computeSoldSince('all', now)` → null
- `computeSoldSince('3m', new Date('2026-06-19T12:00:00Z'))` → `'2026-03-19'`
- Year-rollover: `computeSoldSince('12m', new Date('2026-01-15T00:00:00Z'))` → `'2025-01-15'`

### `src/__tests__/server/land-registry-service.test.ts` — extend

- After a fetched response with a non-empty `transactions` array, `property_last_sold` upsert is called with the **maximum** `date_of_transfer`.
- Empty `transactions` array → no upsert; no throw.

---

## Migration Sequence

1. **Verify JSON shape** of `property_insights.data` for at least 3 `land_registry` rows in dev. Adjust the backfill JSON path if the array key isn't `transactions`.
2. Apply `create_property_last_sold` migration.
3. Apply backfill migration. Spot-check 5 properties: cached LR data vs. backfilled `last_sold_date`.
4. Apply `search_listings_add_last_sold_date` migration. `REFRESH MATERIALIZED VIEW search_listings;`.
5. Land code + UI in the same commit batch as a single feature increment.
6. Smoke-test on dev: each `soldWithin` value, Min/Max bedrooms combinations, URL state round-trip via direct URL input.
7. Push to dev Supabase via `supabase db push` (per the manual flow in `supabase/migrations/README.md`; migrate.yml retired in Phase 5).

---

## Scope Exclusions

- **No automatic LR fetch for all listings.** Coverage is opportunistic — what's already cached, plus future detail-page visits. A background ETL to eager-populate LR data is a separate spec.
- **No `?beds=` migration shim.** Old links break their bedroom filter.
- **No upgrade to the Base UI `<Select>` primitive.** Native `<select>` stays.
- **No change to sort options.** "Most recently sold" is not added.

---

## Verification — "Done" Definition

- [ ] Sold-within radio group renders, 4 options, "Show all" selected by default.
- [ ] Selecting an option updates URL `?soldWithin=` and re-runs the search.
- [ ] Bedrooms Min/Max dropdowns render side by side under one "Bedrooms" label.
- [ ] Setting Min > Max clamps Max ↑ on commit.
- [ ] Each non-default state appears in the URL; defaults are omitted.
- [ ] `searchProperties` builds the right `gte/lte` clauses for every combination.
- [ ] `property_last_sold` exists and is backfilled.
- [ ] `search_listings` view exposes `last_sold_date`.
- [ ] Filtering by `3m`/`6m`/`12m` excludes listings without LR data; empty-state copy explains why.
- [ ] All new tests pass; full test suite green; full build green.
- [ ] Visual check on `/search`: filter panel reads as intentional, matches green token policy, no blue creep.

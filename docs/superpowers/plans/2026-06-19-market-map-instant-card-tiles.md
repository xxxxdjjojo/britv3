# Market-map Instant Card + Tiled Choropleth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the market-map address→price card instant and split it Flat vs House, and replace the per-viewport GeoJSON choropleth with cached `ST_AsMVT` vector tiles — extending the existing `market_map_*` stack.

**Architecture:** Phase 1 adds a `'house'` rollup + baked 9-bucket national colour index to the existing `market_map_area_stats` precompute, a fast `market_map_area_card` RPC read straight from it, and wires search-result select to render the card + `flyTo` in parallel. Phase 2 serves `ST_AsMVT` tiles from `market_map_area_stats ⋈ geography_boundaries`, cached immutably at the Vercel edge keyed by a data-version, coloured client-side from the baked bucket.

**Tech Stack:** Supabase Postgres (PostGIS, plpgsql), Next.js 16 App Router route handlers, `@vis.gl/react-maplibre` + MapLibre GL, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-19-market-map-instant-card-tiles-design.md`

**Worktree:** `/Users/jojominime/Documents/britv3main/wt-market-map-card`, branch `feat/market-map-instant-card` (off `origin/main`).

**Shared facts for every task:**
- DB connection for migrations/verify: `SUPABASE_DB_URL` from `.env.local` (TLS cert `scripts/certs/supabase-prod-ca-2021.crt`). Run heavy statements with `set statement_timeout=0;`.
- Create migrations with `supabase migration new <desc>` (full 14-digit prefix). `pnpm check:migrations` must stay green.
- `colourForBucket(b)` / `INSUFFICIENT_COLOUR` live in `src/lib/market-map/colour.ts`; buckets are **1..9** (N = 9).
- `geographyLevelForZoom(z)` in `src/lib/market-map/geography.ts`: `<7` local_authority, `<10` postcode_district, `<13` msoa, `<16` lsoa, `≥16` street.
- The precompute table + `refresh_market_map_area_stats()` live in `supabase/migrations/20260619000001_market_map_precompute.sql`. Refreshing the whole table takes ~17 min; run it in the background.
- Gate before any PR: `pnpm lint` (no NEW errors — pre-existing debt in unrelated files is out of scope), `pnpm build`, `pnpm test`, `pnpm check:migrations`.

---

## PHASE 1 — Instant Flat/House card

### Task 1: `'house'` rollup + baked `bucket` + `market_map_meta`

**Files:**
- Create: `supabase/migrations/<new>_market_map_house_rollup_buckets.sql`
- Reference (do not edit): `supabase/migrations/20260619000001_market_map_precompute.sql`

- [ ] **Step 1: Create the migration file**

```bash
cd /Users/jojominime/Documents/britv3main/wt-market-map-card
supabase migration new market_map_house_rollup_buckets
```

- [ ] **Step 2: Write the migration**

The migration must:
1. `alter table public.market_map_area_stats add column if not exists bucket smallint;`
2. `create table if not exists public.market_map_meta (id boolean primary key default true, data_version text not null, check (id)); ` plus seed one row.
3. `create or replace function public.refresh_market_map_area_stats()` — copy the existing body and ADD, inside each `(level, window)` iteration after the existing GROUPING SETS insert, a second insert for `'house'`:

```sql
-- house rollup: own percentile over D/S/T (NOT derived from all/flat)
insert into public.market_map_area_stats (
  geography_level, area_id, area_name, property_type, window_months,
  median_price_pence, p10_price_pence, p90_price_pence,
  transaction_count, latest_transaction_date, property_type_mix)
with keyed as (
  select g.price_pence, g.transfer_date,
    case v_level when 'local_authority' then g.lad_cd
      when 'postcode_district' then g.postcode_district
      when 'msoa' then g.msoa_cd when 'lsoa' then g.lsoa_cd end as grp_id,
    case v_level when 'local_authority' then g.lad_name
      when 'postcode_district' then g.postcode_district
      when 'msoa' then g.msoa_cd when 'lsoa' then g.lsoa_cd end as grp_name
  from public.ppd_with_geography g
  where g.transfer_date >= (current_date - make_interval(months => v_window))
    and g.property_type in ('D','S','T'))
select v_level, grp_id, (array_agg(grp_name) filter (where grp_name is not null))[1],
  'house', v_window,
  percentile_cont(0.5) within group (order by price_pence)::bigint,
  percentile_cont(0.1) within group (order by price_pence)::bigint,
  percentile_cont(0.9) within group (order by price_pence)::bigint,
  count(*)::bigint, max(transfer_date), '{}'::jsonb
from keyed where grp_id is not null and grp_id <> '' group by grp_id;
```

4. After both loops, a final bucket pass + version stamp:

```sql
update public.market_map_area_stats s set bucket = b.nt
from (select geography_level, area_id, property_type, window_months,
        ntile(9) over (partition by geography_level, property_type, window_months
                       order by median_price_pence) as nt
      from public.market_map_area_stats where transaction_count >= 5) b
where s.geography_level=b.geography_level and s.area_id=b.area_id
  and s.property_type=b.property_type and s.window_months=b.window_months;

update public.market_map_meta set data_version = to_char(clock_timestamp(),'YYYYMMDD"T"HH24MISS') where id;
```

Keep `set statement_timeout = 0` and `security definer` on the function (as in the original).

- [ ] **Step 3: Apply the migration**

```bash
export DBURL=$(grep -E '^SUPABASE_DB_URL=' .env.local | head -1 | sed -E 's/^SUPABASE_DB_URL=//' | tr -d '"' | sed -E 's/[[:space:]].*$//')
psql "$DBURL" -v ON_ERROR_STOP=1 -f supabase/migrations/<new>_market_map_house_rollup_buckets.sql
```
Expected: `ALTER TABLE`, `CREATE TABLE`, `CREATE FUNCTION`.

- [ ] **Step 4: Refresh (background, ~17 min) then verify**

```bash
psql "$DBURL" -c "set statement_timeout=0;" -c "select public.refresh_market_map_area_stats();"
psql "$DBURL" -tA -c "select property_type, count(*) from public.market_map_area_stats group by 1 order by 1;"
```
Expected: rows include `house`; every property_type present. Spot-check a house median:
```bash
psql "$DBURL" -tA -c "select median_price_pence, transaction_count, bucket from public.market_map_area_stats where geography_level='lsoa' and property_type='house' and window_months=12 limit 1;"
```
Expected: non-null median, `bucket` in 1..9.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(market-map): house rollup + baked national buckets + data_version

Rollback: drop column market_map_area_stats.bucket, drop table market_map_meta,
re-apply 20260619000001 to restore the prior refresh body."
```

`check:migrations` verify: `pnpm check:migrations` → all version tokens unique.

---

### Task 2: `market_map_area_card` RPC + service + API route + hook

**Files:**
- Create: `supabase/migrations/<new>_market_map_area_card.sql`
- Modify: `src/services/market-map/area-detail-service.ts` (add `getAreaCard`)
- Create: `src/app/api/market-map/card/route.ts`
- Create: `src/hooks/useMarketAreaCard.ts`
- Test: `src/services/market-map/area-card.test.ts`

- [ ] **Step 1: Migration — the RPC**

```sql
create or replace function public.market_map_area_card(
  p_level text, p_area_id text, p_window int default 12)
returns jsonb language sql stable security invoker as $$
  select jsonb_build_object(
    'flat',  to_jsonb(f) - 'geography_level' - 'area_id' - 'window_months' - 'property_type',
    'house', to_jsonb(h) - 'geography_level' - 'area_id' - 'window_months' - 'property_type')
  from (select median_price_pence, p10_price_pence, p90_price_pence,
          transaction_count, latest_transaction_date
        from public.market_map_area_stats
        where geography_level=p_level and area_id=p_area_id
          and property_type='flat' and window_months=p_window) f
  full join (select median_price_pence, p10_price_pence, p90_price_pence,
          transaction_count, latest_transaction_date
        from public.market_map_area_stats
        where geography_level=p_level and area_id=p_area_id
          and property_type='house' and window_months=p_window) h on true;
$$;
grant execute on function public.market_map_area_card(text,text,int) to anon, authenticated, service_role;
```
Apply with psql (as Task 1 Step 3). **Verify p95 + no scan:**
```bash
psql "$DBURL" -c "explain (analyze,buffers) select public.market_map_area_card('lsoa','E01000001',12);"
```
Expected: index/seq-scan on `market_map_area_stats` only; **no `ppd_with_geography`**; total time <150ms.

- [ ] **Step 2: Write failing service test** — `src/services/market-map/area-card.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { buildAreaCard } from "./area-detail-service";

describe("buildAreaCard", () => {
  it("maps flat/house pence rows to card shape", () => {
    const raw = { flat: { median_price_pence: 40000000, p10_price_pence: 30000000, p90_price_pence: 55000000, transaction_count: 42, latest_transaction_date: "2026-05-01" }, house: { median_price_pence: 70000000, p10_price_pence: 50000000, p90_price_pence: 95000000, transaction_count: 8, latest_transaction_date: "2026-04-01" } };
    const card = buildAreaCard(raw);
    expect(card.flat.median).toBe(400000);
    expect(card.flat.confidence).toBe("High");
    expect(card.house.confidence).toBe("Low");
  });
  it("flags insufficient when count 0/null", () => {
    const card = buildAreaCard({ flat: { transaction_count: 0 }, house: null });
    expect(card.flat.insufficient).toBe(true);
    expect(card.house.insufficient).toBe(true);
  });
});
```
Run: `pnpm test src/services/market-map/area-card.test.ts` → FAIL (`buildAreaCard` not exported).

- [ ] **Step 3: Implement `buildAreaCard` + `getAreaCard`** in `area-detail-service.ts`

`buildAreaCard(raw)` → `{ flat: Series, house: Series }` where `Series = { median, p10, p90, count, latestDate, confidence, insufficient }`. `median = Math.round(pence/100)` (null→null). `insufficient = !count`. `confidence = confidenceFor(count)` (import from `@/lib/market-map/confidence`). `getAreaCard(level, areaId, window=12)` calls `createAdminClient().rpc("market_map_area_card", { p_level, p_area_id, p_window })`, on error logs + returns both-insufficient, else `buildAreaCard(data)`.

Run: `pnpm test src/services/market-map/area-card.test.ts` → PASS.

- [ ] **Step 4: API route** `src/app/api/market-map/card/route.ts` — GET, Zod-validate `level` (enum GEOGRAPHY_LEVELS), `area_id` (string), `window` (default 12); call `getAreaCard`; return JSON; `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`. Mirror the shape/error handling of `src/app/api/market-map/route.ts`.

- [ ] **Step 5: Hook** `src/hooks/useMarketAreaCard.ts` — TanStack Query, `queryKey: ["market-area-card", level, areaId, window]`, fetch `/api/market-map/card?...`, enabled when `areaId` set. Mirror `useMarketAreaDetail.ts`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/ src/services/market-map/area-detail-service.ts src/services/market-map/area-card.test.ts src/app/api/market-map/card/ src/hooks/useMarketAreaCard.ts
git commit -m "feat(market-map): instant area-card RPC + service + route + hook

Rollback: drop function market_map_area_card; remove card route/hook/test and
the getAreaCard/buildAreaCard exports."
```

---

### Task 3: Card component + wire search→card+flyTo (parallel)

**Files:**
- Create: `src/components/market-map/MarketMapPriceCard.tsx`
- Test: `src/components/market-map/MarketMapPriceCard.test.tsx`
- Modify: `src/components/market-map/MarketMapExplorer.tsx` (`handleAreaSelect`)

- [ ] **Step 1: Failing component test** — render `MarketMapPriceCard` with a high-confidence flat series and assert it shows the £ median, the p10–p90 range, and the right number of confidence dots; with `insufficient` assert it shows "Insufficient sales" and NOT "£0".

Run: `pnpm test src/components/market-map/MarketMapPriceCard.test.tsx` → FAIL.

- [ ] **Step 2: Implement `MarketMapPriceCard`** — props `{ card: { flat, house }, areaName }`. Two rows (Flat, House), each: label, `£{median.toLocaleString()}` (or "Insufficient sales" when `insufficient`), `£{p10}–£{p90}` range, and a confidence dot index (map `confidence` → filled dots out of 3: High=3, Medium=2, Low=1, Insufficient=0). Public brand tokens only (`brand-primary`, no hardcoded `#1B4D3E`). Run test → PASS.

- [ ] **Step 3: Wire into `MarketMapExplorer.tsx`** — in `handleAreaSelect`, replace the `useMarketAreaDetail`-driven path for the headline card with `useMarketAreaCard(level, areaId, 12)`; render `<MarketMapPriceCard>`. On select, fire the card query AND `map.flyTo({center, zoom: default_zoom})` independently (the card render must not await the flyTo). Keep `useMarketAreaDetail` only if a separate "fresh drill-down" affordance exists; otherwise leave it unused-but-present (do not delete in this task).

- [ ] **Step 4: Verify in the browser** — `pnpm dev` (note CLAUDE.md dev-guard; use a free port if 3000 is taken), search a postcode → card shows Flat + House instantly while the map flies; a low-volume area shows "Insufficient sales".

- [ ] **Step 5: Commit**

```bash
git add src/components/market-map/MarketMapPriceCard.tsx src/components/market-map/MarketMapPriceCard.test.tsx src/components/market-map/MarketMapExplorer.tsx
git commit -m "feat(market-map): instant Flat/House price card wired to search + flyTo

Rollback: revert MarketMapExplorer handleAreaSelect to the area-detail card;
delete MarketMapPriceCard."
```

**Phase 1 gate:** `pnpm lint && pnpm build && pnpm test && pnpm check:migrations` green.

---

## PHASE 2 — `ST_AsMVT` tiled choropleth

### Task 4: `market_map_tile` RPC

**Files:** Create `supabase/migrations/<new>_market_map_tile.sql`

- [ ] **Step 1: Migration — the MVT function**

```sql
create or replace function public.market_map_tile(
  p_z int, p_x int, p_y int, p_property_type text default 'all', p_window int default 12)
returns bytea language sql stable security invoker as $$
  with lvl as (select case
      when p_z < 7 then 'local_authority' when p_z < 10 then 'postcode_district'
      when p_z < 13 then 'msoa' else 'lsoa' end as level),
  mvt as (
    select s.area_id, s.bucket, s.median_price_pence, s.transaction_count,
      ST_AsMVTGeom(ST_Transform(b.geometry::geometry, 3857),
        ST_TileEnvelope(p_z, p_x, p_y), 4096, 64, true) as geom
    from public.geography_boundaries b
    join lvl on b.level = lvl.level
    join public.market_map_area_stats s
      on s.geography_level = b.level and s.area_id = b.area_id
     and s.property_type = p_property_type and s.window_months = p_window
    where ST_Transform(b.geometry::geometry, 3857) && ST_TileEnvelope(p_z, p_x, p_y))
  select ST_AsMVT(mvt.*, 'areas') from mvt where geom is not null;
$$;
grant execute on function public.market_map_tile(int,int,int,text,int) to anon, authenticated, service_role;
```
Apply with psql. **Verify:**
```bash
psql "$DBURL" -tA -c "select octet_length(public.market_map_tile(6,31,20,'all',12));"
```
Expected: a positive byte length for a populated UK tile (0/null for an empty ocean tile is fine).

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(market-map): market_map_tile ST_AsMVT RPC (level-by-zoom, baked bucket)

Rollback: drop function market_map_tile."
```

---

### Task 5: Tiles API route + data-version cache

**Files:**
- Create: `src/app/api/market-map/tiles/[z]/[x]/[y]/route.ts`
- Modify: `src/services/market-map/` (small `getDataVersion()` reading `market_map_meta`, cached in Redis)

- [ ] **Step 1: Route** — parse z/x/y (ints), optional `property_type` (default `all`), `window` (default 12); call `market_map_tile` via admin client (`.rpc` returns the bytea base64 — decode to a Buffer); respond with the MVT bytes, `Content-Type: application/vnd.mapbox-vector-tile`, `Cache-Control: public, max-age=31536000, immutable`. The `data_version` is carried as a path/query segment so a new refresh yields new URLs; empty tiles → `204`.

- [ ] **Step 2: Verify** — `curl -s -o /tmp/t.mvt -w '%{http_code} %{size_download}\n' 'http://localhost:3000/api/market-map/tiles/6/31/20?v=<data_version>'` → 200 with non-zero size; repeat → served from cache.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/market-map/tiles/ src/services/market-map/
git commit -m "feat(market-map): MVT tiles route, immutable edge cache keyed by data_version

Rollback: remove the tiles route + getDataVersion helper."
```

---

### Task 6: Client vector source + bucket paint; remove national-domain call

**Files:**
- Modify: `src/components/market-map/MarketMap.tsx` (GeoJSON `<Source>` → vector)
- Modify: `src/hooks/useMarketMap.ts` and `src/services/market-map/market-map-service.ts` (drop the per-request national-domain aggregate)

- [ ] **Step 1: Replace the choropleth source** — swap the GeoJSON `<Source>`/`<Layer>` (the `TODO(pmtiles)` block at `MarketMap.tsx:300`) for `<Source type="vector" tiles={["/api/market-map/tiles/{z}/{x}/{y}?v=<dataVersion>"]} minzoom=4 maxzoom=16>` + a fill `Layer` with `source-layer="areas"`, `fill-color` = a `match`/`step` expression mapping `["get","bucket"]` 1..9 → `colourForBucket(1..9)`, null bucket → `INSUFFICIENT_COLOUR`. Pass `dataVersion` into the component (fetch once from a small `/api/market-map/version` route or embed at page load).

- [ ] **Step 2: Remove the redundant national-domain aggregate** — in `getMarketMapFeatures`/`market-map-service.ts` and `useMarketMap.ts`, delete the `scaleMode==="national"` extra `market_map_aggregate` call and the per-request colour-domain computation (buckets are baked now). Keep `market_map_features` only if still used for the hover popup; otherwise read popup stats from the tile feature props.

- [ ] **Step 3: Verify** — `pnpm dev`, open the map, pan/zoom: Network tab shows ONLY cached tile requests (no `/api/market-map` GeoJSON refetch); first paint <1s; choropleth colours match the previous output for a sample viewport.

- [ ] **Step 4: Commit**

```bash
git add src/components/market-map/MarketMap.tsx src/hooks/useMarketMap.ts src/services/market-map/market-map-service.ts
git commit -m "feat(market-map): vector-tile choropleth + baked-bucket paint; drop national-domain call

Rollback: restore the GeoJSON <Source> and the national-domain aggregate call."
```

**Phase 2 gate:** `pnpm lint && pnpm build && pnpm test && pnpm check:migrations` green; manual map verify passes.

---

## Final
After all tasks: dispatch a final whole-branch code review, then `superpowers:finishing-a-development-branch` → PR → squash-merge → delete branch + worktree. After merge + deploy, schedule `refresh_market_map_area_stats()` to run post-ingest (cron) so `data_version` rotates and tiles refresh.

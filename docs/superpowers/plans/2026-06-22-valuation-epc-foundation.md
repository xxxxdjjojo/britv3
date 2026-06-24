# Valuation EPC Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing BritEstate valuation and sold-parcel map by wiring EPC floor area into the comparable-sales engine, expanding measured validation segments, and rendering actual-sale parcel evidence with clearer house/flat cards.

**Architecture:** Extend the existing Next.js + Supabase/Postgres/PostGIS implementation. The valuation engine remains the production estimator; EPC/floor-area support is added as versioned comparable evidence and validated by the existing out-of-time backtest. The sold-parcel map continues to use `market_map_sold_parcels` and dynamic `ST_AsMVT`; no separate FastAPI, Vite, dbt, Docker, or Tippecanoe stack is introduced.

**Tech Stack:** TypeScript, Vitest, Playwright, Next.js App Router route handlers, Supabase Postgres/PostGIS migrations, MapLibre via `@vis.gl/react-maplibre`.

---

## Scope

This plan implements the next permanent slice of the pasted Phase 2/3 prompt:

- EPC/floor-area comparable evidence in the current valuation engine.
- Model-ready SQL view for PPD+EPC+UPRN feature provenance.
- Expanded backtest segmentation, without publishing new accuracy claims.
- Sold-parcel popup/card improvements using actual sales only.
- Link-render/screenshot proof for the value journey and sold-parcel map shell.

This plan does **not** train or deploy LightGBM/XGBoost. ML remains an offline experiment after the EPC-enriched feature table is populated and the comparable model has a measured baseline. This plan also does **not** color parcels from MSOA fallback £/sqft; fallback values must not look like actual parcel evidence.

## File Structure

Create:
- `supabase/migrations/<timestamp>_valuation_epc_feature_view.sql` — model-ready London-first PPD+EPC+UPRN feature view with provenance.
- `src/services/valuation/comparables-repo.test.ts` — pure mapper contract tests for EPC-enriched comparable rows.
- `e2e/valuation-market-map-links.spec.ts` — link-render and screenshot smoke tests for valuation and market-map surfaces.

Modify:
- `src/types/valuation.ts` — add optional comparable evidence fields if user-facing comparable rows expose them.
- `src/lib/valuation/constants.ts` — add version bump and floor-area weighting constants.
- `src/lib/valuation/weighting.ts` — add floor-area similarity factor.
- `src/lib/valuation/weighting.test.ts` — RED tests for floor-area weighting.
- `src/lib/valuation/engine.ts` — pass comparable `floorAreaSqm` into weighting and evidence rows.
- `src/lib/valuation/engine.test.ts` — RED tests proving floor-area affects estimate weighting.
- `src/services/valuation/comparables-repo.ts` — join EPC certificates and UPRN coordinates into comparable fetches; expose a pure mapper for tests.
- `src/services/valuation/backtest.integration.test.ts` — add EPC/area/London/property-family segmentation.
- `src/lib/market-map/sold-colour.ts` — derive actual-sale house/flat segment stats, confidence, and £/sqft formatting.
- `src/lib/market-map/sold-colour.test.ts` — RED tests for segment derivation and formatting.
- `src/components/market-map/SoldParcelPopup.tsx` — render MeilleursAgents-style house/flat sections from actual sales.
- `src/components/market-map/SoldParcelPopup.test.tsx` — RED tests for the new card, low confidence, no floor-area states.
- `supabase/migrations/<timestamp>_sold_parcels_confidence_floor.sql` — update sold-parcel materialisation so buckets only color statistically valid £/m² evidence.
- `docs/VALUATION_MODEL_VALIDATION.md` — update only after a real backtest run; otherwise add a clearly labelled “pending measured run” note.
- `docs/market-map-sold-parcels.md` — document house/flat segments and actual-sale-only styling.

## Task 1: Plan Commit And Baseline

**Files:**
- Create: `docs/superpowers/plans/2026-06-22-valuation-epc-foundation.md`

- [ ] **Step 1: Run focused baseline**

Run:
```bash
pnpm test src/lib/valuation/weighting.test.ts src/lib/valuation/engine.test.ts src/components/market-map/SoldParcelPopup.test.tsx src/lib/market-map/sold-colour.test.ts
```

Expected:
```text
Test Files  4 passed
Tests       36 passed
```

- [ ] **Step 2: Commit the plan**

Run:
```bash
git add docs/superpowers/plans/2026-06-22-valuation-epc-foundation.md
git commit -m "docs(valuation): plan EPC foundation and sold parcel evidence work"
```

Expected: one docs-only commit on `codex/valuation-epc-foundation`.

## Task 2: Floor-Area Weighting In The Pure Engine

**Files:**
- Modify: `src/lib/valuation/constants.ts`
- Modify: `src/lib/valuation/weighting.ts`
- Modify: `src/lib/valuation/weighting.test.ts`
- Modify: `src/lib/valuation/engine.ts`
- Modify: `src/lib/valuation/engine.test.ts`

- [ ] **Step 1: Write the failing weighting tests**

Append these cases to `src/lib/valuation/weighting.test.ts`:

```ts
import { floorAreaWeight } from "./weighting";

it("keeps floor-area weight neutral when either side lacks area", () => {
  expect(floorAreaWeight(null, 100)).toBe(1);
  expect(floorAreaWeight(100, null)).toBe(1);
  expect(floorAreaWeight(null, null)).toBe(1);
});

it("penalises comparables whose floor area is far from the subject", () => {
  const close = floorAreaWeight(100, 108);
  const far = floorAreaWeight(100, 160);
  expect(close).toBeGreaterThan(0.85);
  expect(far).toBeLessThan(0.25);
});
```

Run:
```bash
pnpm test src/lib/valuation/weighting.test.ts
```

Expected: FAIL because `floorAreaWeight` is not exported.

- [ ] **Step 2: Implement minimal weighting code**

Update `src/lib/valuation/constants.ts`:

```ts
/** Semantic version of the comparable model. Stored on every result for traceability. */
export const MODEL_VERSION = "vmp-comparables-1.2.0";

// --- Floor area weighting ----------------------------------------------------
/** Relative floor-area sigma. 0.20 means a 20% size miss is materially penalised. */
export const FLOOR_AREA_RELATIVE_SIGMA = 0.2;
```

Update `src/lib/valuation/weighting.ts`:

```ts
import {
  RECENCY_HALF_LIFE_MONTHS,
  DISTANCE_SCALE_M,
  NEUTRAL_DISTANCE_WEIGHT,
  HOUSE_TO_HOUSE_WEIGHT,
  CROSS_FAMILY_WEIGHT,
  BEDROOM_SIGMA,
  FLOOR_AREA_RELATIVE_SIGMA,
  TENURE_MISMATCH_WEIGHT,
  NEW_BUILD_MISMATCH_WEIGHT,
} from "./constants";

export function floorAreaWeight(subjectSqm: number | null, compSqm: number | null): number {
  if (subjectSqm === null || compSqm === null) return 1;
  if (subjectSqm <= 0 || compSqm <= 0) return 1;
  const relativeDiff = Math.abs(subjectSqm - compSqm) / subjectSqm;
  return Math.exp(-(relativeDiff * relativeDiff) / (2 * FLOOR_AREA_RELATIVE_SIGMA * FLOOR_AREA_RELATIVE_SIGMA));
}

export type WeightingComparable = Readonly<{
  propertyType: PpdPropertyType;
  tenure: Tenure;
  newBuild: boolean;
  bedrooms: number | null;
  floorAreaSqm: number | null;
  distanceMetres: number | null;
  monthsAgo: number;
}>;

export type WeightingSubject = Readonly<{
  propertyType: PpdPropertyType;
  tenure: Tenure;
  newBuild: boolean;
  bedrooms: number | null;
  floorAreaSqm: number | null;
}>;

export function similarityWeight(comp: WeightingComparable, subject: WeightingSubject): number {
  return (
    recencyWeight(comp.monthsAgo) *
    distanceWeight(comp.distanceMetres) *
    propertyTypeWeight(comp.propertyType, subject.propertyType) *
    bedroomWeight(comp.bedrooms, subject.bedrooms) *
    floorAreaWeight(subject.floorAreaSqm, comp.floorAreaSqm) *
    tenureWeight(comp.tenure, subject.tenure) *
    newBuildWeight(comp.newBuild, subject.newBuild)
  );
}
```

Run:
```bash
pnpm test src/lib/valuation/weighting.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write the failing engine test**

Append to `src/lib/valuation/engine.test.ts`:

```ts
it("prefers floor-area-matched comparables when subject floor area is known", () => {
  const areaSubject = { ...subject, floorAreaSqm: 100 };
  const candidates: RawComparable[] = [
    comp({ transactionId: "small", price: 420_000, saleDate: "2026-01-01", floorAreaSqm: 58 }),
    comp({ transactionId: "matched1", price: 610_000, saleDate: "2026-01-01", floorAreaSqm: 98 }),
    comp({ transactionId: "matched2", price: 620_000, saleDate: "2026-01-01", floorAreaSqm: 104 }),
  ];

  const r = valuate(areaSubject, candidates, OPTS);

  expect(r.estimatedValue).toBeGreaterThan(560_000);
  expect(r.comparableSales.find((c) => c.transactionId === "small")?.weight).toBeLessThan(
    r.comparableSales.find((c) => c.transactionId === "matched1")!.weight,
  );
});
```

Run:
```bash
pnpm test src/lib/valuation/engine.test.ts
```

Expected: FAIL because `RawComparable` and `ComparableSale` do not carry `floorAreaSqm`, and `valuate` does not pass it to weighting.

- [ ] **Step 4: Implement engine propagation**

Update `src/types/valuation.ts`:

```ts
export type ComparableSale = Readonly<{
  transactionId: string;
  price: number;
  adjustedPrice: number | null;
  saleDate: string;
  postcode: string;
  outwardCode: string;
  propertyType: PpdPropertyType;
  newBuild: boolean;
  tenure: Tenure;
  paon: string | null;
  saon: string | null;
  street: string | null;
  distanceMetres: number | null;
  weight: number;
  floorAreaSqm: number | null;
  epcRating: string | null;
  constructionAgeBand: string | null;
  uprn: string | null;
  matchConfidence: number | null;
}>;
```

Update `src/lib/valuation/engine.ts` `RawComparable`:

```ts
  floorAreaSqm?: number | null;
  epcRating?: string | null;
  constructionAgeBand?: string | null;
  uprn?: string | null;
  matchConfidence?: number | null;
```

Update the `similarityWeight` call:

```ts
        bedrooms: c.bedrooms ?? null,
        floorAreaSqm: c.floorAreaSqm ?? null,
        distanceMetres: c.distanceMetres,
```

and subject:

```ts
        bedrooms: subject.bedrooms,
        floorAreaSqm: subject.floorAreaSqm,
```

Update comparable sale mapping:

```ts
      floorAreaSqm: w.raw.floorAreaSqm ?? null,
      epcRating: w.raw.epcRating ?? null,
      constructionAgeBand: w.raw.constructionAgeBand ?? null,
      uprn: w.raw.uprn ?? null,
      matchConfidence: w.raw.matchConfidence ?? null,
```

Update test helper `comp()` in `src/lib/valuation/engine.test.ts`:

```ts
    floorAreaSqm: null,
    epcRating: null,
    constructionAgeBand: null,
    uprn: null,
    matchConfidence: null,
```

Run:
```bash
pnpm test src/lib/valuation/engine.test.ts src/lib/valuation/weighting.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/valuation/constants.ts src/lib/valuation/weighting.ts src/lib/valuation/weighting.test.ts src/lib/valuation/engine.ts src/lib/valuation/engine.test.ts src/types/valuation.ts
git commit -m "feat(valuation): weight comparables by EPC floor area"
```

## Task 3: EPC-Enriched Comparable Fetching

**Files:**
- Create: `src/services/valuation/comparables-repo.test.ts`
- Modify: `src/services/valuation/comparables-repo.ts`
- Modify: `src/services/valuation/valuation-service.ts`
- Modify: `src/services/valuation/valuation-service.integration.test.ts`

- [ ] **Step 1: Write the failing mapper test**

Create `src/services/valuation/comparables-repo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mapPpdRowToComparable } from "./comparables-repo";

describe("mapPpdRowToComparable", () => {
  it("maps EPC enrichment and provenance onto a RawComparable", () => {
    const c = mapPpdRowToComparable({
      transaction_id: "tx1",
      price: "500000",
      sale_date: "2025-12-01",
      postcode: "SW18 4QN",
      outward_code: "SW18",
      property_type: "T",
      old_new: "N",
      duration: "F",
      paon: "10",
      saon: null,
      street: "DUNTSHILL ROAD",
      district: "WANDSWORTH",
      ppd_category: "A",
      record_status: "A",
      epc_floor_area_sqm: "98.7",
      epc_rating: "C",
      epc_construction_age_band: "England and Wales: 1930-1949",
      epc_uprn: "123456789",
      epc_match_confidence: "0.9",
    });

    expect(c.floorAreaSqm).toBe(98.7);
    expect(c.epcRating).toBe("C");
    expect(c.constructionAgeBand).toBe("England and Wales: 1930-1949");
    expect(c.uprn).toBe("123456789");
    expect(c.matchConfidence).toBe(0.9);
  });
});
```

Run:
```bash
pnpm test src/services/valuation/comparables-repo.test.ts
```

Expected: FAIL because `mapPpdRowToComparable` is not exported and row fields do not exist.

- [ ] **Step 2: Implement mapper and SQL enrichment**

Update `PpdRow` in `src/services/valuation/comparables-repo.ts`:

```ts
  epc_floor_area_sqm: string | null;
  epc_rating: string | null;
  epc_construction_age_band: string | null;
  epc_uprn: string | null;
  epc_match_confidence: string | null;
```

Export the mapper:

```ts
function numOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapPpdRowToComparable(r: PpdRow): RawComparable {
  return {
    transactionId: r.transaction_id,
    price: Number(r.price),
    saleDate: r.sale_date,
    postcode: r.postcode ?? "",
    outwardCode: r.outward_code,
    propertyType: (["D", "S", "T", "F", "O"].includes(r.property_type) ? r.property_type : "O") as PpdPropertyType,
    newBuild: r.old_new === "Y",
    tenure: r.duration === "L" ? "L" : "F",
    paon: r.paon,
    saon: r.saon,
    street: r.street,
    district: r.district ?? null,
    distanceMetres: null,
    ppdCategory: r.ppd_category === "B" ? "B" : "A",
    recordStatus: (["A", "C", "D"].includes(r.record_status) ? r.record_status : "A") as "A" | "C" | "D",
    bedrooms: null,
    floorAreaSqm: numOrNull(r.epc_floor_area_sqm),
    epcRating: r.epc_rating,
    constructionAgeBand: r.epc_construction_age_band,
    uprn: r.epc_uprn,
    matchConfidence: numOrNull(r.epc_match_confidence),
  };
}
```

Replace `rows.map(rowToComparable)` with `rows.map(mapPpdRowToComparable)`.

Update the `fetchComparables` SELECT to left join EPC:

```sql
    SELECT pp.transaction_id, pp.price, pp.date_of_transfer::date::text AS sale_date,
           pp.postcode, pp.outward_code, pp.property_type, pp.old_new, pp.duration,
           pp.paon, pp.saon, pp.street, pp.district, pp.ppd_category, pp.record_status,
           e.total_floor_area::text AS epc_floor_area_sqm,
           e.current_energy_rating AS epc_rating,
           e.construction_age_band AS epc_construction_age_band,
           e.uprn AS epc_uprn,
           CASE WHEN e.uprn IS NOT NULL THEN '0.9' ELSE NULL END AS epc_match_confidence
    FROM public.price_paid_data pp
    LEFT JOIN LATERAL (
      SELECT e.total_floor_area, e.current_energy_rating, e.construction_age_band, e.uprn
      FROM public.epc_certificates e
      WHERE e.postcode = pp.postcode
        AND lower(e.paon) = lower(pp.paon)
      ORDER BY
        CASE WHEN pp.saon IS NOT NULL AND e.address1 IS NOT NULL
          AND position(lower(pp.saon) in lower(e.address1)) > 0 THEN 0 ELSE 1 END,
        e.inspection_date DESC NULLS LAST
      LIMIT 1
    ) e ON true
```

Use alias `pp.` in all existing `WHERE` and `ORDER BY` clauses.

Update `fetchSubjectPriorSale` SELECT with the same enrichment or explicit `NULL` columns so the mapper shape is stable.

Run:
```bash
pnpm test src/services/valuation/comparables-repo.test.ts
```

Expected: PASS.

- [ ] **Step 3: Update exact-prior comparable shape**

In `src/services/valuation/valuation-service.ts`, when building `exactPriorSale`, add:

```ts
        floorAreaSqm: prior.floorAreaSqm ?? null,
        epcRating: prior.epcRating ?? null,
        constructionAgeBand: prior.constructionAgeBand ?? null,
        uprn: prior.uprn ?? null,
        matchConfidence: prior.matchConfidence ?? null,
```

Run:
```bash
pnpm test src/services/valuation/comparables-repo.test.ts src/lib/valuation/engine.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/services/valuation/comparables-repo.ts src/services/valuation/comparables-repo.test.ts src/services/valuation/valuation-service.ts
git commit -m "feat(valuation): enrich comparables with EPC evidence"
```

## Task 4: Model-Ready EPC Feature View

**Files:**
- Create: `supabase/migrations/<timestamp>_valuation_epc_feature_view.sql`
- Create: `db-tests/valuation-epc-feature-view.test.ts`

- [ ] **Step 1: Write failing DB contract test**

Create `db-tests/valuation-epc-feature-view.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const EPC_MIGRATION = fileURLToPath(new URL("../supabase/migrations/20260619140000_epc_dataset.sql", import.meta.url));
const UPRN_MIGRATION = fileURLToPath(new URL("../supabase/migrations/20260620100100_os_open_uprn.sql", import.meta.url));
const FEATURE_MIGRATION = fileURLToPath(new URL("../supabase/migrations/<timestamp>_valuation_epc_feature_view.sql", import.meta.url));

const RUN = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("valuation_epc_feature_view migration", () => {
  let h: DbHarness;

  beforeAll(() => {
    h = startPostgres();
    applyPrerequisites(h);
    h.sql("create extension if not exists postgis;");
    h.sql(`
      create table public.price_paid_data (
        transaction_id text primary key,
        price bigint not null,
        date_of_transfer date not null,
        postcode text,
        outward_code text,
        property_type text,
        old_new text,
        duration text,
        paon text,
        saon text,
        street text,
        district text,
        ppd_category text,
        record_status text
      );
    `);
    h.sqlFile(EPC_MIGRATION);
    h.sqlFile(UPRN_MIGRATION);
    h.sqlFile(FEATURE_MIGRATION);
  });

  afterAll(() => h?.stop());

  it("joins PPD to EPC and UPRN with provenance fields", () => {
    h.sql(`insert into public.price_paid_data values
      ('tx1', 500000, date '2025-12-01', 'SW18 4QN', 'SW18', 'T', 'N', 'F', '10', null, 'DUNTSHILL ROAD', 'WANDSWORTH', 'A', 'A');`);
    h.sql(`insert into public.epc_certificates
      (certificate_number, property_key, uprn, postcode, paon, address1, total_floor_area, current_energy_rating, construction_age_band, inspection_date)
      values ('cert1', 'uprn:100', '100', 'SW18 4QN', '10', '10 DUNTSHILL ROAD', 98.5, 'C', 'England and Wales: 1930-1949', date '2025-01-01');`);
    h.sql(`insert into public.os_open_uprn (uprn, latitude, longitude) values (100, 51.45, -0.19);`);

    const row = h.sql(`select transaction_id || '|' || total_floor_area::text || '|' || epc_rating || '|' || match_method || '|' || has_uprn_point::text
      from public.valuation_ppd_epc_features where transaction_id='tx1';`);
    expect(row).toBe("tx1|98.5|C|postcode_paon|true");
  });
});
```

Run:
```bash
RUN_DB_TESTS=1 pnpm test:db db-tests/valuation-epc-feature-view.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 2: Create migration**

Create migration with:
```bash
supabase migration new valuation_epc_feature_view
```

Write:
```sql
create or replace view public.valuation_ppd_epc_features as
select
  pp.transaction_id,
  pp.date_of_transfer::date as sale_date,
  pp.price,
  pp.postcode,
  pp.outward_code,
  pp.property_type,
  pp.duration as tenure,
  pp.old_new as new_build_flag,
  pp.paon,
  pp.saon,
  pp.street,
  pp.district,
  e.uprn,
  e.total_floor_area,
  e.current_energy_rating as epc_rating,
  e.construction_age_band,
  ou.latitude,
  ou.longitude,
  case when e.certificate_number is not null then 'postcode_paon' else null end as match_method,
  case when e.certificate_number is not null then 0.9::numeric else null end as match_confidence,
  (e.total_floor_area is not null and e.total_floor_area > 0) as has_epc_area,
  (ou.uprn is not null) as has_uprn_point
from public.price_paid_data pp
left join lateral (
  select ec.*
  from public.epc_certificates ec
  where ec.postcode = pp.postcode
    and lower(ec.paon) = lower(pp.paon)
  order by
    case when pp.saon is not null and ec.address1 is not null
      and position(lower(pp.saon) in lower(ec.address1)) > 0 then 0 else 1 end,
    ec.inspection_date desc nulls last
  limit 1
) e on true
left join public.os_open_uprn ou
  on e.uprn ~ '^[0-9]+$' and ou.uprn = e.uprn::bigint
where coalesce(pp.ppd_category, 'A') = 'A'
  and coalesce(pp.record_status, 'A') <> 'D';

grant select on public.valuation_ppd_epc_features to anon, authenticated, service_role;
```

Run:
```bash
RUN_DB_TESTS=1 pnpm test:db db-tests/valuation-epc-feature-view.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:
```bash
git add supabase/migrations/*_valuation_epc_feature_view.sql db-tests/valuation-epc-feature-view.test.ts
git commit -m "feat(valuation): add EPC-enriched feature view"
```

## Task 5: Expanded Backtest Segmentation

**Files:**
- Modify: `src/services/valuation/backtest.integration.test.ts`

- [ ] **Step 1: Write failing segmentation assertions**

Update the `Eval` type:

```ts
  hasEpcArea: boolean;
  propertyFamily: string;
```

When pushing rows:

```ts
const hasEpcArea = r.comparableSales.some((c) => c.floorAreaSqm !== null);
```

Add report sections:

```ts
## EPC floor-area coverage
${groupTable(rows, (r) => (r.hasEpcArea ? "has EPC floor area" : "no EPC floor area"))}

## Property family
${groupTable(rows, (r) => r.propertyFamily)}
```

Run:
```bash
pnpm test src/services/valuation/backtest.integration.test.ts
```

Expected: PASS skipped unless `RUN_VALUATION_DB=1`; typecheck may FAIL until new fields are assigned.

- [ ] **Step 2: Implement segment assignment**

Add:

```ts
function family(type: PpdPropertyType): string {
  return type === "F" ? "flat" : ["D", "S", "T"].includes(type) ? "house" : "other";
}
```

When pushing `Eval`:

```ts
hasEpcArea,
propertyFamily: family(t.propertyType),
```

Run:
```bash
pnpm test src/services/valuation/backtest.integration.test.ts
pnpm typecheck
```

Expected: Vitest skip/pass; typecheck passes or only unrelated pre-existing errors are documented.

- [ ] **Step 3: Commit**

Run:
```bash
git add src/services/valuation/backtest.integration.test.ts
git commit -m "test(valuation): segment backtest by EPC area coverage"
```

## Task 6: Sold-Parcel Actual-Evidence Card

**Files:**
- Modify: `src/lib/market-map/sold-colour.ts`
- Modify: `src/lib/market-map/sold-colour.test.ts`
- Modify: `src/components/market-map/SoldParcelPopup.tsx`
- Modify: `src/components/market-map/SoldParcelPopup.test.tsx`

- [ ] **Step 1: Write failing segment/stat tests**

Append to `src/lib/market-map/sold-colour.test.ts`:

```ts
import { buildSoldSegments, formatPricePerSqft } from "./sold-colour";

it("builds separate actual-sale stats for flats and houses", () => {
  const parcel = parseSoldParcelProperties({
    inspire_id: "p1",
    bucket: 5,
    sale_count: 4,
    median_price_pence: 50000000,
    median_price_per_sqm_pence: 600000,
    dominant_property_type: "flat",
    latest_transfer_date: "2026-01-01",
    sales: JSON.stringify([
      { address: "Flat 1", date: "2026-01-01", price: 40000000, ppsqm: 700000, type: "flat", floor_area: 57, estimated_location: false },
      { address: "Flat 2", date: "2025-11-01", price: 42000000, ppsqm: 710000, type: "flat", floor_area: 59, estimated_location: false },
      { address: "10 Road", date: "2025-10-01", price: 80000000, ppsqm: 500000, type: "terraced", floor_area: 160, estimated_location: false },
    ]),
  })!;

  const segments = buildSoldSegments(parcel);
  expect(segments.flat.saleCount).toBe(2);
  expect(segments.house.saleCount).toBe(1);
  expect(segments.flat.medianPpsqmPence).toBe(705000);
  expect(segments.house.confidence).toBe("Low");
});

it("formats pence per square foot without pretending null exists", () => {
  expect(formatPricePerSqft(null)).toBeNull();
  expect(formatPricePerSqft(929030)).toBe("£863/ft²");
});
```

Run:
```bash
pnpm test src/lib/market-map/sold-colour.test.ts
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 2: Implement segment helpers**

Add to `src/lib/market-map/sold-colour.ts`:

```ts
export type SoldSegment = {
  label: "Flat" | "House";
  saleCount: number;
  medianPpsqmPence: number | null;
  p10PpsqmPence: number | null;
  p90PpsqmPence: number | null;
  latestDate: string | null;
  confidence: "High" | "Medium" | "Low" | "Insufficient";
};

const SQM_PER_SQFT = 0.09290304;

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function percentile(xs: number[], p: number): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor((s.length - 1) * p)));
  return s[idx];
}

function segmentConfidence(n: number): SoldSegment["confidence"] {
  if (n >= 10) return "High";
  if (n >= 3) return "Medium";
  if (n >= 1) return "Low";
  return "Insufficient";
}

function saleIsHouse(sale: SoldSale): boolean {
  return ["detached", "semi-detached", "terraced", "house"].includes(sale.type);
}

function buildSegment(label: "Flat" | "House", sales: SoldSale[]): SoldSegment {
  const pps = sales.map((s) => s.ppsqm).filter((n): n is number => n !== null);
  const latestDate = sales.map((s) => s.date).filter(Boolean).sort().at(-1) ?? null;
  return {
    label,
    saleCount: sales.length,
    medianPpsqmPence: median(pps),
    p10PpsqmPence: percentile(pps, 0.1),
    p90PpsqmPence: percentile(pps, 0.9),
    latestDate,
    confidence: segmentConfidence(sales.length),
  };
}

export function buildSoldSegments(parcel: SoldParcel): { flat: SoldSegment; house: SoldSegment } {
  return {
    flat: buildSegment("Flat", parcel.sales.filter((s) => s.type === "flat")),
    house: buildSegment("House", parcel.sales.filter(saleIsHouse)),
  };
}

export function formatPricePerSqft(ppsqmPence: number | null): string | null {
  if (ppsqmPence === null) return null;
  return `${formatPounds(Math.round(ppsqmPence * SQM_PER_SQFT))}/ft²`;
}
```

Run:
```bash
pnpm test src/lib/market-map/sold-colour.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write failing component tests**

Add to `src/components/market-map/SoldParcelPopup.test.tsx`:

```ts
it("renders house and flat evidence sections with confidence dots and actual-sale wording", () => {
  render(<SoldParcelPopup parcel={parcelWithFlatAndHouseSales} />);
  expect(screen.getByText("Actual sold-price evidence only")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Flat" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "House" })).toBeInTheDocument();
  expect(screen.getAllByLabelText(/Confidence/).length).toBeGreaterThanOrEqual(2);
});

it("does not show a £/ft² value when floor area is missing", () => {
  render(<SoldParcelPopup parcel={parcelWithoutFloorArea} />);
  expect(screen.getByText("Floor area unknown")).toBeInTheDocument();
  expect(screen.queryByText(/\/ft²/)).not.toBeInTheDocument();
});
```

Run:
```bash
pnpm test src/components/market-map/SoldParcelPopup.test.tsx
```

Expected: FAIL until the component is updated.

- [ ] **Step 4: Implement popup card**

Replace the old single/multi rendering with two segment cards:

```tsx
const DOTS = 5;
const CONFIDENCE_FILL = { High: 5, Medium: 3, Low: 1, Insufficient: 0 } as const;

function ConfidenceDots({ confidence }: Readonly<{ confidence: SoldSegment["confidence"] }>) {
  const filled = CONFIDENCE_FILL[confidence];
  return (
    <span className="inline-flex gap-0.5" aria-label={`Confidence ${filled} of ${DOTS}`}>
      {Array.from({ length: DOTS }, (_, i) => (
        <span key={i} className={i < filled ? "text-brand-primary" : "text-neutral-300"} aria-hidden="true">●</span>
      ))}
    </span>
  );
}
```

For each segment, show:

```tsx
<h3>Flat</h3>
<ConfidenceDots confidence={segment.confidence} />
<p>{segment.saleCount} actual sales</p>
<p>{formatPricePerSqm(segment.medianPpsqmPence)} · {formatPricePerSqft(segment.medianPpsqmPence)}</p>
<p>{formatPricePerSqm(segment.p10PpsqmPence)}–{formatPricePerSqm(segment.p90PpsqmPence)}</p>
```

When `medianPpsqmPence === null`, render:

```tsx
<p>Floor area unknown</p>
```

Run:
```bash
pnpm test src/components/market-map/SoldParcelPopup.test.tsx src/lib/market-map/sold-colour.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/market-map/sold-colour.ts src/lib/market-map/sold-colour.test.ts src/components/market-map/SoldParcelPopup.tsx src/components/market-map/SoldParcelPopup.test.tsx
git commit -m "feat(market-map): show actual-sale house and flat parcel evidence"
```

## Task 7: Sold-Parcel Confidence Coloring

**Files:**
- Create: `supabase/migrations/<timestamp>_sold_parcels_confidence_floor.sql`
- Modify: `docs/market-map-sold-parcels.md`

- [ ] **Step 1: Write migration**

Create migration:
```bash
supabase migration new sold_parcels_confidence_floor
```

Write a replacement `refresh_market_map_sold_parcels(p_lad text)` body copied from `20260620100300_market_map_sold_parcels.sql`, changing the bucket update to:

```sql
with ranked as (
  select inspire_id,
         ntile(9) over (order by median_price_per_sqm_pence) as b
  from public.market_map_sold_parcels
  where median_price_per_sqm_pence is not null
    and sale_count >= 3
)
update public.market_map_sold_parcels t
   set bucket = ranked.b
  from ranked
 where ranked.inspire_id = t.inspire_id;

update public.market_map_sold_parcels
   set bucket = null
 where median_price_per_sqm_pence is null
    or sale_count < 3;
```

Run:
```bash
pnpm check:migrations
```

Expected: PASS.

- [ ] **Step 2: Update docs**

In `docs/market-map-sold-parcels.md`, replace “£/m² is only computed where…” with:

```md
The parcel is only heat-coloured when it has EPC floor area and at least 3 actual sales on the parcel. Parcels with one or two actual sales still show their evidence in the popup, but remain neutral on the heatmap so low-count observations do not look statistically strong.
```

- [ ] **Step 3: Commit**

Run:
```bash
git add supabase/migrations/*_sold_parcels_confidence_floor.sql docs/market-map-sold-parcels.md
git commit -m "feat(market-map): only heat-colour sold parcels with sufficient evidence"
```

## Task 8: Link-Render And Screenshot Proof

**Files:**
- Create: `e2e/valuation-market-map-links.spec.ts`

- [ ] **Step 1: Write failing Playwright smoke tests**

Create:

```ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "test-results/evidence/valuation-epc-foundation";

test.describe("valuation and market-map link rendering", () => {
  test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));

  test("value-my-property journey renders public links and proof screenshot", async ({ page }) => {
    await page.goto("/value-my-property", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: /value my property/i }).first()).toBeVisible();
    await expect(page.locator('a[href^="javascript:"], a[href="#"]')).toHaveCount(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/value-my-property-links.png`, fullPage: true });
  });

  test("market map renders linkable shell and proof screenshot", async ({ page }) => {
    await page.goto("/area-prices", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/sold|price|market|area/i);
    await expect(page.locator('a[href^="javascript:"], a[href="#"]')).toHaveCount(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/area-prices-shell.png`, fullPage: true });
  });
});
```

Run:
```bash
pnpm test:e2e --project=chromium e2e/valuation-market-map-links.spec.ts
```

Expected: FAIL if routes/links are not implemented or if the dev server is not running.

- [ ] **Step 2: Adjust assertions to real copy, not implementation details**

If the first run fails because the existing copy differs, update the text match to the route’s real visible heading while keeping:

```ts
await expect(page.locator('a[href^="javascript:"], a[href="#"]')).toHaveCount(0);
```

Run again with the dev server:
```bash
pnpm dev
pnpm test:e2e --project=chromium e2e/valuation-market-map-links.spec.ts
```

Expected: PASS and screenshots written in `test-results/evidence/valuation-epc-foundation/`.

- [ ] **Step 3: Commit**

Run:
```bash
git add e2e/valuation-market-map-links.spec.ts
git commit -m "test(e2e): prove valuation and market-map links render"
```

## Task 9: Verification And Documentation

**Files:**
- Modify: `docs/VALUATION_MODEL_VALIDATION.md`
- Modify: `docs/epc-dataset.md`

- [ ] **Step 1: Run focused unit tests**

Run:
```bash
pnpm test src/lib/valuation/weighting.test.ts src/lib/valuation/engine.test.ts src/services/valuation/comparables-repo.test.ts src/components/market-map/SoldParcelPopup.test.tsx src/lib/market-map/sold-colour.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS. If it fails in unrelated pre-existing files, record exact file/error in final response and do not claim typecheck passed.

- [ ] **Step 3: Run DB tests when Docker is available**

Run:
```bash
RUN_DB_TESTS=1 pnpm test:db db-tests/valuation-epc-feature-view.test.ts
```

Expected: PASS or clear Docker-unavailable error. Do not claim DB test passed unless it actually passes.

- [ ] **Step 4: Run e2e screenshot proof**

Run:
```bash
pnpm dev
pnpm test:e2e --project=chromium e2e/valuation-market-map-links.spec.ts
```

Expected: PASS with screenshot files:

```text
test-results/evidence/valuation-epc-foundation/value-my-property-links.png
test-results/evidence/valuation-epc-foundation/area-prices-shell.png
```

- [ ] **Step 5: Update validation docs honestly**

Add to `docs/VALUATION_MODEL_VALIDATION.md`:

```md
## EPC-Enriched Comparable Model Pending Measurement

`vmp-comparables-1.2.0` adds EPC floor-area evidence to comparable weighting when both the subject and comparable have usable floor area. No improved accuracy figure is published until the gated real-database backtest is run with `RUN_VALUATION_DB=1` and the resulting metrics replace this note.
```

Add to `docs/epc-dataset.md` under Linking:

```md
The valuation engine now consumes EPC floor area from comparable matches. Missing EPC area remains neutral; the estimator does not fabricate size or £/m².
```

- [ ] **Step 6: Final commit**

Run:
```bash
git add docs/VALUATION_MODEL_VALIDATION.md docs/epc-dataset.md
git commit -m "docs(valuation): document EPC-enriched comparable measurement gate"
```

## Self-Review Checklist

- Every production TypeScript behavior change has a failing Vitest test first.
- Every SQL/data-model behavior change has a migration and a DB contract test or an explicit Docker-unavailable note.
- Link-render proof creates screenshots and checks for placeholder links.
- No parcel coloring uses MSOA fallback as if it were actual parcel evidence.
- No new accuracy claim is added without a successful backtest.
- `MODEL_VERSION` is bumped for estimator behavior changes.

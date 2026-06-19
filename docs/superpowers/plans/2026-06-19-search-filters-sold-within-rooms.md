# Search Filters — Sold-Within (Land Registry) + Min/Max Bedrooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two filters to the `/search` filter panel — a "Sold within the last few" radio group (3m/6m/12m/Show all) backed by HM Land Registry data, and a Min/Max bedrooms dropdown pair replacing the current single Min-Bedrooms select.

**Architecture:** UI state lives in URL params via `SearchState`. The new sold-within filter is backed by a sidecar table `property_last_sold` joined into the `search_listings` materialized view, backfilled from existing cached LR insight JSON. The bedrooms change is a UI + URL + query reshape with no schema change.

**Tech Stack:** Next.js 16 App Router (React 19, TS), Tailwind v4, Supabase Postgres (matview + migration), Vitest unit/component tests, Playwright e2e (existing pattern only — no new e2e in this plan).

**Spec:** `britv3/docs/superpowers/specs/2026-06-19-search-filters-sold-within-rooms-design.md`

---

## File Structure

| Path | Role | Why one file |
|---|---|---|
| `britv3/src/lib/search/url-state.ts` | Owns `SearchState` shape + URL serialize/parse | Single source of truth for filter state mapping |
| `britv3/src/lib/search/sold-within.ts` _(new)_ | `SoldWithin` type, `DEFAULT_SOLD_WITHIN`, `computeSoldSince` | Pure helper, isolated from React + URL concerns |
| `britv3/src/app/(main)/search/actions.ts` | `searchProperties` server action — Supabase + mock paths | Existing single boundary for filter→DB |
| `britv3/src/components/search/RefineFilters.tsx` | Filter panel UI | Existing single-component pattern; matches all other filter sections |
| `britv3/src/app/(main)/search/page.tsx` | Search page; consumes `SearchState`; renders empty-state copy | Existing page owns empty-state messaging |
| `britv3/src/server/land-registry/land-registry-service.ts` _(path verified in Task 5)_ | Writes `property_last_sold` on LR fetch | Single LR write path |
| `britv3/supabase/migrations/<ts>_create_property_last_sold.sql` _(new)_ | Table + index + RLS | Schema change |
| `britv3/supabase/migrations/<ts>_backfill_property_last_sold.sql` _(new)_ | One-shot backfill from existing cached blobs | Pure data migration, separate from schema |
| `britv3/supabase/migrations/<ts>_search_listings_add_last_sold_date.sql` _(new)_ | Drop/recreate matview with LEFT JOIN | View change |
| `britv3/src/__tests__/search/url-state.test.ts` _(create or extend)_ | URL round-trip for new fields | Mirrors test naming pattern |
| `britv3/src/__tests__/search/sold-within.test.ts` _(new)_ | `computeSoldSince` against frozen clock | Mirrors test naming pattern |
| `britv3/src/__tests__/search/filters.test.ts` _(extend)_ | Mock-filter cases for bedrooms min/max + soldWithin | Existing file, deterministic test path |
| `britv3/src/__tests__/search/refine-filters.test.tsx` _(new)_ | Component tests for the two new UI sections | New tsx test, mirrors `empty-state.test.tsx` pattern |
| `britv3/src/__tests__/server/land-registry-service.test.ts` _(create or extend; path confirmed in Task 13)_ | Upsert-on-fetch case | Mirrors server-side test layout |

---

## Task 1: Branch Setup & Verification

**Files:**
- Modify: none (git operations only)

- [ ] **Step 1: Confirm current branch + base**

Run:
```bash
cd /Users/jojominime/Documents/britv3main/britv3
git branch --show-current
git log --oneline -5
git fetch origin
git log --oneline origin/main..HEAD
```

Expected: current branch `feature/search-filters-sold-within-rooms`. The third command lists commits ahead of `origin/main`. If the list contains commits other than the single `docs(search): spec sold-within and min/max bedrooms filters` commit (`ecd83ea9` or similar), the branch carries unmerged work from `feature/value-my-property-avm` and must be rebased.

- [ ] **Step 2: Rebase the spec commit onto origin/main**

If extra commits are present, rebase to keep only the spec commit on top of `origin/main`:
```bash
git rebase --onto origin/main feature/value-my-property-avm feature/search-filters-sold-within-rooms
```

Resolve any conflicts (the spec is a new file under `britv3/docs/superpowers/specs/` — there should be no conflicts).

- [ ] **Step 3: Verify clean tree + correct base**

Run:
```bash
git status --short
git log --oneline origin/main..HEAD
```

Expected: `git status` empty. `git log` shows exactly one commit: the spec doc commit.

- [ ] **Step 4: Confirm pnpm + dev paths from britv3/**

Run:
```bash
cd /Users/jojominime/Documents/britv3main/britv3
ls package.json scripts/dev-guard.mjs
```

Expected: both files exist. CLAUDE.md says the app is at `britv3.0/` but the actual directory is `britv3/` — the memory note confirms CLAUDE.md is stale. Use `britv3/` for all commands.

---

## Task 2: URL State — Add `soldWithin`, `bedsMin`, `bedsMax`

**Files:**
- Modify: `britv3/src/lib/search/url-state.ts`
- Test: `britv3/src/__tests__/search/url-state.test.ts` (create if absent)

- [ ] **Step 1: Check for an existing url-state test file**

Run:
```bash
ls britv3/src/__tests__/search/url-state.test.ts 2>/dev/null || echo "absent"
```

If absent, create it with the test scaffolding below. If present, append the new test cases.

- [ ] **Step 2: Write failing tests**

Write `britv3/src/__tests__/search/url-state.test.ts` (or append a `describe`):

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_STATE,
  parseSearchState,
  serializeSearchState,
} from "@/lib/search/url-state";

describe("url-state: bedrooms min/max and soldWithin", () => {
  it("defaults are omitted from the serialized URL", () => {
    const qs = serializeSearchState(DEFAULT_SEARCH_STATE);
    const params = new URLSearchParams(qs);
    expect(params.get("bedsMin")).toBeNull();
    expect(params.get("bedsMax")).toBeNull();
    expect(params.get("soldWithin")).toBeNull();
  });

  it("non-default bedrooms round-trip through URL", () => {
    const state = { ...DEFAULT_SEARCH_STATE, bedsMin: "2", bedsMax: "4" };
    const qs = serializeSearchState(state);
    const parsed = parseSearchState(new URLSearchParams(qs));
    expect(parsed.bedsMin).toBe("2");
    expect(parsed.bedsMax).toBe("4");
  });

  it("non-default soldWithin round-trips through URL", () => {
    const state = { ...DEFAULT_SEARCH_STATE, soldWithin: "6m" as const };
    const qs = serializeSearchState(state);
    const parsed = parseSearchState(new URLSearchParams(qs));
    expect(parsed.soldWithin).toBe("6m");
  });

  it("invalid bedsMin falls back to 'Any'", () => {
    const parsed = parseSearchState(new URLSearchParams("bedsMin=banana"));
    expect(parsed.bedsMin).toBe("Any");
  });

  it("invalid soldWithin falls back to 'all'", () => {
    const parsed = parseSearchState(new URLSearchParams("soldWithin=ever"));
    expect(parsed.soldWithin).toBe("all");
  });

  it("legacy ?beds= is not migrated", () => {
    const parsed = parseSearchState(new URLSearchParams("beds=3"));
    // bedsMin stays default; beds field no longer exists on state
    expect(parsed.bedsMin).toBe("Any");
    expect(parsed.bedsMax).toBe("Any");
    // @ts-expect-error — `beds` removed from SearchState
    expect(parsed.beds).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/url-state.test.ts -- --run
```

Expected: FAIL — `DEFAULT_SEARCH_STATE` has no `bedsMin`/`bedsMax`/`soldWithin`; the `beds` field still exists.

- [ ] **Step 4: Update `url-state.ts`**

Replace the contents of `britv3/src/lib/search/url-state.ts` with:

```ts
/**
 * URL <-> search-state serialization for the property search page.
 *
 * The URL is the single source of truth for shareable filter state. This module
 * keeps that mapping in one tested place so the page component can stay thin:
 *   state -> serializeSearchState -> router.replace
 *   useSearchParams -> parseSearchState -> state
 *
 * Defaults are omitted from the query string to keep shared URLs clean.
 */

export type ListingType = "all" | "sale" | "rent" | "new_build";
export type SortOption = "most_recent" | "price_asc" | "price_desc" | "most_popular";
export type ViewMode = "list" | "map";
export type SoldWithin = "3m" | "6m" | "12m" | "all";

export type SearchState = {
  listingType: ListingType;
  q: string;
  propertyType: string[];
  mustHaves: string[];
  minPrice: string;
  maxPrice: string;
  minSqft: string;
  maxSqft: string;
  bedsMin: string;
  bedsMax: string;
  soldWithin: SoldWithin;
  sort: SortOption;
  view: ViewMode;
  page: number;
};

export const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"] as const;

export const DEFAULT_SEARCH_STATE: SearchState = {
  listingType: "all",
  q: "",
  propertyType: [],
  mustHaves: [],
  minPrice: "",
  maxPrice: "",
  minSqft: "",
  maxSqft: "",
  bedsMin: "Any",
  bedsMax: "Any",
  soldWithin: "all",
  sort: "most_recent",
  view: "list",
  page: 1,
};

const VALID_SORTS: ReadonlySet<SortOption> = new Set([
  "most_recent",
  "price_asc",
  "price_desc",
  "most_popular",
]);

const VALID_VIEWS: ReadonlySet<ViewMode> = new Set(["list", "map"]);

const VALID_BEDS: ReadonlySet<string> = new Set(BEDROOM_OPTIONS);

const VALID_SOLD_WITHIN: ReadonlySet<SoldWithin> = new Set(["3m", "6m", "12m", "all"]);

export function serializeSearchState(state: SearchState): string {
  const params = new URLSearchParams();

  if (state.listingType !== DEFAULT_SEARCH_STATE.listingType) {
    params.set("type", state.listingType);
  }
  if (state.q) params.set("q", state.q);
  if (state.propertyType.length > 0) {
    params.set("propertyType", state.propertyType.join(","));
  }
  if (state.mustHaves.length > 0) {
    params.set("mustHaves", state.mustHaves.join(","));
  }
  if (state.minPrice) params.set("minPrice", state.minPrice);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  if (state.minSqft) params.set("minSqft", state.minSqft);
  if (state.maxSqft) params.set("maxSqft", state.maxSqft);
  if (state.bedsMin !== DEFAULT_SEARCH_STATE.bedsMin) params.set("bedsMin", state.bedsMin);
  if (state.bedsMax !== DEFAULT_SEARCH_STATE.bedsMax) params.set("bedsMax", state.bedsMax);
  if (state.soldWithin !== DEFAULT_SEARCH_STATE.soldWithin) {
    params.set("soldWithin", state.soldWithin);
  }
  if (state.sort !== DEFAULT_SEARCH_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_SEARCH_STATE.view) params.set("view", state.view);
  if (state.page > 1) params.set("page", String(state.page));

  return params.toString();
}

function parseListingType(raw: string | null): ListingType {
  if (raw === "rent") return "rent";
  if (raw === "buy" || raw === "sale") return "sale";
  if (raw === "new_build" || raw === "new-builds") return "new_build";
  return "all";
}

function parseList(raw: string | null): string[] {
  return raw?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}

function parseBeds(raw: string | null, fallback: string): string {
  return raw && VALID_BEDS.has(raw) ? raw : fallback;
}

function parseSoldWithin(raw: string | null): SoldWithin {
  return raw && VALID_SOLD_WITHIN.has(raw as SoldWithin)
    ? (raw as SoldWithin)
    : DEFAULT_SEARCH_STATE.soldWithin;
}

export function parseSearchState(params: URLSearchParams): SearchState {
  const sortRaw = params.get("sort") as SortOption | null;
  const viewRaw = params.get("view") as ViewMode | null;

  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    listingType: parseListingType(params.get("type")),
    q: params.get("q") ?? "",
    propertyType: parseList(params.get("propertyType")),
    mustHaves: parseList(params.get("mustHaves")),
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    minSqft: params.get("minSqft") ?? "",
    maxSqft: params.get("maxSqft") ?? "",
    bedsMin: parseBeds(params.get("bedsMin"), DEFAULT_SEARCH_STATE.bedsMin),
    bedsMax: parseBeds(params.get("bedsMax"), DEFAULT_SEARCH_STATE.bedsMax),
    soldWithin: parseSoldWithin(params.get("soldWithin")),
    sort: sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : DEFAULT_SEARCH_STATE.sort,
    view: viewRaw && VALID_VIEWS.has(viewRaw) ? viewRaw : DEFAULT_SEARCH_STATE.view,
    page,
  };
}
```

- [ ] **Step 5: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/url-state.test.ts -- --run
```

Expected: PASS, all 6 cases green.

- [ ] **Step 6: Fix downstream type errors**

Run:
```bash
cd britv3 && pnpm tsc --noEmit
```

The compiler will flag every reference to the old `beds` field. Expected files:
- `britv3/src/components/search/RefineFilters.tsx` (lines 173, 174) — will be replaced in Task 10.
- `britv3/src/app/(main)/search/page.tsx` — uses `state.beds` somewhere; update call sites to read `state.bedsMin` / `state.bedsMax`. The page hands filters down to `searchProperties` — update those call sites to pass `bedsMin`/`bedsMax` instead of `beds`. The actions type is updated in Task 8; until then, leave a `// TODO Task 8` reference if a temporary call-site error remains. Do not invent values.
- Any other consumer flagged by tsc.

For each non-test consumer, replace `state.beds` reads with `state.bedsMin` (the closest semantic match for "min only" downstream code) and prepare a `bedsMax` pass-through. Where the consumer is `RefineFilters` props or its inner select, the file will be fully rewritten in Task 10 — leave its errors for now.

After the type sweep, the only remaining errors should be in `RefineFilters.tsx` (Task 10) and `actions.ts` (Task 8).

- [ ] **Step 7: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add src/lib/search/url-state.ts src/__tests__/search/url-state.test.ts
# Add any non-RefineFilters consumer updates touched in Step 6
git status
git commit -m "feat(search): split bedrooms into min/max and add soldWithin url state"
```

---

## Task 3: `sold-within.ts` — Pure Helper + Type

**Files:**
- Create: `britv3/src/lib/search/sold-within.ts`
- Create: `britv3/src/__tests__/search/sold-within.test.ts`

- [ ] **Step 1: Write failing test**

Create `britv3/src/__tests__/search/sold-within.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeSoldSince, DEFAULT_SOLD_WITHIN } from "@/lib/search/sold-within";

describe("computeSoldSince", () => {
  it("returns null for 'all'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("all", now)).toBeNull();
  });

  it("returns 3 months ago ISO date for '3m'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("3m", now)).toBe("2026-03-19");
  });

  it("returns 6 months ago ISO date for '6m'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("6m", now)).toBe("2025-12-19");
  });

  it("returns 12 months ago ISO date for '12m'", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    expect(computeSoldSince("12m", now)).toBe("2025-01-15");
  });

  it("DEFAULT_SOLD_WITHIN is 'all'", () => {
    expect(DEFAULT_SOLD_WITHIN).toBe("all");
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/sold-within.test.ts -- --run
```

Expected: FAIL — module `@/lib/search/sold-within` not found.

- [ ] **Step 3: Implement `sold-within.ts`**

Create `britv3/src/lib/search/sold-within.ts`:

```ts
import type { SoldWithin } from "./url-state";

export type { SoldWithin } from "./url-state";

export const DEFAULT_SOLD_WITHIN: SoldWithin = "all";

const MONTHS: Record<Exclude<SoldWithin, "all">, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

/**
 * Compute the lower-bound sold date for a "sold within" filter.
 * Returns null when the filter is "all" (no constraint).
 * Returns ISO date (YYYY-MM-DD) — no time component, UTC-anchored.
 */
export function computeSoldSince(
  value: SoldWithin,
  now: Date = new Date(),
): string | null {
  if (value === "all") return null;
  const months = MONTHS[value];
  const floor = new Date(now);
  floor.setUTCMonth(floor.getUTCMonth() - months);
  return floor.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/sold-within.test.ts -- --run
```

Expected: PASS, all 5 cases green.

- [ ] **Step 5: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add src/lib/search/sold-within.ts src/__tests__/search/sold-within.test.ts
git commit -m "feat(search): add computeSoldSince helper for soldWithin filter"
```

---

## Task 4: Migration — Create `property_last_sold` Table

**Files:**
- Create: `britv3/supabase/migrations/<ts>_create_property_last_sold.sql`

- [ ] **Step 1: Generate migration file**

Run:
```bash
cd britv3 && pnpm supabase migration new create_property_last_sold
```

Expected: a new file under `britv3/supabase/migrations/` with a 14-digit UTC prefix (e.g., `20260619nnnnnn_create_property_last_sold.sql`). Note the full filename.

- [ ] **Step 2: Write the migration SQL**

Open the new file and replace its body with:

```sql
-- Sidecar table holding the most recent HM Land Registry sale per property.
-- Joined into search_listings to support the "sold within last N months" filter.

create table if not exists public.property_last_sold (
  property_id uuid primary key
    references public.properties(id) on delete cascade,
  last_sold_date date not null,
  source text not null default 'hmlr',
  updated_at timestamptz not null default now()
);

create index if not exists property_last_sold_date_idx
  on public.property_last_sold (last_sold_date desc);

alter table public.property_last_sold enable row level security;

-- Public-derived data; no PII. Read open, writes only via definer/service role.
drop policy if exists "property_last_sold_select_all" on public.property_last_sold;
create policy "property_last_sold_select_all"
  on public.property_last_sold
  for select
  using (true);
```

- [ ] **Step 3: Verify migration check passes**

Run:
```bash
cd britv3 && pnpm check:migrations
```

Expected: exit 0. If it errors on prefix collision, regenerate the migration file with `supabase migration new` — never hand-edit the prefix.

- [ ] **Step 4: Apply to dev Supabase**

Per `britv3/supabase/migrations/README.md` and the memory note (migrate.yml retired in Phase 5), apply manually:

```bash
cd britv3 && pnpm supabase db push
```

Expected: the new migration is reported as applied. If `db push` errors, halt and report — do not retry blindly.

- [ ] **Step 5: Verify table exists**

Run a single ad-hoc check via the Supabase SQL editor or:
```bash
cd britv3 && pnpm supabase db remote commit --dry-run 2>&1 | head -5 || true
```

(The exact verification command depends on the dev workflow; the canonical check is `\d public.property_last_sold` in psql. If unsure, query via the Supabase studio.)

Expected: table exists with the four columns and the index.

- [ ] **Step 6: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add supabase/migrations/
git commit -m "feat(db): add property_last_sold sidecar table for sold-within filter"
```

---

## Task 5: Verify `property_insights` JSON Shape Before Backfill

**Files:**
- Modify: none (verification only)

The spec's backfill assumes `property_insights.data` for `land_registry` rows contains an array under the key `transactions`, with elements that have a `date_of_transfer` string. Confirm this before writing the backfill query — if the shape is different, the migration will silently insert nothing.

- [ ] **Step 1: Locate the LR cache writer**

Run:
```bash
cd britv3 && grep -rn "property_insights" src/server src/lib src/services 2>/dev/null | grep -iE "(land_registry|insert|upsert)" | head -20
grep -rn "insight_type.*land_registry" src/ 2>/dev/null | head -10
```

Identify the file/function that writes `property_insights` rows with `insight_type='land_registry'`. Note its path.

- [ ] **Step 2: Read the cache writer**

Open the file from Step 1 and find the exact `data` payload shape — what TypeScript object is written? Confirm:
- The top-level keys (does it have `transactions`?)
- The transaction array element keys (does each have `date_of_transfer`?)

Write down the actual keys observed.

- [ ] **Step 3: Sample real data**

If a dev Supabase is reachable, query:
```sql
select property_id, data
from public.property_insights
where insight_type = 'land_registry'
limit 3;
```

Confirm the JSON shape matches the writer.

- [ ] **Step 4: Decide path expressions for the backfill**

Capture the verified JSON path. Two outcomes:

**(a) Confirmed shape** matches `data->'transactions'` with `txn->>'date_of_transfer'` → proceed to Task 6 with the spec's SQL unchanged.

**(b) Different shape** → record the actual paths and adapt the SQL in Task 6's Step 2. Examples of likely alternatives:
- Top-level array (data is itself an array): use `jsonb_array_elements(pi.data)` and `txn->>'date_of_transfer'`.
- Different key name (e.g., `records`, `sales`): substitute the key in `pi.data -> '<key>'`.
- Different date key (e.g., `transaction_date`, `date`): substitute in `txn->>'<key>'`.

Do not proceed to Task 6 until the shape is verified — silent zero-row backfill is the failure mode this task prevents.

- [ ] **Step 5: No commit**

This is a verification task. No file changes.

---

## Task 6: Migration — Backfill `property_last_sold` from `property_insights`

**Files:**
- Create: `britv3/supabase/migrations/<ts>_backfill_property_last_sold.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
cd britv3 && pnpm supabase migration new backfill_property_last_sold
```

Note the new filename.

- [ ] **Step 2: Write backfill SQL using verified JSON paths from Task 5**

Open the migration and replace its body with the following, **substituting the verified path expressions** if Task 5 Step 4 returned outcome (b):

```sql
-- One-shot backfill of property_last_sold from existing cached
-- land_registry insights. Subsequent updates flow through
-- land-registry-service.ts (see Task 13).

insert into public.property_last_sold (property_id, last_sold_date, source)
select
  pi.property_id,
  max((txn->>'date_of_transfer')::date) as last_sold_date,
  'hmlr' as source
from public.property_insights pi,
     lateral jsonb_array_elements(pi.data -> 'transactions') as txn
where pi.insight_type = 'land_registry'
  and pi.data ? 'transactions'
  and (txn->>'date_of_transfer') is not null
group by pi.property_id
on conflict (property_id) do update
  set last_sold_date = excluded.last_sold_date,
      updated_at = now()
where excluded.last_sold_date > public.property_last_sold.last_sold_date;
```

- [ ] **Step 3: Apply migration**

```bash
cd britv3 && pnpm check:migrations && pnpm supabase db push
```

Expected: applied without error.

- [ ] **Step 4: Spot-check backfilled rows**

Query the dev DB:
```sql
select count(*) from public.property_last_sold;

select pls.property_id, pls.last_sold_date,
       pi.data -> 'transactions' as raw_txns
from public.property_last_sold pls
join public.property_insights pi on pi.property_id = pls.property_id
                                 and pi.insight_type = 'land_registry'
limit 5;
```

For each sampled row, verify `last_sold_date` equals the `max(date_of_transfer)` from `raw_txns`. If the count is 0 or any spot-check fails, halt — Task 5 was wrong and needs re-verification.

- [ ] **Step 5: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add supabase/migrations/
git commit -m "feat(db): backfill property_last_sold from cached land registry insights"
```

---

## Task 7: Migration — Add `last_sold_date` to `search_listings` Matview

**Files:**
- Read: `britv3/supabase/migrations/003001_property_portal.sql` (and any later migration touching `search_listings`)
- Create: `britv3/supabase/migrations/<ts>_search_listings_add_last_sold_date.sql`

- [ ] **Step 1: Locate the canonical matview definition**

Run:
```bash
cd britv3 && grep -rn "materialized view.*search_listings\|create.*materialized.*search_listings" supabase/migrations/ | head -20
grep -rn "search_listings" supabase/migrations/ | head -40
```

Identify the most recent migration that creates or replaces `search_listings`. Read its full `create materialized view search_listings as ...` block — note every column, every join, every index, and every `grant select` statement on the view.

- [ ] **Step 2: Generate migration**

Run:
```bash
cd britv3 && pnpm supabase migration new search_listings_add_last_sold_date
```

- [ ] **Step 3: Write the matview rebuild migration**

Replace the migration body with the following template. Substitute the inner SELECT, indexes, and grants with the exact statements observed in Step 1 — only the `LEFT JOIN property_last_sold` and the `last_sold_date` projection are new:

```sql
-- Add HM Land Registry last_sold_date to search_listings to support the
-- "sold within last N months" filter.

drop materialized view if exists public.search_listings cascade;

create materialized view public.search_listings as
select
  -- BEGIN: paste the existing column list from the prior matview definition,
  -- adding the new projection at the end:
  l.listing_id,
  l.property_id,
  l.listing_type,
  l.price,
  l.property_type,
  l.bedrooms,
  l.bathrooms,
  l.city,
  l.postcode,
  l.coordinates,
  l.slug,
  l.thumbnail_url,
  l.title,
  l.address_line1,
  l.square_footage,
  l.epc_rating,
  l.tenure,
  l.new_build,
  l.listed_date,
  l.view_count,
  -- END: column list (replace the list above with whatever the prior definition
  -- actually selected — DO NOT invent columns)
  pls.last_sold_date as last_sold_date
from public.listings l
-- ... reproduce every join from the prior definition ...
left join public.property_last_sold pls on pls.property_id = l.property_id;

-- Reproduce every index from the prior definition. Example:
-- create unique index search_listings_listing_id_idx on public.search_listings (listing_id);
-- create index search_listings_price_idx on public.search_listings (price);
-- create index search_listings_bedrooms_idx on public.search_listings (bedrooms);

-- Add a new index for the sold-within filter:
create index search_listings_last_sold_date_idx
  on public.search_listings (last_sold_date desc nulls last);

-- Reproduce every grant from the prior definition. Example:
-- grant select on public.search_listings to anon, authenticated;

-- Refresh the matview with backfilled LR data:
refresh materialized view public.search_listings;
```

**Critical:** the column list, joins, indexes, and grants must mirror the prior definition exactly. Use Step 1's read as the source of truth — anything fabricated here will break production queries.

- [ ] **Step 4: Apply migration**

```bash
cd britv3 && pnpm check:migrations && pnpm supabase db push
```

Expected: applied without error.

- [ ] **Step 5: Sanity-check the view**

Query:
```sql
select count(*) from public.search_listings;
select count(*) filter (where last_sold_date is not null) as enriched,
       count(*) filter (where last_sold_date is null) as un_enriched
from public.search_listings;
select listing_id, last_sold_date
from public.search_listings
where last_sold_date is not null
order by last_sold_date desc
limit 5;
```

Confirm:
- The total count matches the previous matview row count (or a sane delta).
- `enriched + un_enriched = total`.
- Recent `last_sold_date` values are plausible (within the last few years).

- [ ] **Step 6: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add supabase/migrations/
git commit -m "feat(db): expose last_sold_date on search_listings via property_last_sold join"
```

---

## Task 8: `searchProperties` — Update `SearchFilters` Type + Mock Path

**Files:**
- Modify: `britv3/src/app/(main)/search/actions.ts`
- Modify: `britv3/src/__tests__/search/filters.test.ts`

- [ ] **Step 1: Read the existing filters test**

Run:
```bash
cd britv3 && cat src/__tests__/search/filters.test.ts | head -120
```

Note the test pattern — likely it imports `searchProperties` (or `filterMockProperties` if exported) and asserts on returned data. The new tests below follow the same shape.

- [ ] **Step 2: Write failing tests for bedrooms min/max + soldWithin (mock path)**

Append to `britv3/src/__tests__/search/filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { searchProperties } from "@/app/(main)/search/actions";

// Mock data has beds: 3, 4, 2, 5, 3, 2, 5, 2 (MOCK_PROPERTIES order in actions.ts).
// The mock path runs when the search_live_data feature flag is OFF — confirm
// the test environment leaves it off (default).

describe("searchProperties (mock path) — bedrooms min/max", () => {
  it("Any/Any returns all rows", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "Any",
    });
    expect(data.length).toBe(8);
  });

  it("bedsMin=3 returns rows with >= 3 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "Any",
    });
    expect(data.every((p) => p.beds >= 3)).toBe(true);
  });

  it("bedsMax=2 returns rows with <= 2 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "2",
    });
    expect(data.every((p) => p.beds <= 2)).toBe(true);
  });

  it("bedsMin=3 bedsMax=4 returns rows in [3,4]", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "4",
    });
    expect(data.every((p) => p.beds >= 3 && p.beds <= 4)).toBe(true);
  });

  it("bedsMax=5+ applies no upper bound", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "5+",
    });
    expect(data.length).toBe(8); // upper bound disabled by sentinel
  });
});

describe("searchProperties (mock path) — soldWithin", () => {
  it("'all' returns all rows (mock has no LR data)", async () => {
    const { data } = await searchProperties({ soldWithin: "all" });
    expect(data.length).toBe(8);
  });

  it("'3m' returns empty (mock data has no last_sold_date)", async () => {
    const { data } = await searchProperties({ soldWithin: "3m" });
    expect(data.length).toBe(0);
  });
});
```

Note: the mock `MOCK_PROPERTIES` set has no `last_sold_date` field — by design, any soldWithin filter other than `all` drops every mock row. That is the same behavior we want against real data when LR cache is missing.

- [ ] **Step 3: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/filters.test.ts -- --run
```

Expected: FAIL — `SearchFilters` type does not have `bedsMin`/`bedsMax`/`soldWithin`; the mock filter still keys off `beds`.

- [ ] **Step 4: Update `SearchFilters` type + mock filter**

Open `britv3/src/app/(main)/search/actions.ts`.

(a) Replace the `SearchFilters` type (lines 32–43) with:

```ts
import type { SoldWithin } from "@/lib/search/url-state";

export type SearchFilters = {
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedsMin?: string;
  bedsMax?: string;
  soldWithin?: SoldWithin;
  propertyType?: string[];
  mustHaves?: string[];
  minSqft?: string;
  maxSqft?: string;
  sort?: string;
  q?: string;
};
```

(b) Add the `last_sold_date` field to `SearchProperty` so the mock filter can mirror DB semantics:

```ts
export type SearchProperty = {
  // ... existing fields ...
  last_sold_date: string | null;
};
```

Update each entry in `MOCK_PROPERTIES` to include `last_sold_date: null`. Bulk-append `last_sold_date: null,` before the closing `}` of every literal in lines 66–73.

(c) Replace the bedrooms block in `filterMockProperties` (lines 108–114) with:

```ts
  // Bedrooms — min/max range
  const minBedsRank = rankBeds(filters.bedsMin);
  const maxBedsRank = rankBeds(filters.bedsMax);
  if (minBedsRank !== null) {
    results = results.filter((p) => p.beds >= minBedsRank);
  }
  if (maxBedsRank !== null) {
    results = results.filter((p) => p.beds <= maxBedsRank);
  }
```

Add this helper just above `filterMockProperties`:

```ts
function rankBeds(value: string | undefined): number | null {
  if (!value || value === "Any") return null;
  if (value === "5+") return null; // sentinel: no bound
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}
```

Important: `rankBeds("5+")` returns `null` for the **max** side (no upper bound), which is the spec's required behavior. For the **min** side we want `5+` to mean ">= 5". Handle that with a focused variant:

```ts
function rankBedsMin(value: string | undefined): number | null {
  if (!value || value === "Any") return null;
  if (value === "5+") return 5;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}
```

Use `rankBedsMin` for the min side and `rankBeds` for the max side:

```ts
  const minBedsRank = rankBedsMin(filters.bedsMin);
  const maxBedsRank = rankBeds(filters.bedsMax);
```

(d) Add a static import for `computeSoldSince` at the top of `actions.ts`:

```ts
import { computeSoldSince } from "@/lib/search/sold-within";
```

Then add sold-within filtering to `filterMockProperties` after the bedrooms block. Mock data has `null` last_sold_date, so any non-`all` filter correctly excludes every mock row:

```ts
  // Sold within last N months — runs against last_sold_date.
  if (filters.soldWithin && filters.soldWithin !== "all") {
    const floor = computeSoldSince(filters.soldWithin);
    if (floor) {
      results = results.filter(
        (p) => p.last_sold_date !== null && p.last_sold_date >= floor,
      );
    }
  }
```

- [ ] **Step 5: Update the Supabase query path**

In `searchProperties` (around lines 162–225):

(a) Add `last_sold_date` to the `.select(...)` column list:

```ts
    let query = supabase
      .from("search_listings")
      .select("listing_id, property_id, listing_type, price, property_type, bedrooms, bathrooms, city, postcode, coordinates, slug, thumbnail_url, title, address_line1, square_footage, epc_rating, tenure, last_sold_date")
      .limit(50);
```

(b) Replace the bedrooms block (lines 188–192) with:

```ts
    // Bedrooms — min/max range
    const minBeds = rankBedsMin(filters.bedsMin);
    const maxBeds = rankBeds(filters.bedsMax);
    if (minBeds !== null) query = query.gte("bedrooms", minBeds);
    if (maxBeds !== null) query = query.lte("bedrooms", maxBeds);
```

(c) Add sold-within after the bedrooms block:

```ts
    // Sold within last N months
    if (filters.soldWithin && filters.soldWithin !== "all") {
      const floor = computeSoldSince(filters.soldWithin);
      if (floor) query = query.gte("last_sold_date", floor);
    }
```

(d) In the DB→SearchProperty mapper (around lines 251–268), add:

```ts
        last_sold_date: row.last_sold_date ?? null,
```

- [ ] **Step 6: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/filters.test.ts -- --run
```

Expected: PASS, all new cases green. If existing tests for `beds` still exist, update them in the same edit to use `bedsMin` (a `beds: "3"` legacy test maps to `bedsMin: "3"`).

- [ ] **Step 7: Type check**

Run:
```bash
cd britv3 && pnpm tsc --noEmit
```

Expected: no errors in `actions.ts`, `url-state.ts`, or any consumer. `RefineFilters.tsx` still has errors — left for Task 10.

- [ ] **Step 8: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add src/app/\(main\)/search/actions.ts src/__tests__/search/filters.test.ts
git commit -m "feat(search): bedrooms min/max + soldWithin in searchProperties action"
```

---

## Task 9: `RefineFilters` — Replace Bedrooms Select with Min/Max Pair

**Files:**
- Modify: `britv3/src/components/search/RefineFilters.tsx`
- Create: `britv3/src/__tests__/search/refine-filters.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `britv3/src/__tests__/search/refine-filters.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefineFilters } from "@/components/search/RefineFilters";
import { DEFAULT_SEARCH_STATE } from "@/lib/search/url-state";

const baseProps = () => ({
  state: { ...DEFAULT_SEARCH_STATE },
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClear: vi.fn(),
});

describe("RefineFilters — bedrooms min/max", () => {
  it("renders a single 'Bedrooms' label with Min and Max selects", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByText(/^Bedrooms$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max bedrooms/i)).toBeInTheDocument();
  });

  it("emits bedsMin on min change", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.change(screen.getByLabelText(/min bedrooms/i), {
      target: { value: "2" },
    });
    expect(props.onChange).toHaveBeenCalledWith({ bedsMin: "2" });
  });

  it("emits bedsMax on max change", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.change(screen.getByLabelText(/max bedrooms/i), {
      target: { value: "4" },
    });
    expect(props.onChange).toHaveBeenCalledWith({ bedsMax: "4" });
  });

  it("clamps Max up to Min when Min > Max on commit", () => {
    const props = {
      ...baseProps(),
      state: { ...DEFAULT_SEARCH_STATE, bedsMin: "4", bedsMax: "2" },
    };
    render(<RefineFilters {...props} />);
    fireEvent.submit(screen.getByTestId("refine-filters"));
    // Clamp happens at submit (commit step), not in draft state.
    // Submit triggers onChange with the clamp + onSubmit, in that order, OR
    // the component applies the clamp inside the submit handler before onSubmit.
    expect(props.onSubmit).toHaveBeenCalled();
    // Implementation-specific assertion: the last onChange before submit
    // raised bedsMax to "4".
    const lastClampCall = props.onChange.mock.calls
      .reverse()
      .find((c) => c[0].bedsMax === "4");
    expect(lastClampCall).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/refine-filters.test.tsx -- --run
```

Expected: FAIL — either compile error (state.beds gone) or "Bedrooms" label not found / both selects not found.

- [ ] **Step 3: Replace the bedrooms section in `RefineFilters.tsx`**

Open `britv3/src/components/search/RefineFilters.tsx`.

(a) Replace `import type { SearchState }` with a value+type import that brings in `BEDROOM_OPTIONS`:

```ts
import type { SearchState } from "@/lib/search/url-state";
import { BEDROOM_OPTIONS } from "@/lib/search/url-state";
```

(b) Delete the local `const BEDROOM_OPTIONS = [...] as const;` (line 21).

(c) Replace lines 163–183 (the entire `{/* Min Bedrooms */}` block including the `<div>` and `<select>`) with:

```tsx
      {/* Bedrooms — Min / Max */}
      <div className="space-y-3">
        <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Bedrooms
        </span>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <select
            id="refine-beds-min"
            aria-label="Min bedrooms"
            value={state.bedsMin}
            onChange={(e) => onChange({ bedsMin: e.target.value })}
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {BEDROOM_OPTIONS.map((opt) => (
              <option key={`min-${opt}`} value={opt}>
                {opt === "Any" ? "Min" : opt}
              </option>
            ))}
          </select>
          <span className="text-sm font-bold text-neutral-400" aria-hidden="true">
            —
          </span>
          <select
            id="refine-beds-max"
            aria-label="Max bedrooms"
            value={state.bedsMax}
            onChange={(e) => onChange({ bedsMax: e.target.value })}
            className="h-11 w-full cursor-pointer rounded-lg border-none bg-neutral-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {BEDROOM_OPTIONS.map((opt) => (
              <option key={`max-${opt}`} value={opt}>
                {opt === "Any" ? "Max" : opt}
              </option>
            ))}
          </select>
        </div>
      </div>
```

(d) Add the clamp helper above the component:

```ts
const BEDS_RANK: Record<string, number> = {
  Any: 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5+": 5,
};

function clampBedrooms(min: string, max: string): { bedsMin: string; bedsMax: string } {
  if (min === "Any" || max === "Any") return { bedsMin: min, bedsMax: max };
  return BEDS_RANK[min] > BEDS_RANK[max]
    ? { bedsMin: min, bedsMax: min }
    : { bedsMin: min, bedsMax: max };
}
```

(e) Update the form's `onSubmit` to apply the clamp:

```tsx
      onSubmit={(e) => {
        e.preventDefault();
        const clamped = clampBedrooms(state.bedsMin, state.bedsMax);
        if (clamped.bedsMax !== state.bedsMax) {
          onChange({ bedsMax: clamped.bedsMax });
        }
        onSubmit();
      }}
```

- [ ] **Step 4: Run tests — confirm bedrooms pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/refine-filters.test.tsx -- --run
```

Expected: PASS for the four bedrooms cases.

- [ ] **Step 5: Type check**

Run:
```bash
cd britv3 && pnpm tsc --noEmit
```

Expected: no errors. The `state.beds` references are gone; `state.bedsMin`/`state.bedsMax` are typed correctly.

- [ ] **Step 6: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add src/components/search/RefineFilters.tsx src/__tests__/search/refine-filters.test.tsx
git commit -m "feat(search-ui): replace single Min Bedrooms select with Min/Max pair"
```

---

## Task 10: `RefineFilters` — Add Sold-Within Radio Group

**Files:**
- Modify: `britv3/src/components/search/RefineFilters.tsx`
- Modify: `britv3/src/__tests__/search/refine-filters.test.tsx`

- [ ] **Step 1: Append failing tests**

Append to `britv3/src/__tests__/search/refine-filters.test.tsx`:

```tsx
describe("RefineFilters — soldWithin", () => {
  it("renders all four sold-within options with 'Show all' selected by default", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByLabelText("3 months")).toBeInTheDocument();
    expect(screen.getByLabelText("6 months")).toBeInTheDocument();
    expect(screen.getByLabelText("12 months")).toBeInTheDocument();
    const showAll = screen.getByLabelText("Show all") as HTMLInputElement;
    expect(showAll.checked).toBe(true);
  });

  it("emits soldWithin on selection", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.click(screen.getByLabelText("6 months"));
    expect(props.onChange).toHaveBeenCalledWith({ soldWithin: "6m" });
  });

  it("renders sold-within section before Price Range", () => {
    render(<RefineFilters {...baseProps()} />);
    const sold = screen.getByText(/sold within the last few/i);
    const price = screen.getByText(/^Price Range/i);
    // DOM order check via compareDocumentPosition
    const cmp = sold.compareDocumentPosition(price);
    expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/refine-filters.test.tsx -- --run
```

Expected: the three new cases FAIL.

- [ ] **Step 3: Insert sold-within section above Price Range**

In `RefineFilters.tsx`, **insert the following block before** the existing `{/* Price Range */}` fieldset (currently around line 109):

```tsx
      {/* Sold within the last few — Land Registry */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Sold within the last few
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SOLD_WITHIN_OPTIONS.map(({ value, label }) => {
            const active = state.soldWithin === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                  active
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                )}
              >
                <input
                  type="radio"
                  name="refine-sold-within"
                  value={value}
                  checked={active}
                  onChange={() => onChange({ soldWithin: value })}
                  className="size-4 accent-brand-primary"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
```

Add the options constant near the top of the file (next to `PROPERTY_TYPE_OPTIONS`):

```ts
import type { SearchState, SoldWithin } from "@/lib/search/url-state";

const SOLD_WITHIN_OPTIONS: ReadonlyArray<{ value: SoldWithin; label: string }> = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "Show all" },
];
```

(Adjust the existing `import type` line above — `SoldWithin` is exported from `url-state.ts` per Task 2.)

- [ ] **Step 4: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/refine-filters.test.tsx -- --run
```

Expected: PASS, all cases green.

- [ ] **Step 5: Lint + type check**

Run:
```bash
cd britv3 && pnpm lint && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add src/components/search/RefineFilters.tsx src/__tests__/search/refine-filters.test.tsx
git commit -m "feat(search-ui): add Sold within the last few filter (land registry)"
```

---

## Task 11: `land-registry-service` — Upsert `property_last_sold` on Fetch

**Files:**
- Find: `britv3/src/server/land-registry/land-registry-service.ts` _(path verified in Step 1)_
- Modify: same file
- Test: matching `*.test.ts` next to the service or under `src/__tests__/server/`

- [ ] **Step 1: Locate the service**

Run:
```bash
cd britv3 && find src -name "land-registry*.ts" -not -path "*/node_modules/*" 2>/dev/null
grep -rn "insight_type.*=.*'land_registry'\|insight_type:.*\"land_registry\"" src/ 2>/dev/null | head
```

Identify the file that fetches LR data and writes to `property_insights`. Note the exact path — the spec assumes `src/server/land-registry/land-registry-service.ts` but the actual path may differ.

- [ ] **Step 2: Identify the LR response shape**

Open the service. Find the type/shape of the LR fetch result (the value being written to `property_insights.data`). Locate the array key and the date field key — these were confirmed in Task 5.

- [ ] **Step 3: Locate or create the matching test file**

Look for an existing test:
```bash
cd britv3 && find src -name "land-registry*.test.ts" -not -path "*/node_modules/*" 2>/dev/null
```

Create alongside the service if absent (e.g., `src/server/land-registry/land-registry-service.test.ts`).

- [ ] **Step 4: Write failing tests**

Add to the test file:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Adjust the import path to the verified service path from Step 1.
import { upsertLastSoldFromInsight } from "@/server/land-registry/land-registry-service";

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { from: mockFrom },
}));

describe("upsertLastSoldFromInsight", () => {
  beforeEach(() => {
    mockUpsert.mockClear();
    mockFrom.mockClear();
  });

  it("upserts the maximum date_of_transfer", async () => {
    await upsertLastSoldFromInsight("prop-1", {
      transactions: [
        { date_of_transfer: "2024-03-01" },
        { date_of_transfer: "2025-08-15" },
        { date_of_transfer: "2023-01-20" },
      ],
    });
    expect(mockFrom).toHaveBeenCalledWith("property_last_sold");
    expect(mockUpsert).toHaveBeenCalledWith(
      { property_id: "prop-1", last_sold_date: "2025-08-15", source: "hmlr" },
      { onConflict: "property_id" },
    );
  });

  it("does not upsert when transactions array is empty", async () => {
    await upsertLastSoldFromInsight("prop-2", { transactions: [] });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("does not throw when transactions key is missing", async () => {
    await expect(
      upsertLastSoldFromInsight("prop-3", {} as unknown as { transactions: never[] }),
    ).resolves.not.toThrow();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
```

If the LR JSON shape uses different keys (per Task 5), substitute them in both the test input and the helper signature.

- [ ] **Step 5: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test [path-to-test-file] -- --run
```

Expected: FAIL — `upsertLastSoldFromInsight` not exported.

- [ ] **Step 6: Implement the helper**

In `land-registry-service.ts` (or the verified path), add:

```ts
import { supabaseAdmin } from "@/lib/supabase/admin";

type LandRegistryInsight = {
  transactions?: Array<{ date_of_transfer?: string | null }>;
};

function extractLatestSaleDate(insight: LandRegistryInsight): string | null {
  const txns = insight?.transactions;
  if (!Array.isArray(txns) || txns.length === 0) return null;
  let latest: string | null = null;
  for (const t of txns) {
    const d = t?.date_of_transfer;
    if (typeof d === "string" && (!latest || d > latest)) {
      latest = d;
    }
  }
  return latest;
}

export async function upsertLastSoldFromInsight(
  propertyId: string,
  insight: LandRegistryInsight,
): Promise<void> {
  const latest = extractLatestSaleDate(insight);
  if (!latest) return;
  const { error } = await supabaseAdmin
    .from("property_last_sold")
    .upsert(
      { property_id: propertyId, last_sold_date: latest, source: "hmlr" },
      { onConflict: "property_id" },
    );
  if (error) {
    console.error("[land-registry] property_last_sold upsert failed:", error.message);
  }
}
```

(Substitute the actual admin Supabase client import — the path `@/lib/supabase/admin` is typical for this repo but the exact name should be verified by grepping for `service_role`-using clients.)

- [ ] **Step 7: Wire the helper into the LR fetch path**

Find the function in the service that returns LR data and writes to `property_insights`. After the successful cache write, call:

```ts
await upsertLastSoldFromInsight(propertyId, landRegistryResponse);
```

Do not throw on failure — the helper logs and returns. The LR fetch result is the source of truth for the property-detail surface; the sidecar is a search-side enrichment.

- [ ] **Step 8: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test [path-to-test-file] -- --run
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add [service path] [test path]
git commit -m "feat(land-registry): upsert property_last_sold on LR fetch"
```

---

## Task 12: Empty-State Copy When Sold-Within Filter Active

**Files:**
- Modify: `britv3/src/app/(main)/search/page.tsx` (or wherever the empty state lives)

- [ ] **Step 1: Find the existing empty-state**

Run:
```bash
cd britv3 && grep -rn "no results\|No properties\|no matching\|empty" src/app/\(main\)/search/ src/components/search/ 2>/dev/null | head -20
ls src/__tests__/search/empty-state.test.tsx 2>/dev/null
```

Locate the JSX block that renders when `data.length === 0`. Note the component name and file. Note whether `empty-state.test.tsx` already exists and what it asserts.

- [ ] **Step 2: Write failing test**

Append to `britv3/src/__tests__/search/empty-state.test.tsx` (or extend per its existing structure):

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
// Import the component that renders the empty state — adjust path per Step 1.
// e.g.: import { EmptyResults } from "@/components/search/EmptyResults";

describe("Empty state — sold-within filter active", () => {
  it("shows the Land Registry coverage note when soldWithin is not 'all'", () => {
    // Render with soldWithin='3m' (mock or pass prop per actual component shape)
    // ...
    expect(
      screen.getByText(/Only listings whose last sale is in HM Land Registry/i),
    ).toBeInTheDocument();
  });

  it("provides a 'Show all' reset that clears soldWithin", () => {
    const onReset = vi.fn();
    // ... render with onReset={onReset} and soldWithin='3m'
    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(onReset).toHaveBeenCalled();
  });
});
```

(The test must adapt to the actual empty-state component's prop shape — flesh out after Step 1.)

- [ ] **Step 3: Run tests — confirm failure**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/empty-state.test.tsx -- --run
```

Expected: FAIL.

- [ ] **Step 4: Add the conditional copy**

In the empty-state component, render the additional copy + reset button when `state.soldWithin !== "all"`:

```tsx
{state.soldWithin !== "all" && (
  <p className="mt-2 text-sm text-neutral-500">
    Only listings whose last sale is in HM Land Registry can be filtered by date.{" "}
    <button
      type="button"
      onClick={() => onChange({ soldWithin: "all" })}
      className="font-bold text-brand-primary underline-offset-2 hover:underline"
    >
      Show all
    </button>{" "}
    to see listings without a recorded sale.
  </p>
)}
```

Wire `state` and `onChange` (or equivalent reset callback) through the empty-state component's props if not already there.

- [ ] **Step 5: Run tests — confirm pass**

Run:
```bash
cd britv3 && pnpm test src/__tests__/search/empty-state.test.tsx -- --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git add [empty-state path] src/__tests__/search/empty-state.test.tsx
git commit -m "feat(search-ui): explain land-registry coverage gap in empty state"
```

---

## Task 13: Full Verification — Lint, Build, Test, Smoke

**Files:**
- None (verification)

- [ ] **Step 1: Lint**

Run:
```bash
cd britv3 && pnpm lint
```

Expected: 0 errors.

- [ ] **Step 2: Type check**

Run:
```bash
cd britv3 && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Full test suite**

Run:
```bash
cd britv3 && pnpm test -- --run
```

Expected: full suite green. If any unrelated test newly fails because of the `beds → bedsMin/bedsMax` rename, update those tests in-place — they are touched by Task 2's type change. **Do not** mark this complete with failing tests.

Read the actual failure message before triaging. Tests that fail due to your feature code are your bug — not pre-existing.

- [ ] **Step 4: Build**

Run:
```bash
cd britv3 && pnpm build
```

Expected: exit 0. Watch for the real error message after the OTel warnings — the first failing TypeScript line is the one to fix.

- [ ] **Step 5: Migration check**

Run:
```bash
cd britv3 && pnpm check:migrations
```

Expected: exit 0.

- [ ] **Step 6: Smoke-test in dev browser**

Start the dev server:
```bash
cd britv3 && pnpm dev
```

Open `http://localhost:3000/search` and:

- [ ] Confirm the filter panel renders with the new "Sold within the last few" section above Price Range, with `Show all` selected by default.
- [ ] Confirm the Bedrooms section shows a single "Bedrooms" label with Min — Max selects side-by-side.
- [ ] Toggle Min from Any → 2 → confirm URL adds `?bedsMin=2`, results re-fetch.
- [ ] Toggle Max from Any → 4 → confirm URL adds `&bedsMax=4`.
- [ ] Toggle Min → 5+, Max → 2, click Search → confirm Max clamps up to 5+.
- [ ] Toggle sold-within to "3 months" → confirm URL adds `&soldWithin=3m`, results re-fetch.
- [ ] If no results, confirm the empty state shows the Land Registry coverage note and "Show all" button.
- [ ] Click "Show all" → confirm `soldWithin` URL param disappears and results return.
- [ ] Toggle sold-within back to "Show all" via the filter radio → confirm URL param disappears (default omitted).
- [ ] Visual: filter panel uses brand-primary green, no blue accents (per the main/public brand policy).

- [ ] **Step 7: Final commit + push branch (do not merge)**

If the smoke test passed, push the branch for review:

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git log --oneline origin/main..HEAD
git push -u origin feature/search-filters-sold-within-rooms
```

Expected: `git log` shows the spec commit plus all task commits, in order. `git push` succeeds.

**Do not merge.** Branch-and-PR discipline (CLAUDE.md `docs/BRANCH_WORKFLOW.md`) requires a PR with CI green and squash-merge — handled in a separate step by the user.

---

## Self-Review

### Spec coverage

| Spec section | Task(s) |
|---|---|
| UI: Sold-within radio group above Price Range | Task 10 |
| UI: Bedrooms Min/Max replacing single select | Task 9 |
| URL state: SearchState shape, parse, serialize | Task 2 |
| Data: `property_last_sold` table | Task 4 |
| Data: backfill from `property_insights` | Tasks 5 + 6 |
| Data: `search_listings` matview extension | Task 7 |
| Query: bedrooms gte/lte, soldWithin gte | Task 8 |
| `computeSoldSince` helper | Task 3 |
| Land-registry-service upsert | Task 11 |
| Empty-state copy | Task 12 |
| Verification + smoke | Task 13 |

All decision-log items in the spec map to at least one task. The "5+ handled as no upper bound on max side" detail is exercised by Task 8 Step 4 (mock case) and Task 9 Step 1 (clamp test for Min > Max).

### Placeholder scan

- No "TBD" or "TODO" markers in task steps.
- Task 5 is a verification task with no code change — explicitly bounded, not a placeholder.
- Task 7 uses an explicit "paste the existing column list" instruction with a column-list scaffold — the executor is required to substitute the real list from Step 1, not invent. This is a deliberate gate against fabricating matview internals.
- Task 11 Step 6 imports `@/lib/supabase/admin` with a note to verify the actual path — flagged, not blind.

### Type consistency

- `SoldWithin` exported from `url-state.ts`, re-exported by `sold-within.ts`, consumed by `actions.ts` and `RefineFilters.tsx`. Same name throughout.
- `BEDROOM_OPTIONS` defined in `url-state.ts`, imported by `RefineFilters.tsx` (Task 9 removes the local copy).
- `rankBedsMin` (min side, 5+ → 5) and `rankBeds` (max side, 5+ → null/no bound) — same names used in both mock filter and Supabase query path (Task 8).
- `computeSoldSince` signature `(SoldWithin, Date) → string | null` — same in tests, helper, mock filter, and Supabase path.
- `upsertLastSoldFromInsight(propertyId, insight)` — same signature in test and helper.

No drift detected.

---

**Plan complete and saved to `britv3/docs/superpowers/plans/2026-06-19-search-filters-sold-within-rooms.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

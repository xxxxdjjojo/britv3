# Permitted Development ("What You Could Build") Layer — Design

**Date:** 2026-06-20
**Status:** Approved (brainstorm) → pending implementation plan
**Surface:** Property detail page (`app/(main)/properties/[slug]/page.tsx`), renovation area

## Summary

Add an indicative "what you could build" layer to the property detail page that
tells a visitor which common householder projects are *likely permissible under
UK permitted development (PD) rights*, scoped by property type. It complements
the existing **RenovationROIPanel** ("is it worth it?" — cost + value uplift)
with feasibility ("are you allowed to?").

The layer is **indicative by property type only** — no per-property planning
data (we do not store conservation-area, Article 4, listed-building, or
green-belt flags). It is strongly caveated and directs users to confirm with
their local planning authority.

## Decisions (from brainstorm)

1. **Rigor:** Indicative by property type. No new per-property data sources.
2. **Integration:** Add a feasibility badge to each renovation scenario card,
   plus one concise "Permitted development potential" summary block. No
   duplicate sections; do not refactor/absorb the ROI panel.
3. **Breadth:** Common householder PD set — rear/single-storey extension, side
   return, loft/dormer conversion, outbuilding/garden room, garage conversion,
   porch.
4. **Implementation shape:** Static curated ruleset (Approach A) — a typed data
   module + pure function. No DB table, no API, no migration.

## Architecture & data flow

Synchronous, in-memory. No DB, API, Suspense, or async failure modes.

```
permitted-development-rules.ts   (typed ruleset: property_type → scenarios)
        │
assessPermittedDevelopment(propertyType, opts?)   (pure fn → PdAssessment)
        │
        ├──► PermittedDevelopmentSummary  (new section component)
        └──► FeasibilityBadge  ◄── reused inside RenovationScenarioCard
```

`assessPermittedDevelopment(propertyType, opts?)` accepts an optional `opts`
argument reserved as the single seam for future constraint-awareness (e.g.
`{ conservationArea?: boolean }`); today it uses only `propertyType`.

## Types

```ts
type PdScenario =
  | "rear_extension"
  | "side_return"
  | "loft_dormer"
  | "outbuilding_garden_room"
  | "garage_conversion"
  | "porch";

type PdFeasibility = "likely_permitted" | "needs_full_planning" | "not_applicable";

type PdScenarioAssessment = {
  scenario: PdScenario;
  label: string; // e.g. "Rear/single-storey extension"
  feasibility: PdFeasibility;
  note: string; // one-line plain-English rationale
};

type PdAssessment = {
  applicable: boolean; // false for flats/maisonettes/studios/penthouses/land/other
  scenarios: PdScenarioAssessment[]; // [] when not applicable
  headline: string;
};
```

`PdScenario` and `PdFeasibility` are string-literal unions (per repo TS style).
`propertyType` is the DB `property_type` enum
(`Constants.public.Enums.property_type`).

## Components & integration

- **`FeasibilityBadge`** (`src/components/properties/roi/FeasibilityBadge.tsx`):
  small pill with icon + accessible label.
  - `likely_permitted` → green ("Likely permitted development")
  - `needs_full_planning` → amber ("Likely needs full planning")
  - `not_applicable` → grey ("Not applicable")
  - Brand: deep green `#1B4D3E` / lighter greens; amber + grey only for the
    non-permitted states. No blue/rainbow (public-page colour policy).

- **`RenovationScenarioCard`** (existing): add an optional
  `feasibility?: PdFeasibility` prop. When present, render a `FeasibilityBadge`.
  Purely additive — no behaviour change when the prop is absent.

- **Page mapping:** in `page.tsx`, map the existing ROI scenario types to PD
  scenarios to drive the badge: `loft_conversion → loft_dormer`,
  `extension → rear_extension`. Scenarios with no PD mapping render no badge.

- **`PermittedDevelopmentSummary`**
  (`src/components/properties/detail/PermittedDevelopmentSummary.tsx`):
  server component, takes `propertyType`. Calls `assessPermittedDevelopment`.
  - `applicable === true`: headline + compact list of the 6 scenarios
    (label + `FeasibilityBadge` + note) + prominent caveat footer.
  - `applicable === false`: short note — "Permitted development rights
    generally don't apply to flats and maisonettes; most changes need
    freeholder consent and/or planning permission" — + caveat footer.
  - Self-gating, synchronous (no Suspense).

- **Placement:** render `PermittedDevelopmentSummary` in the existing renovation
  area of the left column in `page.tsx`, near `RenovationROIPanel`.

## Content rules (the matrix)

Houses — `detached`, `semi_detached`, `terraced`, `cottage`, `bungalow` — get the
full householder set. Type nuances are expressed in each `note`.

| Scenario | detached | semi_detached / terraced | bungalow | flat / maisonette / studio / penthouse |
|---|---|---|---|---|
| Rear/single-storey extension | likely_permitted | likely_permitted (terraced: smaller depth limits) | likely_permitted | not_applicable |
| Side return | likely_permitted | needs_full_planning (semi/terraced) | likely_permitted | not_applicable |
| Loft / dormer | likely_permitted | likely_permitted (rear dormer; smaller volume allowance) | likely_permitted | not_applicable |
| Outbuilding / garden room | likely_permitted | likely_permitted | likely_permitted | not_applicable |
| Garage conversion | likely_permitted | likely_permitted | likely_permitted | not_applicable |
| Porch | likely_permitted | likely_permitted | likely_permitted | not_applicable |

- `flat`, `maisonette`, `studio`, `penthouse`, `land`, `other` →
  `applicable: false`, `scenarios: []`.
- `cottage` is treated as a house but its note flags the common conservation-
  area / listed-status caveat more prominently.

### Standard caveat (summary footer)

> Indicative only, based on property type. Permitted development rights are
> removed or restricted in conservation areas, by Article 4 directions, for
> listed buildings, and where rights have already been used. Always confirm
> with your local planning authority before starting any work.

## Error handling & edge cases

- Unknown / unmapped `property_type` → `applicable: false` with the neutral
  message. No throws.
- No external calls, no PII, nothing to log or rate-limit.

## Testing (Vitest, behaviour-first)

1. `assessPermittedDevelopment` returns correct `applicable` + per-scenario
   `feasibility` for each property type (table-driven across the full enum).
2. `flat`, `maisonette`, `studio`, `penthouse`, `land`, `other` →
   `applicable: false`, `scenarios: []`.
3. Every returned scenario has a non-empty `label` and `note`.
4. `FeasibilityBadge` renders the correct label + variant for each
   `PdFeasibility`.
5. `PermittedDevelopmentSummary` renders the caveat footer always, the scenario
   list for a house type, and the non-applicable message for a flat.
6. `RenovationScenarioCard` renders a badge when `feasibility` is passed and
   none when it is omitted.

## Out of scope

- Per-property constraint data (conservation area, Article 4, listed, green
  belt) — reserved via the `opts` seam for a future iteration.
- Change-of-use, basement, two-storey, annexe, flat-conversion, and
  commercial-to-residential scenarios.
- Any DB table, migration, or external API.

## Files

New:
- `src/lib/properties/permitted-development-rules.ts` (ruleset + `assessPermittedDevelopment`)
- `src/components/properties/roi/FeasibilityBadge.tsx`
- `src/components/properties/detail/PermittedDevelopmentSummary.tsx`
- Tests alongside each.

Modified:
- `src/components/properties/roi/RenovationScenarioCard.tsx` (optional `feasibility` prop)
- `src/app/(main)/properties/[slug]/page.tsx` (render summary + map ROI→PD for badges)

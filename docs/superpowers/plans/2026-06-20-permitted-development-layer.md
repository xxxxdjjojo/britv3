# Permitted Development "What You Could Build" Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an indicative, property-type-scoped "what you could build" (permitted development) layer to the property detail page — a summary block plus feasibility badges on the existing renovation ROI cards.

**Architecture:** A pure, static, in-memory ruleset (`permitted-development-rules.ts`) exposes `assessPermittedDevelopment(propertyType)`. A presentational `FeasibilityBadge` is rendered inside the existing `RenovationScenarioCard` (via a new optional prop) and inside a new `PermittedDevelopmentSummary` server component placed in the renovation area of the property page. No DB, no API, no migration, no async.

**Tech Stack:** Next.js 16 App Router (RSC), React 19, TypeScript 5 (strict), Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-20-permitted-development-layer-design.md`

**Working dir:** worktree `/Users/jojominime/Documents/britv3main/wt-pd-layer`, branch `feat/permitted-development-layer`. Run all `pnpm` commands from this worktree root.

**Conventions:** double quotes, semicolons, 2-space indent, trailing commas. `import type` for type-only imports. Deep green `#1B4D3E` + lighter greens; amber/grey only for non-permitted states; no blue/rainbow.

---

## Task 1: Permitted-development ruleset + assessment function

**Files:**
- Create: `src/lib/properties/permitted-development-rules.ts`
- Test: `src/lib/properties/permitted-development-rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/properties/permitted-development-rules.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  assessPermittedDevelopment,
  roiTypeToPdScenario,
  PD_SCENARIO_ORDER,
} from "./permitted-development-rules";

describe("assessPermittedDevelopment", () => {
  const houseTypes = ["detached", "semi_detached", "terraced", "cottage", "bungalow"];
  const nonApplicableTypes = ["flat", "maisonette", "studio", "penthouse", "land", "other"];

  it.each(houseTypes)("marks %s as applicable with all scenarios", (type) => {
    const result = assessPermittedDevelopment(type);
    expect(result.applicable).toBe(true);
    expect(result.scenarios).toHaveLength(PD_SCENARIO_ORDER.length);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it.each(nonApplicableTypes)("marks %s as not applicable with no scenarios", (type) => {
    const result = assessPermittedDevelopment(type);
    expect(result.applicable).toBe(false);
    expect(result.scenarios).toEqual([]);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it("returns not applicable for an unknown property type", () => {
    const result = assessPermittedDevelopment("spaceship");
    expect(result.applicable).toBe(false);
    expect(result.scenarios).toEqual([]);
  });

  it("every applicable scenario has a non-empty label and note", () => {
    for (const scenario of assessPermittedDevelopment("detached").scenarios) {
      expect(scenario.label.length).toBeGreaterThan(0);
      expect(scenario.note.length).toBeGreaterThan(0);
    }
  });

  it("marks side return as needs_full_planning for terraced but likely_permitted for detached", () => {
    const terraced = assessPermittedDevelopment("terraced").scenarios.find(
      (s) => s.scenario === "side_return",
    );
    const detached = assessPermittedDevelopment("detached").scenarios.find(
      (s) => s.scenario === "side_return",
    );
    expect(terraced?.feasibility).toBe("needs_full_planning");
    expect(detached?.feasibility).toBe("likely_permitted");
  });
});

describe("roiTypeToPdScenario", () => {
  it("maps known ROI renovation types to PD scenarios", () => {
    expect(roiTypeToPdScenario("loft_conversion")).toBe("loft_dormer");
    expect(roiTypeToPdScenario("extension")).toBe("rear_extension");
  });

  it("returns null for ROI types with no PD scenario", () => {
    expect(roiTypeToPdScenario("kitchen")).toBeNull();
    expect(roiTypeToPdScenario("anything_else")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/properties/permitted-development-rules.test.ts`
Expected: FAIL — cannot resolve `./permitted-development-rules`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/properties/permitted-development-rules.ts`:

```ts
/**
 * Permitted Development ("what you could build") ruleset.
 *
 * Pure, static, in-memory. Indicative by property type only — there is NO
 * per-property planning data (conservation area, Article 4, listed status are
 * not stored). England-oriented householder PD rules of thumb. Always shown
 * with the standard caveat (see PD_CAVEAT). Not legal advice.
 *
 * Future constraint-awareness hooks in via the optional `opts` arg.
 */

export type PdScenario =
  | "rear_extension"
  | "side_return"
  | "loft_dormer"
  | "outbuilding_garden_room"
  | "garage_conversion"
  | "porch";

export type PdFeasibility =
  | "likely_permitted"
  | "needs_full_planning"
  | "not_applicable";

export type PdScenarioAssessment = {
  scenario: PdScenario;
  label: string;
  feasibility: PdFeasibility;
  note: string;
};

export type PdAssessment = {
  applicable: boolean;
  scenarios: PdScenarioAssessment[];
  headline: string;
};

export type PdAssessmentOptions = {
  // Reserved for future per-property constraint-awareness. Unused today.
  conservationArea?: boolean;
};

/** Canonical scenario order for display + count assertions. */
export const PD_SCENARIO_ORDER: readonly PdScenario[] = [
  "rear_extension",
  "side_return",
  "loft_dormer",
  "outbuilding_garden_room",
  "garage_conversion",
  "porch",
] as const;

export const PD_SCENARIO_LABELS: Record<PdScenario, string> = {
  rear_extension: "Rear/single-storey extension",
  side_return: "Side return / side extension",
  loft_dormer: "Loft / dormer conversion",
  outbuilding_garden_room: "Outbuilding / garden room",
  garage_conversion: "Garage conversion",
  porch: "Porch",
};

export const PD_CAVEAT =
  "Indicative only, based on property type. Permitted development rights are " +
  "removed or restricted in conservation areas, by Article 4 directions, for " +
  "listed buildings, and where rights have already been used. Always confirm " +
  "with your local planning authority before starting any work.";

type HouseProfile = Record<PdScenario, { feasibility: PdFeasibility; note: string }>;

const DETACHED_LIKE: HouseProfile = {
  rear_extension: {
    feasibility: "likely_permitted",
    note: "Single-storey rear extensions are often permitted within depth and height limits.",
  },
  side_return: {
    feasibility: "likely_permitted",
    note: "Side extensions are often possible on detached/bungalow plots within width limits.",
  },
  loft_dormer: {
    feasibility: "likely_permitted",
    note: "Loft conversions with rear dormers are often permitted within volume limits.",
  },
  outbuilding_garden_room: {
    feasibility: "likely_permitted",
    note: "Garden rooms/outbuildings are often permitted if single-storey and within size limits.",
  },
  garage_conversion: {
    feasibility: "likely_permitted",
    note: "Converting an attached garage to living space is often permitted development.",
  },
  porch: {
    feasibility: "likely_permitted",
    note: "Small front porches are often permitted within floor-area and height limits.",
  },
};

const SEMI_TERRACED: HouseProfile = {
  rear_extension: {
    feasibility: "likely_permitted",
    note: "Single-storey rear extensions are often permitted, with smaller depth limits than detached homes.",
  },
  side_return: {
    feasibility: "needs_full_planning",
    note: "Side extensions on semi-detached/terraced homes usually need full planning permission.",
  },
  loft_dormer: {
    feasibility: "likely_permitted",
    note: "Rear dormer loft conversions are often permitted within a smaller volume allowance.",
  },
  outbuilding_garden_room: {
    feasibility: "likely_permitted",
    note: "Garden rooms/outbuildings are often permitted if single-storey and within size limits.",
  },
  garage_conversion: {
    feasibility: "likely_permitted",
    note: "Converting an attached garage to living space is often permitted development.",
  },
  porch: {
    feasibility: "likely_permitted",
    note: "Small front porches are often permitted within floor-area and height limits.",
  },
};

// detached & bungalow share the generous profile; semi/terraced/cottage share the tighter one.
const HOUSE_PROFILES: Record<string, HouseProfile> = {
  detached: DETACHED_LIKE,
  bungalow: DETACHED_LIKE,
  semi_detached: SEMI_TERRACED,
  terraced: SEMI_TERRACED,
  cottage: SEMI_TERRACED,
};

const HOUSE_HEADLINE =
  "Homes like this often have permitted development rights for common projects — subject to checks:";

const NOT_APPLICABLE_HEADLINE =
  "Permitted development rights generally don't apply to flats and maisonettes — most changes need freeholder consent and/or planning permission.";

/**
 * Maps the ROI service renovation types to PD scenarios (for the badge on the
 * renovation scenario cards). Returns null when there is no PD equivalent.
 */
export function roiTypeToPdScenario(roiType: string): PdScenario | null {
  switch (roiType) {
    case "loft_conversion":
      return "loft_dormer";
    case "extension":
      return "rear_extension";
    default:
      return null;
  }
}

export function assessPermittedDevelopment(
  propertyType: string,
  _opts: PdAssessmentOptions = {},
): PdAssessment {
  const profile = HOUSE_PROFILES[propertyType];

  if (!profile) {
    return {
      applicable: false,
      scenarios: [],
      headline: NOT_APPLICABLE_HEADLINE,
    };
  }

  const scenarios: PdScenarioAssessment[] = PD_SCENARIO_ORDER.map((scenario) => ({
    scenario,
    label: PD_SCENARIO_LABELS[scenario],
    feasibility: profile[scenario].feasibility,
    note: profile[scenario].note,
  }));

  return { applicable: true, scenarios, headline: HOUSE_HEADLINE };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/properties/permitted-development-rules.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/properties/permitted-development-rules.ts src/lib/properties/permitted-development-rules.test.ts
git commit -m "feat(properties): permitted-development ruleset + assessment function"
```

---

## Task 2: FeasibilityBadge component

**Files:**
- Create: `src/components/properties/roi/FeasibilityBadge.tsx`
- Test: `src/components/properties/roi/FeasibilityBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/properties/roi/FeasibilityBadge.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeasibilityBadge } from "./FeasibilityBadge";

describe("FeasibilityBadge", () => {
  it("renders the permitted label", () => {
    render(<FeasibilityBadge feasibility="likely_permitted" />);
    expect(screen.getByText("Likely permitted development")).toBeInTheDocument();
  });

  it("renders the needs-planning label", () => {
    render(<FeasibilityBadge feasibility="needs_full_planning" />);
    expect(screen.getByText("Likely needs full planning")).toBeInTheDocument();
  });

  it("renders the not-applicable label", () => {
    render(<FeasibilityBadge feasibility="not_applicable" />);
    expect(screen.getByText("Not applicable")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/properties/roi/FeasibilityBadge.test.tsx`
Expected: FAIL — cannot resolve `./FeasibilityBadge`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/properties/roi/FeasibilityBadge.tsx`:

```tsx
/**
 * FeasibilityBadge
 *
 * Small pill showing permitted-development feasibility. Presentational,
 * server component. Brand: green for permitted, amber for needs-planning,
 * grey for not-applicable (no blue/rainbow — public-page colour policy).
 */

import type { PdFeasibility } from "@/lib/properties/permitted-development-rules";

type Props = Readonly<{
  feasibility: PdFeasibility;
}>;

const badge: Record<PdFeasibility, { label: string; className: string }> = {
  likely_permitted: {
    label: "Likely permitted development",
    className: "bg-green-100 text-[#1B4D3E] border border-green-200",
  },
  needs_full_planning: {
    label: "Likely needs full planning",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  not_applicable: {
    label: "Not applicable",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

export function FeasibilityBadge({ feasibility }: Props) {
  const { label, className } = badge[feasibility];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/properties/roi/FeasibilityBadge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/properties/roi/FeasibilityBadge.tsx src/components/properties/roi/FeasibilityBadge.test.tsx
git commit -m "feat(properties): FeasibilityBadge component"
```

---

## Task 3: Add optional feasibility prop to RenovationScenarioCard

**Files:**
- Modify: `src/components/properties/roi/RenovationScenarioCard.tsx`
- Test: `src/components/properties/roi/RenovationScenarioCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/properties/roi/RenovationScenarioCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenovationScenarioCard } from "./RenovationScenarioCard";
import type { ROIRenovation } from "@/services/properties/roi-estimation-service";

const renovation: ROIRenovation = {
  type: "loft_conversion",
  cost_low: 30000,
  cost_high: 50000,
  value_uplift_pct: 15,
  confidence: "high",
};

describe("RenovationScenarioCard feasibility badge", () => {
  it("renders a feasibility badge when feasibility is provided", () => {
    render(<RenovationScenarioCard renovation={renovation} feasibility="likely_permitted" />);
    expect(screen.getByText("Likely permitted development")).toBeInTheDocument();
  });

  it("renders no feasibility badge when feasibility is omitted", () => {
    render(<RenovationScenarioCard renovation={renovation} />);
    expect(screen.queryByText("Likely permitted development")).not.toBeInTheDocument();
    expect(screen.queryByText("Likely needs full planning")).not.toBeInTheDocument();
  });
});
```

> Note: if the real `ROIRenovation` type has more required fields, copy its exact shape from `src/services/properties/roi-estimation-service.ts` into the `renovation` fixture so the file type-checks. Do not change the source type.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/properties/roi/RenovationScenarioCard.test.tsx`
Expected: FAIL — `feasibility` is not a valid prop / badge not rendered.

- [ ] **Step 3: Write minimal implementation**

In `src/components/properties/roi/RenovationScenarioCard.tsx`:

Add the import near the top (after the existing `ROIRenovation` import):

```tsx
import type { PdFeasibility } from "@/lib/properties/permitted-development-rules";
import { FeasibilityBadge } from "./FeasibilityBadge";
```

Change the `Props` type from:

```tsx
type Props = Readonly<{
  renovation: ROIRenovation;
}>;
```

to:

```tsx
type Props = Readonly<{
  renovation: ROIRenovation;
  feasibility?: PdFeasibility;
}>;
```

Change the component signature from:

```tsx
export function RenovationScenarioCard({ renovation }: Props) {
```

to:

```tsx
export function RenovationScenarioCard({ renovation, feasibility }: Props) {
```

Then, immediately after the closing `</div>` of the "Value uplift" block and before the closing `</article>`, add:

```tsx
      {/* Permitted-development feasibility (only when known for this scenario) */}
      {feasibility && (
        <div className="pt-1">
          <FeasibilityBadge feasibility={feasibility} />
        </div>
      )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/properties/roi/RenovationScenarioCard.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/properties/roi/RenovationScenarioCard.tsx src/components/properties/roi/RenovationScenarioCard.test.tsx
git commit -m "feat(properties): optional PD feasibility badge on RenovationScenarioCard"
```

---

## Task 4: Wire feasibility into RenovationROIPanel

**Files:**
- Modify: `src/components/properties/roi/RenovationROIPanel.tsx`

This task has no new test of its own (it is thin wiring verified by the page render + Task 5's manual check). It maps each ROI renovation to its PD feasibility and passes it to the card.

- [ ] **Step 1: Implement the wiring**

In `src/components/properties/roi/RenovationROIPanel.tsx`:

Add imports near the existing imports:

```tsx
import {
  assessPermittedDevelopment,
  roiTypeToPdScenario,
} from "@/lib/properties/permitted-development-rules";
```

Inside the component, after `const estimate = await estimateROI(property, supabase);`, add (note: this file uses the `@/types/property` `Property` type, whose field is `property_type` snake_case — NOT `propertyType`):

```tsx
  const pd = assessPermittedDevelopment(property.property_type);
  const feasibilityFor = (roiType: string) => {
    const scenario = roiTypeToPdScenario(roiType);
    if (!scenario) return undefined;
    return pd.scenarios.find((s) => s.scenario === scenario)?.feasibility;
  };
```

Then update the card render. Change:

```tsx
              <li key={renovation.type}>
                <RenovationScenarioCard renovation={renovation} />
              </li>
```

to:

```tsx
              <li key={renovation.type}>
                <RenovationScenarioCard
                  renovation={renovation}
                  feasibility={feasibilityFor(renovation.type)}
                />
              </li>
```

> Confirmed: `@/types/property` `Property` has `property_type: PropertyType` (a string-literal union, assignable to the `string` param). Use `property.property_type` here. (The page in Task 6 uses a different object — `PropertyDetail.property` — whose field is `propertyType`.)

- [ ] **Step 2: Type-check the change**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/roi/RenovationROIPanel.tsx
git commit -m "feat(properties): pass PD feasibility from ROI panel to scenario cards"
```

---

## Task 5: PermittedDevelopmentSummary component

**Files:**
- Create: `src/components/properties/detail/PermittedDevelopmentSummary.tsx`
- Test: `src/components/properties/detail/PermittedDevelopmentSummary.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/properties/detail/PermittedDevelopmentSummary.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermittedDevelopmentSummary } from "./PermittedDevelopmentSummary";

describe("PermittedDevelopmentSummary", () => {
  it("renders the scenario list and caveat for a house type", () => {
    render(<PermittedDevelopmentSummary propertyType="detached" />);
    expect(screen.getByText("Rear/single-storey extension")).toBeInTheDocument();
    expect(screen.getByText("Loft / dormer conversion")).toBeInTheDocument();
    expect(
      screen.getByText(/Always confirm with your local planning authority/i),
    ).toBeInTheDocument();
  });

  it("renders the not-applicable message and caveat for a flat", () => {
    render(<PermittedDevelopmentSummary propertyType="flat" />);
    expect(
      screen.getByText(/Permitted development rights generally don't apply/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Rear/single-storey extension")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Always confirm with your local planning authority/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/properties/detail/PermittedDevelopmentSummary.test.tsx`
Expected: FAIL — cannot resolve `./PermittedDevelopmentSummary`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/properties/detail/PermittedDevelopmentSummary.tsx`:

```tsx
/**
 * PermittedDevelopmentSummary
 *
 * Server component. Indicative "what you could build" block scoped to the
 * property type. Self-gating: shows the scenario list for house types and a
 * short not-applicable message for flats/maisonettes/land/other. Always
 * renders the standard caveat. Not legal advice.
 */

import {
  assessPermittedDevelopment,
  PD_CAVEAT,
} from "@/lib/properties/permitted-development-rules";
import { FeasibilityBadge } from "@/components/properties/roi/FeasibilityBadge";

type Props = Readonly<{
  propertyType: string;
}>;

export function PermittedDevelopmentSummary({ propertyType }: Props) {
  const pd = assessPermittedDevelopment(propertyType);

  return (
    <section aria-labelledby="pd-heading" className="space-y-4">
      <h2
        id="pd-heading"
        className="font-semibold text-xl text-[#1B4D3E]"
        style={{ fontFamily: "var(--font-plus-jakarta-sans, 'Plus Jakarta Sans', sans-serif)" }}
      >
        What you could build
      </h2>

      <p className="text-sm text-gray-600">{pd.headline}</p>

      {pd.applicable && (
        <ul className="space-y-3" role="list">
          {pd.scenarios.map((s) => (
            <li
              key={s.scenario}
              className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#1B4D3E] text-sm">{s.label}</p>
                <p className="text-xs text-gray-500">{s.note}</p>
              </div>
              <FeasibilityBadge feasibility={s.feasibility} />
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        {PD_CAVEAT}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/properties/detail/PermittedDevelopmentSummary.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/properties/detail/PermittedDevelopmentSummary.tsx src/components/properties/detail/PermittedDevelopmentSummary.test.tsx
git commit -m "feat(properties): PermittedDevelopmentSummary section component"
```

---

## Task 6: Render the summary on the property detail page

**Files:**
- Modify: `src/app/(main)/properties/[slug]/page.tsx`

- [ ] **Step 1: Add the import**

Near the other `@/components/properties/...` imports (around the `RenovationROIPanel` / `WhatIfFloorPlan` imports), add:

```tsx
import { PermittedDevelopmentSummary } from "@/components/properties/detail/PermittedDevelopmentSummary";
```

- [ ] **Step 2: Render the summary in the renovation area**

In the renovation block, immediately after the `</Suspense>` that wraps `<RenovationROIPanel ... />` (the `</Suspense>` on the line after the `RenovationROIPanel` render) and before the `{/* WhatIf Floor Plan ... */}` comment, add:

```tsx
                  <PermittedDevelopmentSummary propertyType={property.propertyType} />
```

The result should read:

```tsx
                    <RenovationROIPanel property={property as unknown as import("@/types/property").Property} supabase={supabase} />
                  </Suspense>

                  <PermittedDevelopmentSummary propertyType={property.propertyType} />

                  {/* WhatIf Floor Plan — shows overlay when a renovation type is selected */}
```

> `property.propertyType` is already used elsewhere in this file (e.g. `formatPropertyType(property.propertyType)`), so it is in scope and is the DB `property_type` string.

- [ ] **Step 3: Type-check**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/properties/[slug]/page.tsx"
git commit -m "feat(properties): render PermittedDevelopmentSummary on property detail page"
```

---

## Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the new tests together**

Run: `pnpm vitest run src/lib/properties/permitted-development-rules.test.ts src/components/properties/roi/FeasibilityBadge.test.tsx src/components/properties/roi/RenovationScenarioCard.test.tsx src/components/properties/detail/PermittedDevelopmentSummary.test.tsx`
Expected: all PASS.

- [ ] **Step 2: Lint changed files**

Run: `pnpm eslint src/lib/properties/permitted-development-rules.ts src/components/properties/roi/FeasibilityBadge.tsx src/components/properties/roi/RenovationScenarioCard.tsx src/components/properties/roi/RenovationROIPanel.tsx src/components/properties/detail/PermittedDevelopmentSummary.tsx "src/app/(main)/properties/[slug]/page.tsx"`
Expected: 0 errors.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 4: Full test suite**

Run: `pnpm vitest run`
Expected: 0 failed.

- [ ] **Step 5: Production build**

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 6: Manual verification (optional, after deploy/preview)**

Load a house listing (e.g. a `detached`/`terraced` slug) and confirm the "What you could build" section shows the scenarios with badges and the caveat; load a `flat` listing and confirm the not-applicable message shows. Confirm the ROI cards show a feasibility badge on loft/extension scenarios.

---

## Self-review notes

- **Spec coverage:** ruleset + assess fn (Task 1), FeasibilityBadge (Task 2), card prop (Task 3), ROI wiring (Task 4), summary component (Task 5), page render (Task 6), tests across all + build (Task 7). All spec sections covered.
- **Type consistency:** `PdScenario`, `PdFeasibility`, `PdAssessment`, `assessPermittedDevelopment`, `roiTypeToPdScenario`, `PD_SCENARIO_ORDER`, `PD_CAVEAT` defined in Task 1 and used verbatim in Tasks 2–6.
- **No new infra:** no DB/API/migration; nothing to add to `check:migrations`.

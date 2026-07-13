/**
 * Guard test — F16 broker kanban carousel + F18 dashboard table scroll-contain.
 * Reads raw file content; no JSX rendering needed.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const root = resolve(__dirname, "../../../");

function src(rel: string) {
  return readFileSync(resolve(root, rel), "utf-8");
}

// ---------------------------------------------------------------------------
// F16 — broker kanban carousel
// ---------------------------------------------------------------------------

describe("F16: broker pipeline kanban mobile carousel", () => {
  const pipeline = src(
    "src/app/(protected)/dashboard/broker/pipeline/page.tsx",
  );

  it("scroll parent has snap-x class", () => {
    expect(pipeline).toContain("snap-x");
  });

  it("scroll parent has snap-mandatory class", () => {
    expect(pipeline).toContain("snap-mandatory");
  });

  it("column row no longer has bare min-w-[900px]", () => {
    expect(pipeline).not.toContain("min-w-[900px]");
  });

  it("columns use snap-start for carousel snapping", () => {
    expect(pipeline).toContain("snap-start");
  });

  it("columns use shrink-0 to prevent flex shrink on mobile", () => {
    expect(pipeline).toContain("shrink-0");
  });

  it("columns are ~80% wide on mobile (w-[80%])", () => {
    expect(pipeline).toContain("w-[80%]");
  });

  it("columns restore auto width at lg (lg:w-auto)", () => {
    expect(pipeline).toContain("lg:w-auto");
  });
});

// ---------------------------------------------------------------------------
// F18 — dashboard tables scroll-contained
// ---------------------------------------------------------------------------

describe("F18: QuoteComparison table scroll-contained", () => {
  const file = src("src/components/marketplace/QuoteComparison.tsx");

  it("has overflow-x-auto wrapper", () => {
    expect(file).toContain("overflow-x-auto");
  });

  it("table has min-w-[640px]", () => {
    expect(file).toContain("min-w-[640px]");
  });
});

describe("F18: [role]/offers page table scroll-contained", () => {
  const file = src(
    "src/app/(protected)/dashboard/[role]/offers/page.tsx",
  );

  it("has overflow-x-auto wrapper", () => {
    expect(file).toContain("overflow-x-auto");
  });

  it("table has min-w-[640px]", () => {
    expect(file).toContain("min-w-[640px]");
  });
});

describe("F18: seller analytics table scroll-contained", () => {
  const file = src(
    "src/app/(protected)/dashboard/seller/analytics/page.tsx",
  );

  it("has overflow-x-auto wrapper", () => {
    expect(file).toContain("overflow-x-auto");
  });

  it("table has min-w-[640px]", () => {
    expect(file).toContain("min-w-[640px]");
  });
});

describe("F18: OffersDashboard — card-based, no table to wrap", () => {
  const file = src(
    "src/components/dashboard/agent/offers/OffersDashboard.tsx",
  );

  it("uses card/grid layout (no <Table> import)", () => {
    expect(file).not.toContain('from "@/components/ui/table"');
  });
});

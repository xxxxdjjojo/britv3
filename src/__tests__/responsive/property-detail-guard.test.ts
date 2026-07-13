import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Property-detail responsive guards (F8 / F14).
 *
 * F8: Decision blocks must not overflow at 320px.
 *   - AiScoreCard  — dimension-row labels need min-w-0 so they can shrink
 *   - PricePosition Bar — label span needs min-w-0 + truncate
 *   - FinancialSnapshot — details/summary text child needs min-w-0
 *
 * F14: MobileStickyBottomBar
 *   - outer fixed container must carry pb-safe (safe-area-inset-bottom)
 *   - primary CTA must be h-11 (≥ 44 px touch target)
 *
 * Detail content cap:
 *   - BuyPropertyPage / RentPropertyPage outer wrapper must be max-w-6xl, not max-w-7xl.
 */

const ROOT = join(process.cwd(), "src");

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// ---------------------------------------------------------------------------
// F14 — MobileStickyBottomBar
// ---------------------------------------------------------------------------

describe("MobileStickyBottomBar (F14)", () => {
  const src = read("components/properties/blocks/MobileStickyBottomBar.tsx");

  it("outer fixed container carries pb-safe for home-indicator safe area", () => {
    expect(
      src,
      "MobileStickyBottomBar is missing pb-safe on its fixed container. " +
        "Add pb-safe to the fixed outer element (NOT alongside py-3 — use the outer/inner split pattern).",
    ).toContain("pb-safe");
  });

  it("CTA anchor/button is h-11 (44px tap target, per WCAG 2.5.8)", () => {
    expect(
      src,
      "MobileStickyBottomBar CTA must be h-11 (≥ 44px). Found h-9 (36px) — change h-9 to h-11.",
    ).toContain("h-11");
    expect(
      src,
      "MobileStickyBottomBar CTA must not be h-9 (36px) any more.",
    ).not.toContain("h-9");
  });
});

// ---------------------------------------------------------------------------
// F8 — AiScoreCard dimension rows
// ---------------------------------------------------------------------------

describe("AiScoreCard overflow guard (F8)", () => {
  const src = read("components/properties/blocks/AiScoreCard.tsx");

  it("dimension label <span> carries min-w-0 so long labels can shrink at 320px", () => {
    expect(
      src,
      "AiScoreCard: the label <span> inside each dimension row needs min-w-0 " +
        "so it can shrink when the card is narrow (320px viewport). " +
        "Add min-w-0 to the label span (the one with text-muted-foreground).",
    ).toMatch(/min-w-0[^>]*text-muted-foreground|text-muted-foreground[^>]*min-w-0/);
  });
});

// ---------------------------------------------------------------------------
// F8 — PricePosition Bar rows
// ---------------------------------------------------------------------------

describe("PricePosition Bar overflow guard (F8)", () => {
  const src = read("components/properties/blocks/PricePosition.tsx");

  it("Bar label span carries min-w-0 so long area names truncate at 320px", () => {
    expect(
      src,
      "PricePosition Bar: the label <span> (text-muted-foreground) needs min-w-0 + truncate " +
        "so long area names ('Hammersmith and Fulham median (flats)') can shrink at 320px.",
    ).toContain("min-w-0");
  });
});

// ---------------------------------------------------------------------------
// F8 — FinancialSnapshot summary row
// ---------------------------------------------------------------------------

describe("FinancialSnapshot summary row overflow guard (F8)", () => {
  const src = read("components/properties/blocks/FinancialSnapshot.tsx");

  it("<summary> text child carries min-w-0 so long text can wrap at 320px", () => {
    // The <summary> is flex justify-between; without min-w-0 on the text child
    // the text can push the chevron off-screen on a 320px viewport.
    expect(
      src,
      "FinancialSnapshot: the text child inside <summary> needs min-w-0 so it " +
        "can wrap/truncate at 320px without pushing the chevron off-screen.",
    ).toContain("min-w-0");
  });
});

// ---------------------------------------------------------------------------
// Detail content cap
// ---------------------------------------------------------------------------

describe("Property detail content cap", () => {
  it("BuyPropertyPage outer wrapper is max-w-6xl (not max-w-7xl)", () => {
    const src = read("components/properties/buy/BuyPropertyPage.tsx");
    expect(
      src,
      "BuyPropertyPage: outer content wrapper should be max-w-6xl. Found max-w-7xl — cap it.",
    ).toContain("max-w-6xl");
    expect(
      src,
      "BuyPropertyPage: max-w-7xl should be replaced with max-w-6xl.",
    ).not.toContain("max-w-7xl");
  });

  it("RentPropertyPage outer wrapper is max-w-6xl (not max-w-7xl)", () => {
    const src = read("components/properties/rent/RentPropertyPage.tsx");
    expect(
      src,
      "RentPropertyPage: outer content wrapper should be max-w-6xl. Found max-w-7xl — cap it.",
    ).toContain("max-w-6xl");
    expect(
      src,
      "RentPropertyPage: max-w-7xl should be replaced with max-w-6xl.",
    ).not.toContain("max-w-7xl");
  });
});

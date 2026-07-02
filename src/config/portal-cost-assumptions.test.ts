import { describe, expect, it } from "vitest";
import {
  PORTAL_COST_ASSUMPTIONS,
  PORTAL_COST_METHODOLOGY_VERSION,
  type PortalCostAssumption,
} from "@/config/portal-cost-assumptions";

/**
 * Legal-framing guard: no figure ships without either a real https source or
 * an explicit note marking it a stated assumption; litigation-derived figures
 * must be flagged `alleged`.
 */

// Widen the exact literal entry types to the shared shape for uniform access.
const entries: ReadonlyArray<[string, PortalCostAssumption]> =
  Object.entries(PORTAL_COST_ASSUMPTIONS);

describe("portal-cost assumptions config", () => {
  it("exports a methodology version", () => {
    expect(PORTAL_COST_METHODOLOGY_VERSION).toBe(1);
  });

  it.each(entries)(
    "%s has a real https source OR an explicit assumption note",
    (_key, assumption) => {
      const hasHttpsSource =
        typeof assumption.source?.url === "string" &&
        assumption.source.url.startsWith("https://");
      const hasAssumptionNote =
        typeof assumption.note === "string" && assumption.note.length > 0;
      expect(hasHttpsSource || hasAssumptionNote).toBe(true);
    },
  );

  it.each(entries)("%s has a finite positive value and a label", (_key, assumption) => {
    expect(Number.isFinite(assumption.value)).toBe(true);
    expect(assumption.value).toBeGreaterThan(0);
    expect(assumption.label.length).toBeGreaterThan(0);
  });

  it("sourced entries have non-empty source labels", () => {
    for (const [key, assumption] of entries) {
      if (assumption.source) {
        expect(assumption.source.label.length, `${key} source label`).toBeGreaterThan(0);
        expect(assumption.source.url.startsWith("https://"), `${key} source url`).toBe(
          true,
        );
      }
    }
  });

  it("the CAT-claim figure is flagged alleged with a note and a source", () => {
    const claim = PORTAL_COST_ASSUMPTIONS.catClaimAllegedValue;
    expect(claim.alleged).toBe(true);
    expect(claim.note).toContain("claim alleges");
    expect(claim.source.url.startsWith("https://")).toBe(true);
  });

  it("no entry other than the CAT claim is litigation-derived", () => {
    for (const [key, assumption] of entries) {
      if (key === "catClaimAllegedValue") continue;
      expect(assumption.alleged ?? false, `${key} must not be alleged`).toBe(false);
    }
  });

  it("stated assumptions (no source) explicitly say they are assumptions", () => {
    for (const [key, assumption] of entries) {
      if (!assumption.source) {
        expect(assumption.note, `${key} needs an assumption note`).toMatch(/assumption/i);
      }
    }
  });
});

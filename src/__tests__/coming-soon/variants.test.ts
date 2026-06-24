import { describe, expect, it } from "vitest";
import {
  DEFAULT_VARIANT_ID,
  getVariant,
  HEADLINE_VARIANT_IDS,
  HEADLINE_VARIANTS,
  isHeadlineVariantId,
} from "@/components/coming-soon/variants";

describe("headline variants", () => {
  it("exposes exactly three variant ids", () => {
    expect(HEADLINE_VARIANT_IDS).toEqual(["A", "B", "C"]);
  });

  it("defines a complete, non-empty variant for each id", () => {
    for (const id of HEADLINE_VARIANT_IDS) {
      const variant = HEADLINE_VARIANTS[id];
      expect(variant.id).toBe(id);
      expect(variant.headline.trim().length).toBeGreaterThan(0);
      expect(variant.subhead.trim().length).toBeGreaterThan(0);
      expect(variant.cta.trim().length).toBeGreaterThan(0);
    }
  });

  it("falls back to the default variant for an unknown id", () => {
    expect(getVariant("X").id).toBe(DEFAULT_VARIANT_ID);
    expect(getVariant(null).id).toBe(DEFAULT_VARIANT_ID);
    expect(getVariant(undefined).id).toBe(DEFAULT_VARIANT_ID);
  });

  it("resolves a known id to its own variant", () => {
    expect(getVariant("A").id).toBe("A");
  });

  it("validates variant ids", () => {
    expect(isHeadlineVariantId("B")).toBe(true);
    expect(isHeadlineVariantId("X")).toBe(false);
  });
});

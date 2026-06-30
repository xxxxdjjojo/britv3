import { describe, expect, it } from "vitest";

import { assertPurchaseAllowed, PlacementPurchaseError } from "./purchase-guard";

const eligible = { eligible: true, reasons: [] as string[] };

describe("assertPurchaseAllowed", () => {
  it("passes for an eligible trader buying an available slot", () => {
    expect(() =>
      assertPurchaseAllowed({ productStatus: "active", eligibility: eligible, activeSlotCount: 1, slotLimit: 3 }),
    ).not.toThrow();
  });

  it("blocks an unverified trader", () => {
    try {
      assertPurchaseAllowed({
        productStatus: "active",
        eligibility: { eligible: false, reasons: ["verification"] },
        activeSlotCount: 0,
        slotLimit: 3,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(PlacementPurchaseError);
      expect((e as PlacementPurchaseError).code).toBe("not_eligible");
    }
  });

  it("blocks a trader without an active subscription", () => {
    try {
      assertPurchaseAllowed({
        productStatus: "active",
        eligibility: { eligible: false, reasons: ["subscription"] },
        activeSlotCount: 0,
        slotLimit: 3,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as PlacementPurchaseError).code).toBe("not_eligible");
    }
  });

  it("prevents over-selling when the slot limit is reached", () => {
    try {
      assertPurchaseAllowed({ productStatus: "active", eligibility: eligible, activeSlotCount: 3, slotLimit: 3 });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as PlacementPurchaseError).code).toBe("sold_out");
    }
  });

  it("blocks a product that is not active", () => {
    try {
      assertPurchaseAllowed({ productStatus: "archived", eligibility: eligible, activeSlotCount: 0, slotLimit: 3 });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as PlacementPurchaseError).code).toBe("product_unavailable");
    }
  });
});

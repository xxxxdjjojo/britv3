/**
 * purchase-guard.ts
 *
 * Pure business rules that decide whether a boost purchase may proceed:
 * the product must be available, the trader must be eligible (verified + active
 * subscription, enforced upstream by canPurchaseBoost), and the placement's slot
 * cap must not be exceeded (prevents over-selling a region/category).
 */

import type { EligibilityResult } from "@/lib/placements/eligibility";
import type { PlacementProductStatus } from "@/types/sponsored-placements";

export type PlacementPurchaseErrorCode = "product_unavailable" | "not_eligible" | "sold_out";

export class PlacementPurchaseError extends Error {
  readonly code: PlacementPurchaseErrorCode;
  constructor(code: PlacementPurchaseErrorCode, message: string) {
    super(message);
    this.name = "PlacementPurchaseError";
    this.code = code;
  }
}

export function assertPurchaseAllowed(input: {
  productStatus: PlacementProductStatus;
  eligibility: EligibilityResult;
  activeSlotCount: number;
  slotLimit: number;
}): void {
  if (input.productStatus !== "active") {
    throw new PlacementPurchaseError("product_unavailable", "This placement is no longer available.");
  }
  if (!input.eligibility.eligible) {
    const reasons = input.eligibility.reasons.join(", ");
    throw new PlacementPurchaseError(
      "not_eligible",
      `You must have an approved profile and an active subscription to boost (${reasons}).`,
    );
  }
  if (input.slotLimit > 0 && input.activeSlotCount >= input.slotLimit) {
    throw new PlacementPurchaseError("sold_out", "All slots for this placement are currently taken.");
  }
}

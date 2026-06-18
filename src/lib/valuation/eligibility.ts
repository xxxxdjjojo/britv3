/** Comparable eligibility rules (data-quality audit findings encoded here). */
import { MIN_VALID_PRICE, MAX_VALID_PRICE } from "./constants";

export type EligibilityInput = Readonly<{
  price: number;
  ppdCategory: "A" | "B";
  recordStatus: "A" | "C" | "D";
}>;

/**
 * A comparable is eligible only if it is a standard open-market sale (category A),
 * not a deleted record, and within plausible price bounds. Category B
 * (repossessions, bulk/portfolio transfers) and £1 transfers would bias the
 * estimate, so they are excluded.
 */
export function isEligibleComparable(c: EligibilityInput): boolean {
  return (
    c.ppdCategory === "A" &&
    c.recordStatus !== "D" &&
    c.price >= MIN_VALID_PRICE &&
    c.price <= MAX_VALID_PRICE
  );
}

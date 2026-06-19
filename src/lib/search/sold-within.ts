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

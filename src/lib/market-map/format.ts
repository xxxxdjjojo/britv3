import { PROPERTY_TYPES, type PropertyTypeFilter } from "./constants";

/** Land Registry single-letter property-type codes → display labels. */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat",
  O: "Other",
};

/** Format whole pounds as GBP currency, no decimals, e.g. £625,000. */
export function formatPounds(pounds: number): string {
  return pounds.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

/** Compact GBP for tight UI, e.g. £625k, £1.2M. */
export function formatCompactPounds(pounds: number): string {
  return pounds.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

/** Land Registry property-type filter value → SQL code (null = all). */
export function propertyTypeCode(filter: PropertyTypeFilter): string | null {
  return PROPERTY_TYPES[filter];
}

/** Format an ISO date (YYYY-MM-DD) as "Jun 2023". */
export function formatMonthYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format a window as "Jun 2023 – Jun 2026". */
export function formatMonthRange(from: string, to: string): string {
  return `${formatMonthYear(from)} – ${formatMonthYear(to)}`;
}

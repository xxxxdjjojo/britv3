// Display formatting helpers for the New Homes UI.

import type { DevelopmentStatus, DevelopmentUnitStatus } from "./types";

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatGbp(value: number | null | undefined): string {
  if (value == null) return "POA";
  return gbp.format(value);
}

/** "From £325,000" style range label for a development card. */
export function formatPriceRange(
  min: number | null,
  max: number | null,
): string {
  if (min == null && max == null) return "Prices on application";
  if (min != null && max != null && min !== max) {
    return `${formatGbp(min)} – ${formatGbp(max)}`;
  }
  return `From ${formatGbp(min ?? max)}`;
}

export function formatBedsRange(
  min: number | null,
  max: number | null,
): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null && min !== max) return `${min}–${max} bed`;
  return `${min ?? max} bed`;
}

const STATUS_LABELS: Record<DevelopmentStatus, string> = {
  coming_soon: "Coming soon",
  available: "Available",
  reserved: "Selling fast",
  sold_out: "Sold out",
};

export function developmentStatusLabel(status: DevelopmentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const UNIT_STATUS_LABELS: Record<DevelopmentUnitStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export function unitStatusLabel(status: DevelopmentUnitStatus): string {
  return UNIT_STATUS_LABELS[status] ?? status;
}

const SCHEME_LABELS: Record<string, string> = {
  houses: "Houses",
  apartments: "Apartments",
  mixed: "Houses & apartments",
  retirement: "Retirement living",
  shared_ownership: "Shared ownership",
};

export function schemeTypeLabel(scheme: string): string {
  return SCHEME_LABELS[scheme] ?? scheme;
}

/** "Ready Q3 2026" style completion label from an ISO date. */
export function formatCompletion(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const quarter = Math.floor(parsed.getUTCMonth() / 3) + 1;
  return `Ready Q${quarter} ${parsed.getUTCFullYear()}`;
}

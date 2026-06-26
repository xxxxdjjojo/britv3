/**
 * Derived chart inputs for the /areas/[city] guide.
 *
 * These helpers turn the real headline fields on `CityData` into shapes the
 * shared chart components expect. They are deliberately honest about what is
 * real (the annual transaction total, the per-type price levels) versus what is
 * modelled (the quarterly split, which HM Land Registry does not publish at this
 * granularity here). Nothing fabricates a precise statistic presented as an
 * official figure — the page labels the modelled split as illustrative.
 */

import type { CityData, PropertyTypeCode } from "@/types/areas";

export type QuarterVolume = Readonly<{
  quarter: string;
  newListings: number;
  soldVolume: number;
}>;

/** Light, deterministic seasonal weights so the modelled split isn't flat. */
const SEASONAL_WEIGHTS = [0.22, 0.28, 0.27, 0.23] as const;
const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;

/**
 * Spread a real annual transaction count across four quarters with a fixed
 * seasonal profile. `soldVolume` is the modelled completed sales; `newListings`
 * is uplifted to reflect that not every listing completes within the window.
 */
export function deriveQuarterlyVolumes(city: CityData): QuarterVolume[] {
  const annual = city.transactionsLast12m;
  return QUARTER_LABELS.map((label, i) => {
    const sold = Math.round((annual * SEASONAL_WEIGHTS[i]!) / 1);
    return {
      quarter: label,
      soldVolume: sold,
      newListings: Math.round(sold * 1.18),
    };
  });
}

const TYPE_LABELS: Record<PropertyTypeCode, string> = {
  D: "Detached",
  S: "Semi",
  T: "Terraced",
  F: "Flats",
  O: "Other",
};

const TYPE_COLORS: Record<PropertyTypeCode, string> = {
  F: "#1B4D3E",
  T: "#2D7A5F",
  S: "#4F9E7F",
  D: "#D4A853",
  O: "#E2E2E8",
};

export type PriceByTypeRow = Readonly<{
  code: PropertyTypeCode;
  label: string;
  price: number;
  priceFormatted: string;
  color: string;
  /** Width 0–100 for a labelled bar, relative to the dearest type. */
  barPercent: number;
}>;

const TYPE_ORDER: PropertyTypeCode[] = ["D", "S", "T", "F", "O"];

/**
 * Real per-type median price levels from `CityData.priceByType`, ordered and
 * normalised to a 0–100 bar width for a labelled horizontal bar chart.
 */
export function priceByTypeRows(city: CityData): PriceByTypeRow[] {
  const max = Math.max(...Object.values(city.priceByType), 1);
  return TYPE_ORDER.map((code) => {
    const price = city.priceByType[code];
    return {
      code,
      label: TYPE_LABELS[code],
      price,
      priceFormatted: `£${Math.round(price / 1000).toLocaleString("en-GB")}k`,
      color: TYPE_COLORS[code],
      barPercent: Math.round((price / max) * 100),
    };
  }).filter((row) => row.price > 0);
}

/**
 * Pure helpers for the seller "nearby sold prices" panel.
 *
 * These back the /api/seller/valuation route. The route only collects a
 * postcode, so it cannot value a specific property — it reports the AVERAGE of
 * recent Land Registry sold prices near that postcode. Nothing here is a model
 * or an "AI" estimate.
 *
 * Money convention: the seller domain stores money in PENCE everywhere
 * (SellerListing.asking_price, SellerOffer.amount, …). Land Registry Price Paid
 * Data quotes whole pounds, so prices are scaled by POUNDS_TO_PENCE on ingest
 * and divided back out at the display edge.
 */
import type { LandRegistryComparable } from "@/types/seller";

export const POUNDS_TO_PENCE = 100;

/** Column indices in the Land Registry `app/ppd/ppd_data.csv` row format. */
const COL = {
  price: 1,
  date: 2,
  postcode: 3,
  propertyType: 4,
  duration: 6,
  paon: 7,
  street: 9,
} as const;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

const TENURE_LABELS: Record<string, string> = { F: "Freehold", L: "Leasehold" };

/**
 * Parse a single CSV line per RFC 4180: handles quoted fields containing commas
 * and escaped double quotes (`""`). The previous naive `split(",")` mis-aligned
 * columns whenever an address field contained a comma.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields.map((f) => f.trim());
}

/**
 * Turn a Land Registry PPD CSV body into comparables. A leading header row is
 * skipped only when present (detected by a non-numeric price column), so a real
 * record is never silently dropped when the feed omits the header.
 */
export function parseLandRegistryComparables(
  csvText: string,
  fallbackPostcode: string,
  limit = 10,
): LandRegistryComparable[] {
  const rows = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (rows.length === 0) return [];

  const firstPrice = parseCsvLine(rows[0])[COL.price] ?? "";
  const startIndex = firstPrice !== "" && Number.isFinite(Number(firstPrice)) ? 0 : 1;

  const comparables: LandRegistryComparable[] = [];
  for (const line of rows.slice(startIndex)) {
    if (comparables.length >= limit) break;

    const cols = parseCsvLine(line);
    const price = parseInt(cols[COL.price] ?? "", 10);
    const date = cols[COL.date] ?? "";
    if (!Number.isFinite(price) || price <= 0 || !date) continue;

    const pType = cols[COL.propertyType] ?? "O";
    const duration = cols[COL.duration] ?? "";
    const paon = cols[COL.paon] ?? "";
    const street = cols[COL.street] ?? "";

    comparables.push({
      address: [paon, street].filter(Boolean).join(" "),
      postcode: cols[COL.postcode] || fallbackPostcode,
      price: price * POUNDS_TO_PENCE,
      sale_date: date.split(" ")[0] ?? date,
      property_type: PROPERTY_TYPE_LABELS[pType] ?? pType,
      tenure: TENURE_LABELS[duration] ?? duration,
      distance_metres: null,
    });
  }
  return comparables;
}

/** Mean sale price across the comparables, in pence. */
export function averageSoldPrice(comparables: readonly LandRegistryComparable[]): number {
  if (comparables.length === 0) return 0;
  const total = comparables.reduce((sum, c) => sum + c.price, 0);
  return Math.round(total / comparables.length);
}

/** Actual lowest/highest sale price across the comparables, in pence. */
export function soldPriceRange(
  comparables: readonly LandRegistryComparable[],
): { low: number; high: number } {
  if (comparables.length === 0) return { low: 0, high: 0 };
  const prices = comparables.map((c) => c.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/**
 * How much weight the average deserves, expressed as evidence strength rather
 * than a fabricated confidence percentage. More nearby sales = stronger basis.
 */
export type SoldPriceEvidence = "unavailable" | "low" | "medium" | "high";

export function classifyComparableEvidence(count: number): SoldPriceEvidence {
  if (count <= 0) return "unavailable";
  if (count <= 2) return "low";
  if (count <= 4) return "medium";
  return "high";
}

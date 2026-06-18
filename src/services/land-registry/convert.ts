/**
 * Convert raw `PricePaidRecord` (Land Registry CSV shape) to the
 * `LandRegistryComparable` shape consumed by `<PriceHistory>` on the
 * property details page.
 */

import type { LandRegistryComparable } from "@/services/properties/land-registry-service";
import type { PricePaidRecord } from "./types";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

const TENURE_LABELS: Record<string, string> = {
  F: "Freehold",
  L: "Leasehold",
};

function formatAddress(record: PricePaidRecord): string {
  const parts = [record.saon, record.paon, record.street, record.town].filter(
    (part) => part && part.trim().length > 0,
  );
  return parts.join(", ") || "Unknown address";
}

function toDateOnly(iso: string): string {
  const match = iso.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : iso;
}

export function toComparable(record: PricePaidRecord): LandRegistryComparable {
  return {
    address: formatAddress(record),
    price: record.price,
    date: toDateOnly(record.date_of_transfer),
    property_type:
      PROPERTY_TYPE_LABELS[record.property_type] ?? record.property_type,
    new_build: record.old_new === "Y",
    tenure: TENURE_LABELS[record.duration] ?? record.duration,
  };
}

export function toComparables(
  records: ReadonlyArray<PricePaidRecord>,
): LandRegistryComparable[] {
  return records.map(toComparable);
}

/**
 * Extract a Land Registry-style PAON (Primary Addressable Object Name)
 * from a free-text address line 1 like "8 Primrose Hill Road" or "10A
 * Acacia Avenue". Returns the leading number(+optional letter) or the
 * full line if no number is present (e.g. "Rose Cottage" → "ROSE
 * COTTAGE" — still useful for named properties).
 */
export function extractPaon(addressLine1: string | null | undefined): string | null {
  if (!addressLine1) return null;
  const trimmed = addressLine1.trim();
  if (trimmed.length === 0) return null;

  const numericMatch = trimmed.match(/^(\d+[A-Za-z]?)\b/);
  if (numericMatch) {
    return numericMatch[1].toUpperCase();
  }

  return trimmed.toUpperCase();
}

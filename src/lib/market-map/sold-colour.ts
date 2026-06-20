/**
 * Colour scale and parsing for the high-zoom "sold properties" parcel layer.
 *
 * This layer reads as DISTINCT from the area choropleth (see `colour.ts`):
 * the choropleth uses a muted green→gold→burgundy log-price ramp, whereas the
 * sold layer uses a warm SEQUENTIAL £/m² ramp (pale amber → deep maroon) that
 * reads as "price intensity".
 *
 * Bucket = national £/m² quantile 1..9 (1 = lowest £/m², 9 = highest).
 * Grey = a parcel with a sale but no floor-area match (null £/m², null bucket).
 */

/** Neutral grey shown for a sold parcel that has no £/m² (no floor-area match). */
export const SOLD_INSUFFICIENT_COLOUR = "#C7C7CC";

/**
 * Warm sequential £/m² ramp, low → high. Index 0 = bucket 1, index 8 = bucket 9.
 * Perceptually ordered pale amber → deep red/maroon.
 */
export const SOLD_RAMP: readonly string[] = [
  "#FFF3D6", // bucket 1 — pale amber (lowest £/m²)
  "#FFE0A3", // bucket 2
  "#FDC873", // bucket 3
  "#FBA94C", // bucket 4
  "#F4882F", // bucket 5
  "#E5631C", // bucket 6
  "#C9420F", // bucket 7
  "#A02208", // bucket 8
  "#6E0F0A", // bucket 9 — deep maroon (highest £/m²)
];

export type SoldSale = {
  address: string | null;
  date: string;
  price: number;
  ppsqm: number | null;
  type: string;
  floorArea: number | null;
  estimatedLocation: boolean;
};

export type SoldParcel = {
  inspireId: string;
  bucket: number | null;
  saleCount: number;
  medianPricePence: number;
  medianPricePerSqmPence: number | null;
  dominantPropertyType: string;
  latestTransferDate: string;
  sales: SoldSale[];
};

/**
 * Returns the ramp hex for a £/m² bucket (1–9), or the neutral grey for a
 * null/absent bucket (a parcel with a sale but no £/m²).
 */
export function colourForSoldBucket(bucket: number | null): string {
  if (bucket === null || bucket < 1 || bucket > 9) {
    return SOLD_INSUFFICIENT_COLOUR;
  }
  return SOLD_RAMP[bucket - 1];
}

/** Reads a finite number from raw props, else `fallback`. */
function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Reads a finite number or null from raw props. */
function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type RawSale = {
  address?: unknown;
  date?: unknown;
  price?: unknown;
  ppsqm?: unknown;
  type?: unknown;
  floor_area?: unknown;
  estimated_location?: unknown;
};

function parseSale(raw: RawSale): SoldSale {
  return {
    address: typeof raw.address === "string" ? raw.address : null,
    date: typeof raw.date === "string" ? raw.date : "",
    price: numberOr(raw.price, 0),
    ppsqm: numberOrNull(raw.ppsqm),
    type: typeof raw.type === "string" ? raw.type : "",
    floorArea: numberOrNull(raw.floor_area),
    estimatedLocation: raw.estimated_location === true,
  };
}

/**
 * Parses raw MVT feature props for the `sold_parcels` layer into a typed
 * `SoldParcel`. The `sales` prop is a JSON string and is mapped from snake_case
 * (`floor_area`, `estimated_location`) to camelCase.
 *
 * Returns `null` (never throws) when `inspire_id` is missing or the `sales`
 * JSON is unparseable. A bad/empty sales array defaults to `[]`.
 */
export function parseSoldParcelProperties(
  props: Record<string, unknown>,
): SoldParcel | null {
  const inspireId = props.inspire_id;
  if (typeof inspireId !== "string" || inspireId.length === 0) {
    return null;
  }

  let sales: SoldSale[] = [];
  const rawSales = props.sales;
  if (typeof rawSales === "string") {
    try {
      const parsed = JSON.parse(rawSales);
      if (Array.isArray(parsed)) {
        sales = parsed.map((entry) => parseSale(entry as RawSale));
      }
    } catch {
      return null;
    }
  }

  return {
    inspireId,
    bucket: numberOrNull(props.bucket),
    saleCount: numberOr(props.sale_count, 0),
    medianPricePence: numberOr(props.median_price_pence, 0),
    medianPricePerSqmPence: numberOrNull(props.median_price_per_sqm_pence),
    dominantPropertyType:
      typeof props.dominant_property_type === "string"
        ? props.dominant_property_type
        : "",
    latestTransferDate:
      typeof props.latest_transfer_date === "string"
        ? props.latest_transfer_date
        : "",
    sales,
  };
}

const POUNDS_FORMATTER = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

/** Formats a pence amount as e.g. `£450,000` (rounds pence → £, no decimals). */
export function formatPounds(pence: number): string {
  return `£${POUNDS_FORMATTER.format(Math.round(pence / 100))}`;
}

/** Formats a pence-per-m² amount as e.g. `£6,250/m²`; null in → null out. */
export function formatPricePerSqm(ppsqmPence: number | null): string | null {
  if (ppsqmPence === null) return null;
  return `${formatPounds(ppsqmPence)}/m²`;
}

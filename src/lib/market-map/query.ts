import { z } from "zod";
import { GEOGRAPHY_LEVELS, DEFAULT_WINDOW_MONTHS } from "./constants";
import { DEFAULT_AREA_SLUG } from "./areas";
import type { MarketMapQuery } from "@/types/market-map";

const PROPERTY_TYPE_VALUES = [
  "all",
  "detached",
  "semi-detached",
  "terraced",
  "flat",
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const marketMapQuerySchema = z.object({
  area: z.string().trim().min(1).default(DEFAULT_AREA_SLUG),
  geography_level: z.enum(GEOGRAPHY_LEVELS).default("postcode_district"),
  property_type: z.enum(PROPERTY_TYPE_VALUES).default("all"),
  months: z.coerce.number().int().min(1).max(600).optional(),
  from_date: z.string().regex(DATE_RE).optional(),
  to_date: z.string().regex(DATE_RE).optional(),
});

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Validate raw query params and resolve a concrete MarketMapQuery with a fixed
 * date window. `from_date`/`to_date` win; otherwise a `months` window (default
 * 36) ending today is used. Throws ZodError on invalid input.
 */
export function parseMarketMapQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): MarketMapQuery {
  const raw =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;

  const parsed = marketMapQuerySchema.parse(raw);

  const toDate = parsed.to_date ?? isoDate(new Date());
  let fromDate = parsed.from_date;
  if (!fromDate) {
    const months = parsed.months ?? DEFAULT_WINDOW_MONTHS;
    const d = new Date(`${toDate}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - months);
    fromDate = isoDate(d);
  }

  return {
    area: parsed.area.toLowerCase(),
    geography_level: parsed.geography_level,
    property_type: parsed.property_type,
    from_date: fromDate,
    to_date: toDate,
  };
}

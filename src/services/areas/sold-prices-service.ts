/**
 * Sold Prices service — queries the price_paid_transactions table (PPD data).
 *
 * Replaces the mock-data implementation with real Supabase queries against
 * ~31M rows of HM Land Registry Price Paid Data.
 *
 * All queries filter to transaction_category = 'A' (standard transactions)
 * and record_status IN ('A', 'C') (additions and changes, not deletions).
 */

import type { SoldPriceRecord, SoldPriceDetail, PropertyTypeCode } from "@/types/areas";
import { createClient } from "@/lib/supabase/server";

// Re-export local comparables so existing consumers can import from here
export { getLocalComparables } from "@/services/properties/ppd-comparables-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-Detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

const TENURE_LABELS: Record<string, string> = {
  F: "Freehold",
  L: "Leasehold",
  U: "Unknown",
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format price as £XXX,XXX */
function formatPrice(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

/** Format ISO date as "15 Jan 2026" */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Build a human-readable address from PPD fields */
function buildAddress(row: {
  saon: string | null;
  paon: string | null;
  street: string | null;
  locality: string | null;
  town_city: string | null;
}): string {
  const parts = [row.saon, row.paon, row.street, row.locality, row.town_city].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  return parts.join(", ") || "Unknown address";
}

/** Generate a URL-safe slug from address + postcode (matches existing mock pattern) */
function makeSlug(address: string, postcode: string): string {
  const addrPart = address.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const pcPart = postcode.toLowerCase().replace(/\s+/g, "-");
  return `${addrPart}-${pcPart}`.replace(/^-+|-+$/g, "");
}

/** Derive an area slug from district or town_city */
function deriveAreaSlug(district: string | null, townCity: string | null): string {
  const raw = district || townCity || "unknown";
  return raw
    .toLowerCase()
    .replace(/^london borough of\s+/i, "")
    .replace(/^city of\s+/i, "")
    .replace(/^royal borough of\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Transform a PPD row to SoldPriceRecord */
function rowToRecord(row: PpdRow): SoldPriceRecord {
  const address = buildAddress(row);
  const propertyType = (row.property_type || "O") as PropertyTypeCode;
  const tenure = (row.tenure === "F" || row.tenure === "L") ? row.tenure : "F";

  return {
    id: row.id,
    slug: makeSlug(address, row.postcode || ""),
    address,
    postcode: row.postcode || "",
    propertyType,
    propertyTypeLabel: PROPERTY_TYPE_LABELS[propertyType] ?? "Other",
    beds: 0, // PPD does not include bedroom count
    price: row.price,
    priceFormatted: formatPrice(row.price),
    date: row.transaction_date,
    dateFormatted: formatDate(row.transaction_date),
    oldNew: row.is_new_build ? "Y" : "N",
    tenure,
    tenureLabel: TENURE_LABELS[tenure] ?? "Freehold",
    vsAsking: null, // PPD does not include asking price
    areaSlug: deriveAreaSlug(row.district, row.town_city),
  };
}

/** Internal row shape from price_paid_transactions */
type PpdRow = {
  id: string;
  transaction_id: string;
  price: number;
  transaction_date: string;
  postcode: string | null;
  postcode_area: string | null;
  property_type: string | null;
  is_new_build: boolean;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town_city: string | null;
  district: string | null;
  county: string | null;
  transaction_category: string | null;
  record_status: string | null;
};

/** Standard select columns */
const PPD_COLUMNS = "id, transaction_id, price, transaction_date, postcode, postcode_area, property_type, is_new_build, tenure, paon, saon, street, locality, town_city, district, county, transaction_category, record_status";

// ---------------------------------------------------------------------------
// Area matching — district-first with town_city fallback
// ---------------------------------------------------------------------------

/**
 * Resolve an area slug to PPD rows. Tries district first (stripping common
 * prefixes like "LONDON BOROUGH OF"), then falls back to town_city.
 */
async function queryByArea(
  supabase: Awaited<ReturnType<typeof createClient>>,
  areaSlug: string,
  options: {
    limit?: number;
    offset?: number;
    propertyType?: string;
    sortBy?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {},
) {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset ?? 0;

  // Use pre-computed slug columns for indexed exact-match lookups.
  // district_slug: "LONDON BOROUGH OF CAMDEN" → "camden"
  // town_slug: "ISLEWORTH" → "isleworth"
  let query = supabase
    .from("price_paid_transactions")
    .select(PPD_COLUMNS, { count: "exact" })
    .eq("transaction_category", "A")
    .in("record_status", ["A", "C"])
    .or(
      `district_slug.eq.${areaSlug},town_slug.eq.${areaSlug}`,
    );

  if (options.propertyType) {
    query = query.eq("property_type", options.propertyType.toUpperCase());
  }

  if (options.dateFrom) {
    query = query.gte("transaction_date", options.dateFrom);
  }

  if (options.dateTo) {
    query = query.lte("transaction_date", options.dateTo);
  }

  // Sorting
  const sortField = options.sortBy === "price-asc" ? "price"
    : options.sortBy === "price-desc" ? "price"
    : "transaction_date";
  const ascending = options.sortBy === "price-asc";
  query = query.order(sortField, { ascending }).range(offset, offset + limit - 1);

  return query;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch sold price records for an area (district/town).
 * Returns paginated results sorted by date descending by default.
 */
export async function getAreaSoldPrices(
  areaSlug: string,
  options?: {
    limit?: number;
    offset?: number;
    propertyType?: string;
    sortBy?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<{ records: SoldPriceRecord[]; total: number }> {
  try {
    const supabase = await createClient();
    const { data, count, error } = await queryByArea(supabase, areaSlug, options);

    if (error) {
      console.error("[sold-prices-service] getAreaSoldPrices error:", {
        code: error.code,
        message: error.message,
      });
      return { records: [], total: 0 };
    }

    const records = (data as PpdRow[] | null)?.map(rowToRecord) ?? [];
    return { records, total: count ?? records.length };
  } catch (error) {
    console.error("[sold-prices-service] getAreaSoldPrices unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return { records: [], total: 0 };
  }
}

/**
 * Fetch detailed sold price information for a single property.
 * Parses the slug to extract address components and postcode, then queries
 * the transaction history and nearby sales.
 */
export async function getPropertySoldPrice(
  slug: string,
): Promise<SoldPriceDetail | null> {
  try {
    const supabase = await createClient();

    // Extract postcode from end of slug (last segment matching UK postcode pattern)
    // e.g. "14-south-street-tw7-7bg" -> postcode parts "tw7" + "7bg"
    const parts = slug.split("-");
    let postcode = "";
    let addressParts: string[] = [];

    // UK postcodes: outward (2-4 chars) + inward (3 chars)
    // In slug form, the last two segments are typically the postcode
    if (parts.length >= 3) {
      const lastTwo = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`.toUpperCase();
      // Validate it looks like a UK postcode
      if (/^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$/.test(lastTwo)) {
        postcode = lastTwo;
        addressParts = parts.slice(0, -2);
      }
    }

    if (!postcode) {
      return null;
    }

    // Build search terms from address parts
    // Try to find the PAON (house number) and street
    const paonCandidate = addressParts[0] || "";
    const streetCandidate = addressParts.slice(1).join(" ");

    // Query for this specific property's transactions
    let query = supabase
      .from("price_paid_transactions")
      .select(PPD_COLUMNS)
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .ilike("postcode", postcode);

    // If we have a PAON (house number), filter by it
    if (paonCandidate) {
      query = query.ilike("paon", paonCandidate);
    }

    // If we have a street name, filter by it
    if (streetCandidate) {
      query = query.ilike("street", `%${streetCandidate}%`);
    }

    const { data: transactions, error } = await query.order("transaction_date", { ascending: false });

    if (error || !transactions || transactions.length === 0) {
      if (error) {
        console.error("[sold-prices-service] getPropertySoldPrice error:", {
          code: error.code,
          message: error.message,
        });
      }
      return null;
    }

    const rows = transactions as PpdRow[];
    const latest = rows[0];
    const address = buildAddress(latest);
    const areaSlug = deriveAreaSlug(latest.district, latest.town_city);
    const areaName = (latest.town_city || latest.district || "Unknown")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .replace(/^London Borough Of\s+/i, "")
      .replace(/^City Of\s+/i, "");

    // Build price history with percentage changes
    const history = rows.map((row, idx) => {
      const nextRow = rows[idx + 1];
      let change: string | null = null;
      if (nextRow) {
        const pctChange = ((row.price - nextRow.price) / nextRow.price) * 100;
        change = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%`;
      }
      return {
        price: row.price,
        date: formatDate(row.transaction_date),
        change,
      };
    });

    // Calculate growth since earliest transaction
    const earliest = rows[rows.length - 1];
    const growthPct = rows.length > 1
      ? Math.round(((latest.price - earliest.price) / earliest.price) * 100)
      : 0;
    const earliestYear = new Date(earliest.transaction_date).getFullYear();
    const growth = rows.length > 1
      ? `${growthPct >= 0 ? "+" : ""}${growthPct}% since ${earliestYear}`
      : "No previous sales";

    // Rough estimated value: latest price + area average YoY growth (simple projection)
    const estimatedValue = formatPrice(Math.round(latest.price * 1.03));

    // Fetch nearby sales (same postcode, different property)
    const { data: nearbyData } = await supabase
      .from("price_paid_transactions")
      .select(PPD_COLUMNS)
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .ilike("postcode", `${postcode.split(" ")[0]}%`)
      .neq("transaction_id", latest.transaction_id)
      .order("transaction_date", { ascending: false })
      .limit(4);

    const nearby = ((nearbyData as PpdRow[] | null) ?? []).map((row) => {
      const nearbyAddr = buildAddress(row);
      return {
        address: nearbyAddr,
        price: formatPrice(row.price),
        date: formatDate(row.transaction_date),
        slug: makeSlug(nearbyAddr, row.postcode || ""),
      };
    });

    // Calculate area YoY change from recent transactions
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];

    const { data: recentAvg } = await supabase
      .from("price_paid_transactions")
      .select("price")
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .ilike("postcode", `${postcode.split(" ")[0]}%`)
      .gte("transaction_date", oneYearAgo);

    const { data: prevAvg } = await supabase
      .from("price_paid_transactions")
      .select("price")
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .ilike("postcode", `${postcode.split(" ")[0]}%`)
      .gte("transaction_date", twoYearsAgo)
      .lt("transaction_date", oneYearAgo);

    let areaGrowth = "+0.0% this year";
    if (recentAvg && prevAvg && recentAvg.length > 0 && prevAvg.length > 0) {
      const recentMean =
        recentAvg.reduce((s, r) => s + (r as { price: number }).price, 0) / recentAvg.length;
      const prevMean =
        prevAvg.reduce((s, r) => s + (r as { price: number }).price, 0) / prevAvg.length;
      if (prevMean > 0) {
        const yoyPct = ((recentMean - prevMean) / prevMean) * 100;
        areaGrowth = `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}% this year`;
      }
    }

    // Coordinates are not in PPD data — return 0,0 placeholder
    const detail: SoldPriceDetail = {
      address: `${address}, ${areaName}`,
      postcode,
      propertyType: PROPERTY_TYPE_LABELS[latest.property_type ?? "O"] ?? "Other",
      lastPrice: latest.price,
      lastDate: new Date(latest.transaction_date).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      growth,
      estimatedValue,
      coordinates: { lat: 0, lng: 0 },
      history,
      nearby,
      areaSlug,
      areaName,
      areaGrowth,
    };

    return detail;
  } catch (error) {
    console.error("[sold-prices-service] getPropertySoldPrice unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

/**
 * Aggregate stats for an area: average price, count, YoY change.
 * Optionally filtered by property type.
 */
export async function getSoldPriceStats(
  areaSlug: string,
  propertyType?: string,
): Promise<{
  avgPrice: number;
  totalTransactions: number;
  yoyChange: number;
  avgVsAsking: number;
}> {
  const empty = { avgPrice: 0, totalTransactions: 0, yoyChange: 0, avgVsAsking: 0 };

  try {
    const supabase = await createClient();

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];
    // Current year average & count
    let recentQuery = supabase
      .from("price_paid_transactions")
      .select("price", { count: "exact" })
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .or(`district_slug.eq.${areaSlug},town_slug.eq.${areaSlug}`)
      .gte("transaction_date", oneYearAgo);

    if (propertyType) {
      recentQuery = recentQuery.eq("property_type", propertyType.toUpperCase());
    }

    const { data: recentData, count: recentCount, error: recentError } = await recentQuery;

    if (recentError) {
      console.error("[sold-prices-service] getSoldPriceStats recent query error:", {
        code: recentError.code,
        message: recentError.message,
      });
      return empty;
    }

    const recentRows = (recentData ?? []) as { price: number }[];
    const totalTransactions = recentCount ?? recentRows.length;

    if (totalTransactions === 0) {
      return empty;
    }

    const avgPrice = Math.round(
      recentRows.reduce((s, r) => s + r.price, 0) / recentRows.length,
    );

    // Previous year average for YoY calculation
    let prevQuery = supabase
      .from("price_paid_transactions")
      .select("price")
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .or(`district_slug.eq.${areaSlug},town_slug.eq.${areaSlug}`)
      .gte("transaction_date", twoYearsAgo)
      .lt("transaction_date", oneYearAgo);

    if (propertyType) {
      prevQuery = prevQuery.eq("property_type", propertyType.toUpperCase());
    }

    const { data: prevData } = await prevQuery;

    let yoyChange = 0;
    const prevRows = (prevData ?? []) as { price: number }[];
    if (prevRows.length > 0) {
      const prevAvg = prevRows.reduce((s, r) => s + r.price, 0) / prevRows.length;
      if (prevAvg > 0) {
        yoyChange = Math.round(((avgPrice - prevAvg) / prevAvg) * 1000) / 10;
      }
    }

    return {
      avgPrice,
      totalTransactions,
      yoyChange,
      avgVsAsking: 0, // PPD does not contain asking prices
    };
  } catch (error) {
    console.error("[sold-prices-service] getSoldPriceStats unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return empty;
  }
}

/**
 * Full-text search across sold price records.
 * Searches address fields (street, town_city, postcode) using PostgreSQL
 * text search or ILIKE patterns.
 */
export async function searchSoldPrices(
  query: string,
  options?: { limit?: number; offset?: number; propertyType?: string },
): Promise<{ records: SoldPriceRecord[]; total: number }> {
  try {
    if (!query || query.trim().length < 2) {
      return { records: [], total: 0 };
    }

    const supabase = await createClient();
    const limit = Math.min(options?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = options?.offset ?? 0;
    const searchTerm = query.trim();

    // Check if it looks like a postcode (starts with letter(s) + digit)
    const isPostcodeLike = /^[A-Za-z]{1,2}\d/.test(searchTerm);

    let dbQuery = supabase
      .from("price_paid_transactions")
      .select(PPD_COLUMNS, { count: "exact" })
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"]);

    if (isPostcodeLike) {
      // Search by postcode prefix
      dbQuery = dbQuery.ilike("postcode", `${searchTerm}%`);
    } else {
      // Search across address fields
      dbQuery = dbQuery.or(
        `street.ilike.%${searchTerm}%,town_city.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%,paon.ilike.%${searchTerm}%`,
      );
    }

    if (options?.propertyType) {
      dbQuery = dbQuery.eq("property_type", options.propertyType.toUpperCase());
    }

    const { data, count, error } = await dbQuery
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[sold-prices-service] searchSoldPrices error:", {
        code: error.code,
        message: error.message,
      });
      return { records: [], total: 0 };
    }

    const records = (data as PpdRow[] | null)?.map(rowToRecord) ?? [];
    return { records, total: count ?? records.length };
  } catch (error) {
    console.error("[sold-prices-service] searchSoldPrices unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return { records: [], total: 0 };
  }
}

/**
 * Get regional average prices by year for a postcode area (e.g. "SW", "LS6").
 * Used for chart overlays comparing a property's value against the regional trend.
 */
export async function getRegionalAverage(
  postcodeArea: string,
  propertyType?: string,
): Promise<Array<{ year: number; avgPrice: number }>> {
  try {
    const supabase = await createClient();
    const normalised = postcodeArea.toUpperCase().trim();

    // Query all transactions in this postcode area, grouped by year
    // We use postcode_area (generated column) for efficient filtering
    let query = supabase
      .from("price_paid_transactions")
      .select("price, transaction_date")
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .eq("postcode_area", normalised);

    if (propertyType) {
      query = query.eq("property_type", propertyType.toUpperCase());
    }

    // Fetch last 10 years of data
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    query = query.gte(
      "transaction_date",
      tenYearsAgo.toISOString().split("T")[0],
    );

    const { data, error } = await query;

    if (error) {
      console.error("[sold-prices-service] getRegionalAverage error:", {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by year and calculate averages
    const byYear = new Map<number, { sum: number; count: number }>();
    for (const row of data as { price: number; transaction_date: string }[]) {
      const year = new Date(row.transaction_date).getFullYear();
      const existing = byYear.get(year) ?? { sum: 0, count: 0 };
      existing.sum += row.price;
      existing.count += 1;
      byYear.set(year, existing);
    }

    return Array.from(byYear.entries())
      .map(([year, { sum, count }]) => ({
        year,
        avgPrice: Math.round(sum / count),
      }))
      .sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error("[sold-prices-service] getRegionalAverage unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return [];
  }
}

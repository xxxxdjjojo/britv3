import { Pool } from "pg";
import type { RawComparable } from "@/lib/valuation/engine";
import type { PpdPropertyType } from "@/types/valuation";
import { MIN_VALID_PRICE, MAX_VALID_PRICE } from "@/lib/valuation/constants";

/**
 * Read-only access to HM Land Registry Price Paid Data (`price_paid_data`,
 * already loaded, ~31M rows). Aggregation/filtering is not expressible through
 * PostgREST, so we run parametrised read-only SQL over SUPABASE_DB_URL. No
 * schema is created or modified.
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("SUPABASE_DB_URL is not configured");
  pool = new Pool({ connectionString, max: 4, idleTimeoutMillis: 30_000, statement_timeout: 15_000 });
  return pool;
}

const HOUSE_FAMILY: ReadonlyArray<PpdPropertyType> = ["D", "S", "T"];

/** Broad property family used to pre-filter comparables (houses vs flats). */
export function propertyFamily(type: PpdPropertyType): readonly PpdPropertyType[] {
  if (HOUSE_FAMILY.includes(type)) return HOUSE_FAMILY;
  if (type === "F") return ["F"];
  return ["O"];
}

type PpdRow = {
  transaction_id: string;
  price: string;
  sale_date: string;
  postcode: string | null;
  outward_code: string;
  property_type: string;
  old_new: string;
  duration: string;
  paon: string | null;
  saon: string | null;
  street: string | null;
  district: string | null;
  ppd_category: string;
  record_status: string;
};

function rowToComparable(r: PpdRow): RawComparable {
  return {
    transactionId: r.transaction_id,
    price: Number(r.price),
    saleDate: r.sale_date,
    postcode: r.postcode ?? "",
    outwardCode: r.outward_code,
    propertyType: (["D", "S", "T", "F", "O"].includes(r.property_type)
      ? r.property_type
      : "O") as PpdPropertyType,
    newBuild: r.old_new === "Y",
    tenure: r.duration === "L" ? "L" : "F",
    paon: r.paon,
    saon: r.saon,
    street: r.street,
    district: r.district ?? null,
    // No per-row geocode available without an address gazetteer join; distance is
    // neutral within an outward code. Documented in the data-quality audit.
    distanceMetres: null,
    ppdCategory: r.ppd_category === "B" ? "B" : "A",
    recordStatus: (["A", "C", "D"].includes(r.record_status) ? r.record_status : "A") as
      | "A"
      | "C"
      | "D",
    bedrooms: null, // PPD does not record bedrooms
  };
}

export type FetchComparablesParams = Readonly<{
  outwardCode: string;
  types: readonly PpdPropertyType[];
  sinceDate: string; // ISO YYYY-MM-DD lower bound
  /** Exclusive upper bound — used by the backtest to prevent future-data leakage. */
  beforeDate?: string;
  /** Exclude a specific transaction — prevents a target being its own comparable. */
  excludeTransactionId?: string;
  limit?: number;
}>;

/** Eligible, recent comparables within an outward code, newest first. */
export async function fetchComparables(params: FetchComparablesParams): Promise<RawComparable[]> {
  const limit = params.limit ?? 300;
  const sql = `
    SELECT transaction_id, price, date_of_transfer::date::text AS sale_date,
           postcode, outward_code, property_type, old_new, duration,
           paon, saon, street, district, ppd_category, record_status
    FROM public.price_paid_data
    WHERE outward_code = $1
      AND property_type = ANY($2::text[])
      AND ppd_category = 'A'
      AND record_status <> 'D'
      AND date_of_transfer >= $3::date
      AND ($4::date IS NULL OR date_of_transfer < $4::date)
      AND ($5::text IS NULL OR transaction_id <> $5)
      AND price BETWEEN $6 AND $7
    ORDER BY date_of_transfer DESC
    LIMIT $8
  `;
  const { rows } = await getPool().query<PpdRow>(sql, [
    params.outwardCode,
    params.types,
    params.sinceDate,
    params.beforeDate ?? null,
    params.excludeTransactionId ?? null,
    MIN_VALID_PRICE,
    MAX_VALID_PRICE,
    limit,
  ]);
  return rows.map(rowToComparable);
}

import type { HpiPoint } from "@/lib/valuation/hpi";

const HPI_COLUMN: Readonly<Record<PpdPropertyType, string>> = {
  D: "index_detached",
  S: "index_semi",
  T: "index_terraced",
  F: "index_flat",
  O: "index_all",
};
const HPI_NATIONAL_FALLBACKS = ["united kingdom", "england", "england and wales"];

async function hpiRowsFor(region: string, typeColumn: string): Promise<HpiPoint[]> {
  const sql = `
    SELECT month, COALESCE(${typeColumn}, index_all) AS idx
    FROM public.hpi_index
    WHERE lower(region_name) = lower($1) AND COALESCE(${typeColumn}, index_all) IS NOT NULL
    ORDER BY month
  `;
  const { rows } = await getPool().query<{ month: string; idx: string }>(sql, [region]);
  return rows.map((r) => ({ month: r.month, index: Number(r.idx) }));
}

/**
 * Monthly HPI series for a district + property type, used to time-adjust
 * comparables. Falls back to a national series, then to empty (engine then
 * skips time-adjustment). Type column is validated against a fixed allow-list.
 */
export async function fetchHpiSeries(
  districtName: string | null,
  propertyType: PpdPropertyType,
): Promise<HpiPoint[]> {
  const typeColumn = HPI_COLUMN[propertyType] ?? "index_all";
  try {
    if (districtName) {
      const local = await hpiRowsFor(districtName, typeColumn);
      if (local.length >= 12) return local;
    }
    for (const national of HPI_NATIONAL_FALLBACKS) {
      const series = await hpiRowsFor(national, typeColumn);
      if (series.length >= 12) return series;
    }
  } catch {
    // hpi_index may be empty/absent — engine then skips time-adjustment.
  }
  return [];
}

/** WGS84 centroids for a set of postcodes (empty if the table isn't populated). */
export async function fetchPostcodeCentroids(
  postcodes: readonly string[],
): Promise<Map<string, { lat: number; lng: number }>> {
  const map = new Map<string, { lat: number; lng: number }>();
  const unique = [...new Set(postcodes.filter(Boolean))];
  if (unique.length === 0) return map;
  const sql = `SELECT postcode, latitude, longitude FROM public.postcode_centroids WHERE postcode = ANY($1::text[])`;
  try {
    const { rows } = await getPool().query<{ postcode: string; latitude: string; longitude: string }>(
      sql,
      [unique],
    );
    for (const r of rows) {
      map.set(r.postcode, { lat: Number(r.latitude), lng: Number(r.longitude) });
    }
  } catch {
    // table may not exist yet in some environments — fall back to proxy distance
  }
  return map;
}

export type AddressCandidate = Readonly<{
  paon: string | null;
  saon: string | null;
  street: string | null;
  label: string;
}>;

function addressLabel(paon: string | null, saon: string | null, street: string | null): string {
  return [saon, paon, street].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Candidate addresses for a full postcode, derived from previously-registered
 * sales. Not exhaustive (only addresses that have transacted) — the UI offers a
 * manual-entry fallback. A future OS address gazetteer can supersede this.
 */
export async function fetchAddressCandidates(postcode: string): Promise<AddressCandidate[]> {
  const sql = `
    SELECT DISTINCT paon, saon, street
    FROM public.price_paid_data
    WHERE postcode = $1 AND record_status <> 'D'
    ORDER BY street NULLS LAST, paon, saon NULLS FIRST
    LIMIT 250
  `;
  const { rows } = await getPool().query<{ paon: string | null; saon: string | null; street: string | null }>(
    sql,
    [postcode],
  );
  return rows.map((r) => ({
    paon: r.paon,
    saon: r.saon,
    street: r.street,
    label: addressLabel(r.paon, r.saon, r.street),
  }));
}

export type FetchBacktestTargetsParams = Readonly<{
  outwardCodes: readonly string[];
  fromDate: string; // inclusive
  toDate: string; // exclusive
  perOutward: number;
}>;

/**
 * Deterministic sample of recent eligible sales used as backtest targets. Each
 * target is later valued "as of" its own sale date, excluding itself, so the
 * estimate can be compared to the price that actually transacted.
 */
export async function fetchBacktestTargets(
  params: FetchBacktestTargetsParams,
): Promise<RawComparable[]> {
  const sql = `
    SELECT transaction_id, price, sale_date, postcode, outward_code, property_type,
           old_new, duration, paon, saon, street, ppd_category, record_status
    FROM (
      SELECT transaction_id, price, date_of_transfer::date::text AS sale_date,
             postcode, outward_code, property_type, old_new, duration,
             paon, saon, street, ppd_category, record_status,
             row_number() OVER (PARTITION BY outward_code ORDER BY transaction_id) AS rn
      FROM public.price_paid_data
      WHERE outward_code = ANY($1::text[])
        AND date_of_transfer >= $2::date
        AND date_of_transfer < $3::date
        AND ppd_category = 'A'
        AND record_status <> 'D'
        AND price BETWEEN $4 AND $5
    ) ranked
    WHERE rn <= $6
    ORDER BY outward_code, transaction_id
  `;
  const { rows } = await getPool().query<PpdRow>(sql, [
    params.outwardCodes,
    params.fromDate,
    params.toDate,
    MIN_VALID_PRICE,
    MAX_VALID_PRICE,
    params.perOutward,
  ]);
  return rows.map(rowToComparable);
}

/** The subject property's own most recent registered sale, if matchable.
 *  beforeDate/excludeTransactionId prevent backtest leakage (a property's own
 *  future or same-day sale must not anchor its historical valuation). */
export async function fetchSubjectPriorSale(
  postcode: string,
  paon: string,
  saon: string | null,
  beforeDate?: string,
  excludeTransactionId?: string,
): Promise<RawComparable | null> {
  const sql = `
    SELECT transaction_id, price, date_of_transfer::date::text AS sale_date,
           postcode, outward_code, property_type, old_new, duration,
           paon, saon, street, ppd_category, record_status
    FROM public.price_paid_data
    WHERE postcode = $1
      AND upper(paon) = upper($2)
      AND (($3::text IS NULL AND saon IS NULL) OR upper(saon) = upper($3))
      AND record_status <> 'D'
      AND ($4::date IS NULL OR date_of_transfer < $4::date)
      AND ($5::text IS NULL OR transaction_id <> $5)
    ORDER BY date_of_transfer DESC
    LIMIT 1
  `;
  const { rows } = await getPool().query<PpdRow>(sql, [
    postcode,
    paon,
    saon,
    beforeDate ?? null,
    excludeTransactionId ?? null,
  ]);
  return rows.length ? rowToComparable(rows[0]) : null;
}

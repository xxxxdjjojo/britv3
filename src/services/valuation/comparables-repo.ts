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
  limit?: number;
}>;

/** Eligible, recent comparables within an outward code, newest first. */
export async function fetchComparables(params: FetchComparablesParams): Promise<RawComparable[]> {
  const limit = params.limit ?? 300;
  const sql = `
    SELECT transaction_id, price, date_of_transfer::date::text AS sale_date,
           postcode, outward_code, property_type, old_new, duration,
           paon, saon, street, ppd_category, record_status
    FROM public.price_paid_data
    WHERE outward_code = $1
      AND property_type = ANY($2::text[])
      AND ppd_category = 'A'
      AND record_status <> 'D'
      AND date_of_transfer >= $3::date
      AND price BETWEEN $4 AND $5
    ORDER BY date_of_transfer DESC
    LIMIT $6
  `;
  const { rows } = await getPool().query<PpdRow>(sql, [
    params.outwardCode,
    params.types,
    params.sinceDate,
    MIN_VALID_PRICE,
    MAX_VALID_PRICE,
    limit,
  ]);
  return rows.map(rowToComparable);
}

/** The subject property's own most recent registered sale, if matchable. */
export async function fetchSubjectPriorSale(
  postcode: string,
  paon: string,
  saon: string | null,
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
    ORDER BY date_of_transfer DESC
    LIMIT 1
  `;
  const { rows } = await getPool().query<PpdRow>(sql, [postcode, paon, saon]);
  return rows.length ? rowToComparable(rows[0]) : null;
}

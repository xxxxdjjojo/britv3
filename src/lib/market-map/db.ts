import "server-only";
import { Pool } from "pg";

/**
 * Read-only Postgres pool for the market-map feature.
 *
 * The HM Land Registry Price Paid Data (`price_paid_data`) is already loaded in
 * the database, and the aggregation (GROUP BY + percentile_cont) is not
 * expressible through the Supabase/PostgREST client, so we run parametrised,
 * read-only SQL directly over the existing connection string. No schema is
 * created or modified.
 */
let pool: Pool | null = null;

export function getMarketMapPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured");
  }

  pool = new Pool({
    connectionString,
    max: 4,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
  });
  return pool;
}

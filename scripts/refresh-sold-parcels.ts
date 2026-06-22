/**
 * scripts/refresh-sold-parcels.ts
 *
 * Materialises public.market_map_sold_parcels for one LAD by calling
 * refresh_market_map_sold_parcels(lad). Runs over a direct connection with
 * statement_timeout disabled (the match + point-in-polygon can take a while),
 * so it is not bound by the API/MCP timeout.
 *
 *   node --experimental-strip-types scripts/refresh-sold-parcels.ts --lad E09000030
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function loadDbUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.split("#")[0].trim();
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1 || line.slice(0, i).trim() !== "SUPABASE_DB_URL") continue;
    return line.slice(i + 1).trim().replace(/^["']|["']$/g, "").split("#")[0].trim().replace(/\s+.*$/, "");
  }
  return "";
}

function loadCaCert(): string {
  const caPath = process.env.PGSSLROOTCERT || resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt");
  return readFileSync(caPath, "utf8");
}

async function main(): Promise<void> {
  const lad = argValue("--lad");
  if (!lad) {
    console.error("--lad <code> is required (e.g. E09000030).");
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { ca: loadCaCert(), rejectUnauthorized: true },
  });
  await client.connect();
  await client.query("set statement_timeout = 0");
  console.log(`Refreshing market_map_sold_parcels for ${lad}…`);
  const t0 = Date.now();
  const res = await client.query<{ refresh_market_map_sold_parcels: number }>(
    "select public.refresh_market_map_sold_parcels($1) as refresh_market_map_sold_parcels",
    [lad],
  );
  const rows = res.rows[0].refresh_market_map_sold_parcels;
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${rows} parcels materialised.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Load HM Land Registry Price Paid Data into Supabase.
 *
 * Usage:
 *   npx tsx scripts/load-ppd-initial.ts [path-to-csv]
 *
 * Env vars (reads from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * CSV source: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { config } from "dotenv";
import { resolve } from "path";

// Load env vars from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CSV_PATH = process.argv[2] || resolve(process.env.HOME!, "Downloads/pp-complete.csv");
const BATCH_SIZE = 3000;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// PPD CSV column order (no headers in file)
const PPD_COLUMNS = [
  "transaction_id", "price", "transaction_date", "postcode",
  "property_type", "is_new_build", "tenure",
  "paon", "saon", "street", "locality", "town_city",
  "district", "county", "transaction_category", "record_status",
] as const;

/** Transform a raw CSV row into the DB shape. Shared with monthly sync. */
export function transformRow(raw: Record<string, string>) {
  const price = parseInt(raw.price, 10);
  const txDate = raw.transaction_date?.split(" ")[0];
  if (!price || !txDate) return null;

  return {
    transaction_id: raw.transaction_id?.replace(/[{}]/g, ""),
    price,
    transaction_date: txDate,
    postcode: raw.postcode?.trim().toUpperCase() || null,
    property_type: raw.property_type || null,
    is_new_build: raw.is_new_build === "Y",
    tenure: raw.tenure || null,
    paon: raw.paon?.trim() || null,
    saon: raw.saon?.trim() || null,
    street: raw.street?.trim() || null,
    locality: raw.locality?.trim() || null,
    town_city: raw.town_city?.trim() || null,
    district: raw.district?.trim() || null,
    county: raw.county?.trim() || null,
    transaction_category: raw.transaction_category || null,
    record_status: raw.record_status?.trim() || "A",
  };
}

async function loadPPD() {
  console.log("=== PPD Initial Load ===");
  console.log(`CSV: ${CSV_PATH}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log("");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Log sync start
  const { data: syncLog } = await supabase.from("ppd_sync_log").insert({
    sync_type: "initial_load",
    source_file: CSV_PATH,
    status: "started",
  }).select().single();

  let batch: NonNullable<ReturnType<typeof transformRow>>[] = [];
  let totalAdded = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const startTime = Date.now();

  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: PPD_COLUMNS as unknown as string[],
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }),
  );

  async function flushBatch() {
    if (batch.length === 0) return;
    const toInsert = [...batch];
    batch = [];

    const { error } = await supabase
      .from("price_paid_transactions")
      .upsert(toInsert, { onConflict: "transaction_id", ignoreDuplicates: true });

    if (error) {
      console.error(`  Batch error at row ~${totalAdded}: ${error.message}`);
      errorCount++;
    } else {
      totalAdded += toInsert.length;
    }

    if (totalAdded % 30000 === 0 || error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (totalAdded / ((Date.now() - startTime) / 1000)).toFixed(0);
      console.log(`  ${totalAdded.toLocaleString()} rows loaded (${elapsed}s, ${rate} rows/s, ${errorCount} errors)`);
    }
  }

  const batcher = new Transform({
    objectMode: true,
    async transform(row, _enc, cb) {
      try {
        const transformed = transformRow(row);
        if (transformed) {
          batch.push(transformed);
        } else {
          skippedCount++;
        }

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      } catch (e) {
        console.error("Row transform error:", e);
        skippedCount++;
      }
      cb();
    },
    async flush(cb) {
      await flushBatch();
      cb();
    },
  });

  console.log("Loading...");
  await pipeline(parser, batcher);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Update sync log
  if (syncLog?.id) {
    await supabase.from("ppd_sync_log").update({
      records_added: totalAdded,
      status: errorCount > 0 ? "completed_with_errors" : "completed",
      error_message: errorCount > 0 ? `${errorCount} batch errors` : null,
      completed_at: new Date().toISOString(),
    }).eq("id", syncLog.id);
  }

  console.log("");
  console.log("=== PPD Initial Load Complete ===");
  console.log(`Total loaded:  ${totalAdded.toLocaleString()}`);
  console.log(`Skipped:       ${skippedCount.toLocaleString()}`);
  console.log(`Batch errors:  ${errorCount}`);
  console.log(`Time:          ${totalTime} minutes`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Recreate indexes (run via Supabase MCP or SQL editor)");
  console.log("  2. Run: SELECT count(*) FROM price_paid_transactions;");
  console.log("  3. Run: SELECT DISTINCT district FROM price_paid_transactions WHERE town_city = 'LONDON' ORDER BY district;");
}

loadPPD().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

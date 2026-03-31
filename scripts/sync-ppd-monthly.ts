/**
 * Monthly sync for HM Land Registry Price Paid Data.
 *
 * Downloads the monthly update file (delta: additions, changes, deletions)
 * and applies to Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-ppd-monthly.ts [year] [month]
 *   # Defaults to previous month if no args provided
 *
 * Env vars (reads from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { transformRow } from "./load-ppd-initial";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BATCH_SIZE = 2000;

const LR_MONTHLY_URL = (year: number, month: number) =>
  `http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv`;

// PPD CSV column order
const PPD_COLUMNS = [
  "transaction_id", "price", "transaction_date", "postcode",
  "property_type", "is_new_build", "tenure",
  "paon", "saon", "street", "locality", "town_city",
  "district", "county", "transaction_category", "record_status",
];

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cols.push(current.trim());
  return cols;
}

async function syncMonthly() {
  const now = new Date();
  const targetYear = parseInt(process.argv[2]) || now.getFullYear();
  const targetMonth = parseInt(process.argv[3]) || now.getMonth(); // previous month (0-indexed)
  const url = LR_MONTHLY_URL(targetYear, targetMonth);

  console.log("=== PPD Monthly Sync ===");
  console.log(`Target: ${targetYear}-${String(targetMonth).padStart(2, "0")}`);
  console.log(`URL: ${url}`);
  console.log("");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Log sync start
  const { data: syncLog } = await supabase.from("ppd_sync_log").insert({
    sync_type: "monthly_update",
    source_file: url,
    status: "started",
  }).select().single();

  try {
    console.log("Downloading monthly update file...");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }

    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    console.log(`Downloaded ${lines.length.toLocaleString()} records`);

    // Validate CSV structure (schema validation per eng review)
    const firstLine = lines[0];
    if (firstLine) {
      const cols = parseCSVLine(firstLine);
      if (cols.length < 16) {
        throw new Error(`CSV format changed: expected 16 columns, got ${cols.length}. Manual review required.`);
      }
    }

    const toUpsert: NonNullable<ReturnType<typeof transformRow>>[] = [];
    const toDelete: string[] = [];
    let skipped = 0;

    for (const line of lines) {
      const cols = parseCSVLine(line);
      if (cols.length < 16) {
        skipped++;
        continue;
      }

      const raw: Record<string, string> = {};
      PPD_COLUMNS.forEach((col, i) => raw[col] = cols[i] ?? "");

      const status = raw.record_status?.trim();
      const transformed = transformRow(raw);

      if (!transformed) {
        skipped++;
        continue;
      }

      if (status === "D") {
        toDelete.push(transformed.transaction_id);
      } else {
        toUpsert.push(transformed);
      }
    }

    console.log(`To upsert: ${toUpsert.length.toLocaleString()}`);
    console.log(`To delete: ${toDelete.length.toLocaleString()}`);
    console.log(`Skipped:   ${skipped}`);

    // Batch upsert
    let upserted = 0;
    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("price_paid_transactions")
        .upsert(batch, { onConflict: "transaction_id" });

      if (error) {
        console.error(`Upsert batch error at ${i}: ${error.message}`);
      } else {
        upserted += batch.length;
      }
    }

    // Batch delete
    let deleted = 0;
    if (toDelete.length > 0) {
      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from("price_paid_transactions")
          .delete()
          .in("transaction_id", batch);

        if (error) {
          console.error(`Delete batch error: ${error.message}`);
        } else {
          deleted += batch.length;
        }
      }
    }

    // Update sync log
    if (syncLog?.id) {
      await supabase.from("ppd_sync_log").update({
        records_added: upserted,
        records_deleted: deleted,
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", syncLog.id);
    }

    console.log("");
    console.log("=== Monthly Sync Complete ===");
    console.log(`Upserted: ${upserted.toLocaleString()}`);
    console.log(`Deleted:  ${deleted.toLocaleString()}`);

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Sync failed:", message);

    if (syncLog?.id) {
      await supabase.from("ppd_sync_log").update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      }).eq("id", syncLog.id);
    }

    process.exit(1);
  }
}

syncMonthly().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed PPD ingest service (Phase 3, spec §4.1–§4.2 — `ppd:ingest` job).
 *
 * `applyPpdRows` applies a parsed HMLR Price Paid Data monthly-update batch
 * to `ppd_transactions`. PPD is a *revisable* dataset, so rows are
 * partitioned by record status: A (addition) and C (change) rows are
 * upserted keyed on `ppd_tuid` (in chunks of {@link UPSERT_CHUNK_SIZE});
 * D (deletion) rows are deleted by tuid. `startIngestRun` /
 * `finishIngestRun` bracket the batch in a `ppd_ingest_runs` audit row.
 *
 * SECURITY NOTE: PPD rows contain addresses but no person data; error logs
 * emit only error_type (the Error constructor name) and run/file
 * identifiers, never row contents.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedPpdRow } from "@/lib/truedeed/ppd-parser";

/** Supabase upsert batch size (spec §4.1: chunked writes, 500 per call). */
const UPSERT_CHUNK_SIZE = 500;

export type PpdIngestCounts = {
  added: number;
  changed: number;
  deleted: number;
};

export type PpdIngestRunStatus = "succeeded" | "failed";

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/** Map a parsed PPD row onto the `ppd_transactions` column set (spec §4.1). */
function toTransactionPayload(
  row: ParsedPpdRow,
  ingestRunId: string,
): Record<string, unknown> {
  return {
    ppd_tuid: row.tuid,
    price_pence: row.pricePence,
    transfer_date: row.transferDate,
    postcode: row.postcode,
    property_type: row.propertyType,
    new_build: row.newBuild,
    tenure: row.tenure,
    paon: row.paon,
    saon: row.saon,
    street: row.street,
    locality: row.locality,
    town: row.town,
    district: row.district,
    county: row.county,
    ppd_category: row.ppdCategory,
    last_record_status: row.recordStatus,
    ingest_run_id: ingestRunId,
  };
}

/**
 * Applies a batch of parsed PPD rows: A/C rows upserted into
 * `ppd_transactions` (onConflict `ppd_tuid`, chunks of 500), D rows deleted
 * by tuid. Returns the A/C/D counts, or null on any database error.
 * Never throws.
 */
export async function applyPpdRows(
  rows: ParsedPpdRow[],
  ingestRunId: string,
): Promise<PpdIngestCounts | null> {
  if (rows.length === 0) return { added: 0, changed: 0, deleted: 0 };

  try {
    const supabase = createAdminClient();

    const upsertRows: ParsedPpdRow[] = [];
    const deleteTuids: string[] = [];
    let added = 0;
    let changed = 0;
    for (const row of rows) {
      if (row.recordStatus === "D") {
        deleteTuids.push(row.tuid);
      } else {
        upsertRows.push(row);
        if (row.recordStatus === "C") changed += 1;
        else added += 1;
      }
    }

    for (let i = 0; i < upsertRows.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = upsertRows
        .slice(i, i + UPSERT_CHUNK_SIZE)
        .map((row) => toTransactionPayload(row, ingestRunId));
      const { error } = await supabase
        .from("ppd_transactions")
        .upsert(chunk, { onConflict: "ppd_tuid" });
      if (error) {
        console.error("[truedeed] applyPpdRows upsert failed", {
          ingest_run_id: ingestRunId,
          chunk_index: i / UPSERT_CHUNK_SIZE,
        });
        return null;
      }
    }

    if (deleteTuids.length > 0) {
      const { error } = await supabase
        .from("ppd_transactions")
        .delete()
        .in("ppd_tuid", deleteTuids);
      if (error) {
        console.error("[truedeed] applyPpdRows delete failed", {
          ingest_run_id: ingestRunId,
        });
        return null;
      }
    }

    return { added, changed, deleted: deleteTuids.length };
  } catch (error: unknown) {
    console.error("[truedeed] applyPpdRows failed", {
      error_type: errorType(error),
      ingest_run_id: ingestRunId,
    });
    return null;
  }
}

/**
 * Opens a `ppd_ingest_runs` audit row for a monthly-update file (status
 * defaults to 'running' in the database). Returns the new run id, or null
 * on error. Never throws.
 */
export async function startIngestRun(
  fileLabel: string,
  fileSha256: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ppd_ingest_runs")
      .insert({ file_label: fileLabel, file_sha256: fileSha256 })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[truedeed] startIngestRun insert failed", {
        file_label: fileLabel,
      });
      return null;
    }
    return data.id as string;
  } catch (error: unknown) {
    console.error("[truedeed] startIngestRun failed", {
      error_type: errorType(error),
      file_label: fileLabel,
    });
    return null;
  }
}

/**
 * Closes a `ppd_ingest_runs` row with its final status, row counts and
 * finish time. Returns true on success, false on error. Never throws.
 */
export async function finishIngestRun(
  id: string,
  counts: PpdIngestCounts,
  status: PpdIngestRunStatus,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("ppd_ingest_runs")
      .update({
        status,
        rows_added: counts.added,
        rows_changed: counts.changed,
        rows_deleted: counts.deleted,
        finished_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.error("[truedeed] finishIngestRun update failed", {
        ingest_run_id: id,
      });
      return false;
    }
    return true;
  } catch (error: unknown) {
    console.error("[truedeed] finishIngestRun failed", {
      error_type: errorType(error),
      ingest_run_id: id,
    });
    return false;
  }
}

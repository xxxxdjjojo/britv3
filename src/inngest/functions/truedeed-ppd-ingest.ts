/**
 * Inngest job: Truedeed PPD monthly-update ingest (spec §4.2, `ppd:ingest`).
 *
 * Triggers:
 *   • cron "0 7 25 * *" — monthly on the 25th, after HMLR's 20th-working-day
 *     refresh of the Price Paid Data monthly-update file
 *   • event "truedeed/ppd.ingest-requested" — manual re-run
 *
 * Flow:
 *   1. Fetch the monthly update CSV, compute its sha256 (size + hash only are
 *      memoized — never the multi-MB body)
 *   2. Skip (audit-log 'ppd_ingest_skipped') if a succeeded ppd_ingest_runs
 *      row already has this file_sha256
 *   3. startIngestRun → 4. re-fetch + verify sha, stream-parse via
 *      iteratePpdCsv, applyPpdRows in chunks → 5. finishIngestRun with counts
 *   6. Send 'truedeed/ppd.ingested' so the matcher runs → 7. audit log
 *
 * SCOPE NOTE: This handles the tens-of-MB MONTHLY update file only. The
 * multi-GB full historical (bootstrap) file is OUT of scope — it is a
 * one-off load that needs a true streaming pipeline, not an Inngest step.
 *
 * SECURITY NOTE (planit-service style): the source URL is a fixed constant —
 * never interpolated from event data. PPD is open data, but error logs emit
 * only error_type (the Error constructor name), byte sizes and row counts;
 * never raw CSV lines. HMLR serves this S3 website endpoint over plain http,
 * so the sha256 is recorded on the ingest run as the integrity anchor and
 * re-verified before parsing.
 */

import { createHash } from "node:crypto";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import { iteratePpdCsv } from "@/lib/truedeed/ppd-parser";
import type { ParsedPpdRow } from "@/lib/truedeed/ppd-parser";
import {
  applyPpdRows,
  startIngestRun,
  finishIngestRun,
} from "@/services/truedeed/ppd-ingest-service";
import type { PpdIngestCounts } from "@/services/truedeed/ppd-ingest-service";

// Fixed source: HMLR PPD monthly update (new version). See SECURITY NOTE.
// HTTPS S3 REST endpoint deliberately (the s3-website endpoint HMLR links to
// is HTTP-only; this data feeds invoice candidates, so transport integrity
// matters).
const PPD_MONTHLY_UPDATE_URL =
  "https://prod.publicdata.landregistry.gov.uk.s3.eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv";

/** Rows accumulated per applyPpdRows call (the service chunks writes at 500). */
const APPLY_BATCH_SIZE = 5000;

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function fetchCsvText(): Promise<string> {
  const response = await fetch(PPD_MONTHLY_UPDATE_URL);
  if (!response.ok) {
    throw new Error(`PPD monthly update fetch failed: HTTP ${response.status}`);
  }
  return response.text();
}

export const truedeedPpdIngest = inngest.createFunction(
  {
    id: "truedeed-ppd-ingest",
    name: "Ingest HMLR PPD monthly update",
    retries: 3,
  },
  [{ cron: "0 7 25 * *" }, { event: "truedeed/ppd.ingest-requested" }],
  async ({ step }) => {
    const supabase = createAdminClient();

    // Step 1: fetch + hash. Only the hash/size are memoized as step state —
    // the body is re-fetched (and sha-verified) by the parse step.
    const file = await step.run("fetch-and-hash", async () => {
      try {
        const text = await fetchCsvText();
        return { sha256: sha256Hex(text), sizeBytes: Buffer.byteLength(text, "utf8") };
      } catch (err) {
        captureException(err, {
          module: "truedeed",
          feature: "ppd-ingest",
          operation: "fetchAndHash",
        });
        throw err;
      }
    });

    const fileLabel = `pp-monthly-update-new-version.csv (${new Date().toISOString().slice(0, 10)})`;

    // Step 2: dedupe — a succeeded run with this sha256 means this exact file
    // has already been applied.
    const alreadyIngested = await step.run("check-duplicate", async () => {
      const { data, error } = await supabase
        .from("ppd_ingest_runs")
        .select("id")
        .eq("file_sha256", file.sha256)
        .eq("status", "succeeded")
        .limit(1)
        .maybeSingle();

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "ppd-ingest",
          operation: "checkDuplicate",
        });
        throw new Error(`Failed to check for prior ingest: ${error.message}`);
      }

      return (data as { id: string } | null)?.id ?? null;
    });

    if (alreadyIngested) {
      await step.run("audit-log-skipped", async () => {
        await supabase.from("truedeed_audit_log").insert({
          actor: null,
          action: "ppd_ingest_skipped",
          entity: "ppd_ingest_run",
          entity_id: alreadyIngested,
          detail: { file_sha256: file.sha256, file_label: fileLabel },
        });
      });
      return {
        status: "skipped_duplicate",
        fileSha256: file.sha256,
        priorRunId: alreadyIngested,
      };
    }

    // Step 3: open the ingest run row.
    const ingestRunId = await step.run("start-run", async () => {
      const runId = await startIngestRun(fileLabel, file.sha256);
      if (!runId) {
        throw new Error("startIngestRun failed (see service logs)");
      }
      return runId;
    });

    // Step 4: pragmatic single step — re-fetch, verify sha, parse + apply.
    // Acceptable for the tens-of-MB monthly file (see SCOPE NOTE).
    const counts = await step.run("parse-and-apply", async () => {
      let text: string;
      try {
        text = await fetchCsvText();
      } catch (err) {
        captureException(err, {
          module: "truedeed",
          feature: "ppd-ingest",
          operation: "refetchForParse",
          extra: { ingestRunId },
        });
        throw err;
      }

      if (sha256Hex(text) !== file.sha256) {
        // HMLR replaced the file between steps — fail this run; the next
        // scheduled/manual run picks up the new file under its own sha.
        await finishIngestRun(
          ingestRunId,
          { added: 0, changed: 0, deleted: 0 },
          "failed",
        );
        throw new Error("PPD file changed between hash and parse steps");
      }

      const totals: PpdIngestCounts = { added: 0, changed: 0, deleted: 0 };
      let batch: ParsedPpdRow[] = [];

      const flush = async (): Promise<void> => {
        if (batch.length === 0) return;
        const result = await applyPpdRows(batch, ingestRunId);
        if (!result) {
          await finishIngestRun(ingestRunId, totals, "failed");
          throw new Error("applyPpdRows failed (see service logs)");
        }
        totals.added += result.added;
        totals.changed += result.changed;
        totals.deleted += result.deleted;
        batch = [];
      };

      for (const row of iteratePpdCsv(text)) {
        batch.push(row);
        if (batch.length >= APPLY_BATCH_SIZE) await flush();
      }
      await flush();

      return totals;
    });

    // Step 5: close the run out with its counts.
    await step.run("finish-run", async () => {
      const finished = await finishIngestRun(ingestRunId, counts, "succeeded");
      if (!finished) {
        throw new Error("finishIngestRun failed (see service logs)");
      }
    });

    // Step 6: chain the matcher (spec §4.2 — ppd:match runs after ingest).
    await step.sendEvent("emit-ingested", {
      name: "truedeed/ppd.ingested",
      data: {
        ingestRunId,
        added: counts.added,
        changed: counts.changed,
        deleted: counts.deleted,
      },
    });

    // Step 7: audit trail.
    await step.run("write-audit-log", async () => {
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "ppd_ingested",
        entity: "ppd_ingest_run",
        entity_id: ingestRunId,
        detail: {
          file_label: fileLabel,
          file_sha256: file.sha256,
          size_bytes: file.sizeBytes,
          rows_added: counts.added,
          rows_changed: counts.changed,
          rows_deleted: counts.deleted,
        },
      });
    });

    return {
      status: "ingested",
      ingestRunId,
      fileSha256: file.sha256,
      ...counts,
    };
  },
);

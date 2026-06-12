/**
 * Inngest jobs: Truedeed PPD matcher (spec §4.2–§4.3, `ppd:match`).
 *
 * Two functions:
 *   • truedeedPpdMatch — event "truedeed/ppd.ingested" (chained after
 *     ingest): pages the run's NEW/CHANGED ppd_transactions (by
 *     ingest_run_id) 500 at a time and scores each page via
 *     processMatchesForPpdRows.
 *   • truedeedPpdMatchLookback — cron "0 9 26 * *" (monthly, the day after
 *     ingest): re-runs matching over ppd_transactions with transfer_date in
 *     the last 3 months (spec §4.2 lookback — catches late registrations and
 *     revisions). Duplicate ppd_tuid+listing_id pairs are skipped by the
 *     service (23505), so re-scoring is safe.
 *
 * Both accumulate { created, queried } counts and write a
 * truedeed_audit_log row (separate actions) with the totals.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import type {
  ParsedPpdRow,
  PpdCategory,
  PpdPropertyType,
  PpdRecordStatus,
} from "@/lib/truedeed/ppd-parser";
import { processMatchesForPpdRows } from "@/services/truedeed/ppd-match-service";

const PAGE_SIZE = 500;
const LOOKBACK_MONTHS = 3;

const TRANSACTION_SELECT =
  "ppd_tuid, price_pence, transfer_date, postcode, property_type, " +
  "new_build, tenure, paon, saon, street, locality, town, district, " +
  "county, ppd_category, last_record_status";

type PpdTransactionRow = {
  ppd_tuid: string;
  price_pence: number;
  transfer_date: string;
  postcode: string | null;
  property_type: string | null;
  new_build: boolean | null;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
  district: string | null;
  county: string | null;
  ppd_category: string;
  last_record_status: string | null;
};

/** Map a ppd_transactions DB row back onto the ParsedPpdRow shape. */
function toParsedPpdRow(row: PpdTransactionRow): ParsedPpdRow {
  return {
    tuid: row.ppd_tuid,
    pricePence: row.price_pence,
    transferDate: row.transfer_date,
    postcode: row.postcode,
    propertyType: (row.property_type ?? "O") as PpdPropertyType,
    newBuild: row.new_build ?? false,
    tenure: row.tenure ?? "",
    paon: row.paon,
    saon: row.saon,
    street: row.street,
    locality: row.locality,
    town: row.town,
    district: row.district,
    county: row.county,
    ppdCategory: (row.ppd_category ?? "A") as PpdCategory,
    recordStatus: (row.last_record_status ?? "A") as PpdRecordStatus,
  };
}

type PageFilter =
  | { kind: "ingest_run"; ingestRunId: string }
  | { kind: "lookback"; sinceDate: string };

type PageCounts = { created: number; queried: number; rowCount: number };

/**
 * Fetches one 500-row page of ppd_transactions under the given filter and
 * scores it via processMatchesForPpdRows. Throws on query/service failure so
 * Inngest retries the enclosing step.
 */
async function scorePage(
  filter: PageFilter,
  page: number,
  feature: string,
): Promise<PageCounts> {
  const supabase = createAdminClient();

  const base = supabase
    .from("ppd_transactions")
    .select(TRANSACTION_SELECT)
    .order("ppd_tuid", { ascending: true })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  const query =
    filter.kind === "ingest_run"
      ? base.eq("ingest_run_id", filter.ingestRunId)
      : base.gte("transfer_date", filter.sinceDate);

  const { data, error } = await query;
  if (error) {
    captureException(error, {
      module: "truedeed",
      feature,
      operation: "fetchTransactionsPage",
      extra: { page },
    });
    throw new Error(`Failed to page ppd_transactions: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PpdTransactionRow[];
  if (rows.length === 0) {
    return { created: 0, queried: 0, rowCount: 0 };
  }

  const counts = await processMatchesForPpdRows(rows.map(toParsedPpdRow));
  if (!counts) {
    throw new Error("processMatchesForPpdRows failed (see service logs)");
  }
  return { ...counts, rowCount: rows.length };
}

export const truedeedPpdMatch = inngest.createFunction(
  {
    id: "truedeed-ppd-match",
    name: "Match new/changed PPD rows against listings",
    retries: 3,
  },
  { event: "truedeed/ppd.ingested" },
  async ({ event, step }) => {
    const { ingestRunId } = event.data as { ingestRunId: string };

    // NEW/CHANGED rows: A/C upserts stamp ingest_run_id; D rows are deleted
    // at ingest, so this run's rows are exactly the new/changed set.
    const filter: PageFilter = { kind: "ingest_run", ingestRunId };
    const totals = { created: 0, queried: 0, rows: 0 };

    for (let page = 0; ; page += 1) {
      const result = await step.run(`match-page-${page}`, () =>
        scorePage(filter, page, "ppd-match"),
      );
      totals.created += result.created;
      totals.queried += result.queried;
      totals.rows += result.rowCount;
      if (result.rowCount < PAGE_SIZE) break;
    }

    await step.run("write-audit-log", async () => {
      const supabase = createAdminClient();
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "ppd_matches_processed",
        entity: "ppd_ingest_run",
        entity_id: ingestRunId,
        detail: {
          rows_scored: totals.rows,
          candidates_created: totals.created,
          branch_queries_raised: totals.queried,
        },
      });
    });

    return { status: "completed", ingestRunId, ...totals };
  },
);

export const truedeedPpdMatchLookback = inngest.createFunction(
  {
    id: "truedeed-ppd-match-lookback",
    name: "3-month PPD lookback rematch",
    retries: 3,
  },
  { cron: "0 9 26 * *" },
  async ({ step }) => {
    // Spec §4.2: re-run matches over the trailing 3 months of transfers to
    // catch late registrations and PPD revisions. Memoized in a step so the
    // window is stable across retries.
    const sinceDate = await step.run("compute-lookback-window", async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - LOOKBACK_MONTHS);
      return since.toISOString().slice(0, 10);
    });

    const filter: PageFilter = { kind: "lookback", sinceDate };
    const totals = { created: 0, queried: 0, rows: 0 };

    for (let page = 0; ; page += 1) {
      const result = await step.run(`match-page-${page}`, () =>
        scorePage(filter, page, "ppd-match-lookback"),
      );
      totals.created += result.created;
      totals.queried += result.queried;
      totals.rows += result.rowCount;
      if (result.rowCount < PAGE_SIZE) break;
    }

    await step.run("write-audit-log", async () => {
      const supabase = createAdminClient();
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "ppd_lookback_matches_processed",
        entity: "ppd_transactions",
        entity_id: null,
        detail: {
          lookback_since: sinceDate,
          rows_scored: totals.rows,
          candidates_created: totals.created,
          branch_queries_raised: totals.queried,
        },
      });
    });

    return { status: "completed", lookbackSince: sinceDate, ...totals };
  },
);

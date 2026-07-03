/**
 * Inngest job: refresh the public report snapshot tables (Influence Strategy
 * Phase 2 — Reality Gap + Time-to-Sell).
 *
 * Triggers:
 *   • cron "0 11 26 * *" — monthly, two hours after the PPD lookback rematch
 *     (truedeed-ppd-match-lookback at 09:00 on the 26th) so matched-pair
 *     counts reflect the freshest confirmations.
 *   • event "truedeed/report-snapshots.refresh-requested" — manual refresh;
 *     optional `data.period` ('2026-Q2') recomputes a specific quarter. An
 *     invalid period is a logged no-op skip — it never reaches the RPCs.
 *
 * Each RPC is a service-role-only SECURITY DEFINER function that recomputes
 * exactly one period (delete-then-insert), so re-runs are idempotent.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import { isValidPeriod } from "@/services/reports/reality-gap-service";

const REFRESH_RPCS = [
  "refresh_reality_gap_snapshots",
  "refresh_time_to_sell_snapshots",
] as const;

async function refreshSnapshot(
  rpc: (typeof REFRESH_RPCS)[number],
  period: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc(rpc, { p_period: period });
  if (error) {
    captureException(error, {
      module: "reports",
      feature: "report-snapshots",
      operation: rpc,
      extra: { period },
    });
    throw new Error(`${rpc} failed: ${error.message}`);
  }
}

export const truedeedReportSnapshots = inngest.createFunction(
  {
    id: "truedeed-report-snapshots",
    name: "Refresh public report snapshots (Reality Gap + Time-to-Sell)",
    retries: 3,
  },
  [
    { cron: "0 11 26 * *" },
    { event: "truedeed/report-snapshots.refresh-requested" },
  ],
  async ({ event, step }) => {
    // Cron invocations carry no data; the manual event may name a period.
    const period =
      (event?.data as { period?: string } | undefined)?.period ?? null;

    // Never pass an unvalidated manual period to the RPCs — a malformed
    // value is a no-op skip (same bad-input pattern as lifecycle-drip),
    // not a retry.
    if (period !== null && !isValidPeriod(period)) {
      return { status: "skipped_invalid_period", period };
    }

    for (const rpc of REFRESH_RPCS) {
      await step.run(rpc.replaceAll("_", "-"), () => refreshSnapshot(rpc, period));
    }

    return { status: "completed", period };
  },
);

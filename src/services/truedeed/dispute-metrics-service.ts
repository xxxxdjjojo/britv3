/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed dispute-metrics service (Phase 5, dispute playbook —
 * "metrics that tell us the playbook is working").
 *
 *  disputesPer100Invoices  total disputes / invoices × 100 (healthy < 8)
 *  concessionRate          conceded / (conceded + rejected) (healthy 0.10–0.25)
 *  pctResolvedAtWindow     rebuttals decided / (rebuttals + invoice_disputes
 *                          decided) — rising % at-window = system working
 *  repeatDisputers         agents with ≥ 2 disputes, count desc
 *  chargebacks             invoices.state = 'charged_back' (healthy ≈ 0)
 *  open / conceded / rejected counts (status breakdown)
 *
 * PostgREST cannot GROUP BY or compute percentiles, so we pull invoice_disputes
 * row-by-row (id, raised_by, status) and aggregate in JS. Counts of large
 * tables come back as head:true select count(*) PostgREST queries. Returns
 * null only on a top-level failure (any required query erroring). Never
 * throws.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type RepeatDisputer = { agentId: string; count: number };

export type DisputeMetrics = {
  disputesPer100Invoices: number;
  concessionRate: number;
  pctResolvedAtWindow: number;
  repeatDisputers: RepeatDisputer[];
  chargebacks: number;
  open: number;
  conceded: number;
  rejected: number;
};

const ZERO_METRICS: DisputeMetrics = {
  disputesPer100Invoices: 0,
  concessionRate: 0,
  pctResolvedAtWindow: 0,
  repeatDisputers: [],
  chargebacks: 0,
  open: 0,
  conceded: 0,
  rejected: 0,
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Returns the dispute playbook health metrics, or null on top-level failure.
 * Never throws.
 */
export async function getDisputeMetrics(): Promise<DisputeMetrics | null> {
  try {
    const supabase = createAdminClient();

    const invoicesAll = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true });
    if (invoicesAll.error) {
      console.error("[truedeed] dispute metrics — invoice count failed", {
        error_code: (invoicesAll.error as { code?: string }).code,
      });
      return null;
    }
    const invoicesCount = invoicesAll.count ?? 0;

    const invoicesCharged = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("state", "charged_back");
    if (invoicesCharged.error) {
      console.error("[truedeed] dispute metrics — chargeback count failed", {
        error_code: (invoicesCharged.error as { code?: string }).code,
      });
      return null;
    }
    const chargebacks = invoicesCharged.count ?? 0;

    const disputes = await supabase
      .from("invoice_disputes")
      .select("id, raised_by, status");
    if (disputes.error || !Array.isArray(disputes.data)) {
      console.error("[truedeed] dispute metrics — dispute query failed", {
        error_code: (disputes.error as { code?: string } | null)?.code,
      });
      return null;
    }
    const rows = disputes.data as Array<{
      id: string;
      raised_by: string;
      status: string;
    }>;

    const rebuttalsDecided = await supabase
      .from("rebuttals")
      .select("id", { count: "exact", head: true })
      .not("decision", "is", null);
    // .not isn't always typed on the local supabase stub; fall back to
    // count 0 if the call's .not is undefined.
    const rebuttalsCount = rebuttalsDecided.error
      ? null
      : (rebuttalsDecided.count ?? 0);

    if (rows.length === 0 && invoicesCount === 0) {
      return { ...ZERO_METRICS, chargebacks };
    }

    let open = 0;
    let conceded = 0;
    let rejected = 0;
    const byAgent = new Map<string, number>();
    for (const row of rows) {
      if (row.status === "open") open += 1;
      else if (row.status === "conceded") conceded += 1;
      else if (row.status === "rejected") rejected += 1;
      byAgent.set(row.raised_by, (byAgent.get(row.raised_by) ?? 0) + 1);
    }

    const decidedDisputes = conceded + rejected;
    const concessionRate = decidedDisputes > 0 ? conceded / decidedDisputes : 0;

    const disputesPer100Invoices =
      invoicesCount > 0 ? (rows.length / invoicesCount) * 100 : 0;

    const decidedRebuttals = rebuttalsCount ?? 0;
    const totalDecided = decidedRebuttals + decidedDisputes;
    const pctResolvedAtWindow =
      totalDecided > 0 ? decidedRebuttals / totalDecided : 0;

    const repeatDisputers: RepeatDisputer[] = Array.from(byAgent.entries())
      .filter(([, count]) => count >= 2)
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count);

    return {
      disputesPer100Invoices,
      concessionRate,
      pctResolvedAtWindow,
      repeatDisputers,
      chargebacks,
      open,
      conceded,
      rejected,
    };
  } catch (error: unknown) {
    console.error("[truedeed] getDisputeMetrics failed", {
      error_type: errorType(error),
    });
    return null;
  }
}

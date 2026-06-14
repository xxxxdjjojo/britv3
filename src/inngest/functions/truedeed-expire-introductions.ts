/**
 * Inngest cron: Expire Truedeed introductions past their 6-month tail (daily at 6:30am UTC)
 *
 * Finds introductions past tail_expires_at whose latest status is still
 * non-terminal ('active', 'converted_sstc', 'converted_exchanged', or no
 * status row at all) and transitions each to 'expired' via the
 * transition_introduction RPC. Batch capped at 500 candidates per run.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";

const BATCH_CAP = 500;

const EXPIRABLE_STATUSES = new Set([
  "active",
  "converted_sstc",
  "converted_exchanged",
]);

export const truedeedExpireIntroductions = inngest.createFunction(
  {
    id: "truedeed-expire-introductions",
    name: "Expire introductions past tail_expires_at",
  },
  { cron: "30 6 * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const expirableIds = await step.run("find-expirable", async () => {
      const { data: candidates, error } = await supabase
        .from("introductions")
        .select("id")
        .lt("tail_expires_at", new Date().toISOString())
        .order("tail_expires_at", { ascending: true })
        .limit(BATCH_CAP);

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "expire-introductions",
          operation: "findCandidates",
        });
        throw new Error(`Failed to query expired introductions: ${error.message}`);
      }

      const candidateIds = (candidates ?? []).map((c: { id: string }) => c.id);
      if (candidateIds.length === 0) return [];

      // Latest status per introduction (history is append-only; newest first)
      const { data: history, error: historyError } = await supabase
        .from("introduction_status_history")
        .select("introduction_id, status, created_at, id")
        .in("introduction_id", candidateIds)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (historyError) {
        captureException(historyError, {
          module: "truedeed",
          feature: "expire-introductions",
          operation: "fetchStatusHistory",
        });
        throw new Error(`Failed to query status history: ${historyError.message}`);
      }

      const latestStatus = new Map<string, string>();
      for (const row of (history ?? []) as Array<{ introduction_id: string; status: string }>) {
        if (!latestStatus.has(row.introduction_id)) {
          latestStatus.set(row.introduction_id, row.status);
        }
      }

      return candidateIds.filter((id) => {
        const status = latestStatus.get(id);
        return status === undefined || EXPIRABLE_STATUSES.has(status);
      });
    });

    if (expirableIds.length === 0) {
      return { status: "nothing_to_expire", expired: 0 };
    }

    const expiredIds = await step.run("transition-expired", async () => {
      const succeeded: string[] = [];

      for (const id of expirableIds) {
        const { error } = await supabase.rpc("transition_introduction", {
          p_id: id,
          p_new_status: "expired",
          p_reason: "tail expired",
          p_actor: null,
        });

        if (error) {
          // 'invalid transition' = concurrently moved to a terminal state; skip
          captureException(error, {
            module: "truedeed",
            feature: "expire-introductions",
            operation: "transitionIntroduction",
            extra: { introductionId: id },
          });
          continue;
        }

        succeeded.push(id);
      }

      return succeeded;
    });

    if (expiredIds.length > 0) {
      await step.run("write-audit-log", async () => {
        await supabase.from("truedeed_audit_log").insert({
          actor: null,
          action: "introductions_expired",
          entity: "introductions",
          entity_id: null,
          detail: { count: expiredIds.length, introduction_ids: expiredIds },
        });
      });
    }

    return {
      status: "completed",
      candidates: expirableIds.length,
      expired: expiredIds.length,
    };
  },
);

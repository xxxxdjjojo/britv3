/**
 * Inngest cron: release invoice candidates whose clause-10.2 branch-query
 * hold has expired (daily at 7:15am UTC).
 *
 * invoice_candidates with status 'on_hold_branch_query' and
 * hold_expires_at < now() — the branch did not answer the buyer-identity
 * query within 10 business days — transition to 'pending_review' via the
 * review_invoice_candidate RPC (the only write path; the table's guard
 * trigger blocks plain UPDATEs). Per dispute playbook D3: silence does NOT
 * auto-bill — the candidate proceeds to human review with the silence noted
 * as a factor.
 *
 * p_reviewer is passed as null (system action — invoice_candidates.reviewed_by
 * is nullable and the RPC requires a reviewer note only for 'rejected').
 * Batch capped at 500 per run, mirroring truedeed-expire-introductions.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";

const BATCH_CAP = 500;

const RELEASE_NOTE =
  "Branch query window expired without a response (clause 10.2); released to review with the silence noted.";

export const truedeedReleaseHeldCandidates = inngest.createFunction(
  {
    id: "truedeed-release-held-candidates",
    name: "Release invoice candidates past branch-query hold",
  },
  { cron: "15 7 * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const heldCandidates = await step.run("find-expired-holds", async () => {
      const { data, error } = await supabase
        .from("invoice_candidates")
        .select("id, hold_expires_at")
        .eq("status", "on_hold_branch_query")
        .lt("hold_expires_at", new Date().toISOString())
        .order("hold_expires_at", { ascending: true })
        .limit(BATCH_CAP);

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "release-held-candidates",
          operation: "findExpiredHolds",
        });
        throw new Error(`Failed to query expired holds: ${error.message}`);
      }

      return (data ?? []) as Array<{ id: string; hold_expires_at: string }>;
    });

    if (heldCandidates.length === 0) {
      return { status: "nothing_to_release", released: 0 };
    }

    const released = await step.run("release-candidates", async () => {
      const succeeded: Array<{ id: string; hold_expires_at: string }> = [];

      for (const candidate of heldCandidates) {
        const { error } = await supabase.rpc("review_invoice_candidate", {
          p_id: candidate.id,
          p_reviewer: null,
          p_new_status: "pending_review",
          p_note: RELEASE_NOTE,
        });

        if (error) {
          // 'invalid transition' = concurrently reviewed/released; skip.
          captureException(error, {
            module: "truedeed",
            feature: "release-held-candidates",
            operation: "reviewInvoiceCandidate",
            extra: { invoiceCandidateId: candidate.id },
          });
          continue;
        }

        succeeded.push(candidate);
      }

      return succeeded;
    });

    if (released.length > 0) {
      await step.run("write-audit-log", async () => {
        await supabase.from("truedeed_audit_log").insert(
          released.map((candidate) => ({
            actor: null,
            action: "held_candidate_released",
            entity: "invoice_candidate",
            entity_id: candidate.id,
            detail: {
              silence_noted: true,
              hold_expires_at: candidate.hold_expires_at,
              note: RELEASE_NOTE,
            },
          })),
        );
      });
    }

    return {
      status: "completed",
      candidates: heldCandidates.length,
      released: released.length,
    };
  },
);

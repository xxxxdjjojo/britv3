/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed outcome service (Phase 2).
 *
 * `reportOutcome` lets the introduction's agent (or a team member on its
 * branch) report a deal outcome against an introduction. Conversion outcomes
 * (offer_accepted / exchanged / completed) transition the introduction via
 * the SECURITY DEFINER rpc `transition_introduction` BEFORE any invoice
 * candidate is created — an invalid transition (e.g. already completed)
 * aborts with 'invalid_state' and never produces a candidate. A 'completed'
 * outcome additionally creates an invoice_candidates row
 * { source: 'agent_report', status: 'pending_review' } for admin review.
 * 'fell_through' only appends an introduction_events 'note'; tenancy
 * outcomes record the outcome row alone.
 *
 * SECURITY NOTE: Applicant names/emails are never included in logs or audit
 * detail payloads. Error logs emit only error_type (the Error constructor
 * name) and entity ids, never PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import type {
  IntroductionStatus,
  OutcomeType,
  ReportOutcomeInput,
} from "@/types/truedeed";

/** Conversion outcomes and the introduction status they transition to. */
const CONVERSION_STATUS: Partial<Record<OutcomeType, IntroductionStatus>> = {
  offer_accepted: "converted_sstc",
  exchanged: "converted_exchanged",
  completed: "converted_completed",
};

export type ReportOutcomeError =
  | "not_found"
  | "not_authorised"
  | "missing_completion_fields"
  | "invalid_state"
  | "internal";

export type ReportOutcomeResult =
  | { ok: true; outcomeId: string; invoiceCandidateId?: string }
  | { ok: false; error: ReportOutcomeError };

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Reports a deal outcome for an introduction. Authorisation-checked and
 * completion-field-checked before any write; the status transition runs
 * before invoice-candidate creation. Never throws.
 */
export async function reportOutcome(
  input: ReportOutcomeInput,
): Promise<ReportOutcomeResult> {
  const { introductionId, reportedBy, outcome, completionDate, agreedPricePence } =
    input;

  try {
    const supabase = createAdminClient();

    const { data: introduction } = await supabase
      .from("introductions")
      .select("id, agent_id, branch_id, occurred_at")
      .eq("id", introductionId)
      .maybeSingle();
    if (!introduction) return { ok: false, error: "not_found" };

    // 1. Authorisation — the introduction's agent or a branch team member.
    if (reportedBy !== introduction.agent_id) {
      const { data: members } = await supabase
        .from("agent_team_members")
        .select("user_id")
        .eq("branch_id", introduction.branch_id)
        .eq("user_id", reportedBy);
      if (!Array.isArray(members) || members.length === 0) {
        return { ok: false, error: "not_authorised" };
      }
    }

    // 2. A 'completed' report must carry the fee-bearing facts.
    if (
      outcome === "completed" &&
      (!completionDate || agreedPricePence == null)
    ) {
      return { ok: false, error: "missing_completion_fields" };
    }

    // 3. Record the outcome (evidence row; date stored as 'YYYY-MM-DD').
    const { data: outcomeRow, error: outcomeError } = await supabase
      .from("reported_outcomes")
      .insert({
        introduction_id: introductionId,
        reported_by: reportedBy,
        outcome,
        completion_date: completionDate
          ? completionDate.toISOString().slice(0, 10)
          : null,
        agreed_price_pence: agreedPricePence ?? null,
      })
      .select("id")
      .single();
    if (outcomeError || !outcomeRow) return { ok: false, error: "internal" };
    const outcomeId = outcomeRow.id as string;

    // 4. Conversion outcomes transition the introduction — BEFORE any
    // invoice candidate exists, so a rejected transition creates nothing.
    const newStatus = CONVERSION_STATUS[outcome];
    if (newStatus) {
      const { error: transitionError } = await supabase.rpc(
        "transition_introduction",
        {
          p_id: introductionId,
          p_new_status: newStatus,
          p_reason: `outcome_reported:${outcome}`,
          p_actor: reportedBy,
        },
      );
      if (transitionError) {
        const message =
          (transitionError as { message?: string }).message ?? "";
        return {
          ok: false,
          error: message.includes("invalid transition")
            ? "invalid_state"
            : "internal",
        };
      }
    } else if (outcome === "fell_through") {
      // No status change — the introduction tail keeps running; the fall-
      // through is recorded on the event trail.
      await supabase.from("introduction_events").insert({
        introduction_id: introductionId,
        event_type: "note",
        payload: { outcome: "fell_through" },
      });
    }

    // 5. A completed sale becomes an invoice candidate for admin review.
    let invoiceCandidateId: string | undefined;
    if (outcome === "completed") {
      const { data: candidate, error: candidateError } = await supabase
        .from("invoice_candidates")
        .insert({
          source: "agent_report",
          introduction_id: introductionId,
          reported_outcome_id: outcomeId,
          status: "pending_review",
        })
        .select("id")
        .single();
      if (candidateError || !candidate) return { ok: false, error: "internal" };
      invoiceCandidateId = candidate.id as string;
    }

    await supabase.from("truedeed_audit_log").insert({
      actor: reportedBy,
      action: "outcome_reported",
      entity: "reported_outcomes",
      entity_id: outcomeId,
      detail: { introduction_id: introductionId, outcome },
    });

    await inngest.send({
      name: "truedeed/outcome.reported",
      data: { outcomeId, introductionId, outcome },
    });

    return invoiceCandidateId
      ? { ok: true, outcomeId, invoiceCandidateId }
      : { ok: true, outcomeId };
  } catch (error: unknown) {
    console.error("[truedeed] reportOutcome failed", {
      error_type: errorType(error),
      introduction_id: introductionId,
    });
    return { ok: false, error: "internal" };
  }
}

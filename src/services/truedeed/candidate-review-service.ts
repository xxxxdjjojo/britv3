/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed invoice-candidate review service (Phase 2).
 *
 * `listPendingCandidates` builds the admin review queue: every
 * invoice_candidates row awaiting a decision ('pending_review' or
 * 'on_hold_branch_query'), joined to its introduction (applicant snapshot,
 * timeline facts, listing address via listings → properties, event-trail
 * count) and reported outcome — spec §5: one screen = introduction facts +
 * event trail + outcome/match.
 *
 * `decideCandidate` is admin-only moderation: rejections require a note,
 * then the SECURITY DEFINER rpc `review_invoice_candidate`; an approval
 * additionally emits 'truedeed/invoice-candidate.approved' so invoicing
 * can pick the candidate up.
 *
 * SECURITY NOTE: Applicant names are returned to the admin surface only,
 * never logged. Error logs emit only error_type (the Error constructor
 * name) and entity ids, never PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import type { CandidateReviewItem, OutcomeType } from "@/types/truedeed";

const PENDING_STATUSES = ["pending_review", "on_hold_branch_query"] as const;

const CANDIDATE_SELECT = `
  id, source, status, amount_pence, vat_pence, hold_expires_at,
  introduction:introductions (
    id, applicant_name, occurred_at, notified_at, rebuttal_deadline,
    listing:listings ( property:properties ( address_line1, city, postcode ) ),
    introduction_events ( count )
  ),
  reported_outcome:reported_outcomes (
    outcome, completion_date, agreed_price_pence
  )
`;

/** Raw joined row as returned by the invoice_candidates select. */
type RawCandidateRow = {
  id: string;
  source: CandidateReviewItem["source"];
  status: CandidateReviewItem["status"];
  amount_pence: number | null;
  vat_pence: number | null;
  hold_expires_at: string | null;
  introduction: {
    applicant_name: string | null;
    occurred_at: string;
    notified_at: string | null;
    rebuttal_deadline: string | null;
    listing: {
      property: {
        address_line1: string | null;
        city: string | null;
        postcode: string | null;
      } | null;
    } | null;
    introduction_events: { count: number }[] | null;
  } | null;
  reported_outcome: {
    outcome: OutcomeType;
    completion_date: string | null;
    agreed_price_pence: number | null;
  } | null;
};

type DecideCandidateInput = {
  candidateId: string;
  reviewerId: string;
  decision: "approved" | "rejected";
  note?: string;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

function toReviewItem(row: RawCandidateRow): CandidateReviewItem {
  const intro = row.introduction;
  const property = intro?.listing?.property;
  const listingAddress = [
    property?.address_line1,
    property?.city,
    property?.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    candidateId: row.id,
    source: row.source,
    status: row.status,
    amountPence: row.amount_pence,
    vatPence: row.vat_pence,
    holdExpiresAt: row.hold_expires_at,
    introduction: {
      applicantName: intro?.applicant_name ?? "Applicant",
      occurredAt: intro?.occurred_at ?? "",
      notifiedAt: intro?.notified_at ?? null,
      rebuttalDeadline: intro?.rebuttal_deadline ?? null,
      listingAddress,
      eventsCount: intro?.introduction_events?.[0]?.count ?? 0,
    },
    outcome: row.reported_outcome
      ? {
          outcome: row.reported_outcome.outcome,
          completionDate: row.reported_outcome.completion_date,
          agreedPricePence: row.reported_outcome.agreed_price_pence,
        }
      : null,
  };
}

/**
 * Lists invoice candidates awaiting review, mapped to the review-screen
 * shape. Returns null on any failure. Never throws.
 */
export async function listPendingCandidates(): Promise<
  CandidateReviewItem[] | null
> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("invoice_candidates")
      .select(CANDIDATE_SELECT)
      .in("status", [...PENDING_STATUSES]);
    if (error || !Array.isArray(data)) {
      // Surface query failures (e.g. embed/column errors) — a silent null
      // here renders an empty queue and hides real defects. No PII: code
      // and message are PostgREST schema-level strings.
      console.error("[truedeed] listPendingCandidates query failed", {
        error_code: error?.code,
        error_message: error?.message,
      });
      return null;
    }

    // The generated supabase types infer the embeds as arrays; the actual
    // runtime shape for these to-one FK joins is the object form below.
    return (data as unknown as RawCandidateRow[]).map(toReviewItem);
  } catch (error: unknown) {
    console.error("[truedeed] listPendingCandidates failed", {
      error_type: errorType(error),
    });
    return null;
  }
}

/**
 * Admin decision on an invoice candidate. Rejections require a non-empty
 * note (checked before any rpc); approvals emit the invoicing event.
 * Returns true only when every step succeeded. Never throws.
 */
export async function decideCandidate(
  input: DecideCandidateInput,
): Promise<boolean> {
  const { candidateId, reviewerId, decision, note } = input;

  if (decision === "rejected" && (!note || note.trim().length === 0)) {
    return false;
  }

  try {
    const supabase = createAdminClient();

    // Param names must match the SQL function signature exactly —
    // review_invoice_candidate(p_id, p_reviewer, p_new_status, p_note);
    // PostgREST resolves rpc overloads by named arguments.
    const { error: reviewError } = await supabase.rpc(
      "review_invoice_candidate",
      {
        p_id: candidateId,
        p_reviewer: reviewerId,
        p_new_status: decision,
        p_note: note ?? null,
      },
    );
    if (reviewError) return false;

    await supabase.from("truedeed_audit_log").insert({
      actor: reviewerId,
      action: `invoice_candidate_${decision}`,
      entity: "invoice_candidates",
      entity_id: candidateId,
      detail: { decision },
    });

    if (decision === "approved") {
      await inngest.send({
        name: "truedeed/invoice-candidate.approved",
        data: { candidateId },
      });
    }

    return true;
  } catch (error: unknown) {
    console.error("[truedeed] decideCandidate failed", {
      error_type: errorType(error),
      candidate_id: candidateId,
    });
    return false;
  }
}

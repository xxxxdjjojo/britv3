/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed dispute service (Phase 5, dispute playbook D1–D5 + billing spec
 * clause 9.5 — Properly Raised Disputes).
 *
 * `raiseDispute` lets the invoice's agent dispute an invoice. The clause-9.5
 * window is "within 10 business days of issued_at" via addBusinessDays from
 * @/lib/business-days; INSIDE the window the service ALSO calls rpc
 * 'transition_invoice' with 'dispute_raised' so the dunning state machine
 * freezes for THAT invoice only (other invoices keep their own clocks).
 * OUTSIDE the window the row is recorded with properly_raised:false and the
 * dunning clock is NOT paused — late disputes are heard but they don't pause
 * the lever the contract relies on.
 *
 * Evidence files (optional) go to the existing private 'rebuttal-evidence'
 * storage bucket (same bucket used by Phase 1 rebuttals — one place to read
 * signed URLs from) with the SAME path-traversal-safe sanitiser as
 * rebuttal-service. Paths are namespaced by invoice id.
 *
 * `resolveDispute` is admin-only: a non-empty reason AND a playbook category
 * are both mandatory BEFORE any rpc fires, then the SECURITY DEFINER rpc
 * `decide_invoice_dispute` (which itself drives transition_invoice with
 * 'dispute_resolved-upheld' / '-rejected'). Audit + inngest fire only on
 * rpc success.
 *
 * SECURITY NOTE: Logs carry only error_type (the Error constructor name)
 * and entity ids — never names, emails, addresses or other PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  getEnglandWalesBankHolidays,
  addBusinessDays,
} from "@/lib/business-days";

const EVIDENCE_BUCKET = "rebuttal-evidence";
const CLAUSE_9_5_WINDOW_BUSINESS_DAYS = 10;

export type DisputeCategory =
  | "D1_source"
  | "D2_fell_through"
  | "D3_different_applicant"
  | "D4_no_tail_agreement"
  | "D5_fee_level";

export type DisputeDecision = "conceded" | "rejected";

export type RaiseDisputeError =
  | "not_found"
  | "not_authorised"
  | "grounds_required"
  | "already_disputed"
  | "upload_failed"
  | "insert_failed";

export type RaiseDisputeResult =
  | { ok: true; disputeId: string; properlyRaised: boolean }
  | { ok: false; error: RaiseDisputeError };

type RaiseDisputeInput = {
  invoiceId: string;
  raisedBy: string;
  grounds: string;
  files?: File[];
};

type ResolveDisputeInput = {
  disputeId: string;
  adminId: string;
  decision: DisputeDecision;
  category: DisputeCategory | string;
  reason: string;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Strips directory components and reduces a client filename to a safe key.
 * Mirrors the rebuttal-service sanitiser exactly so both ledger evidence
 * folders use identical rules.
 */
function safeName(name: string): string {
  const stripped = (name.split(/[\\/]/).pop() ?? "evidence")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^\.+/, "_");
  return stripped || "evidence";
}

/**
 * Raises a dispute on an invoice. Window-checked + auth-checked before any
 * upload or insert; storage uploads happen before the database insert so a
 * failed upload aborts the dispute cleanly. Returns
 * { ok: true; disputeId; properlyRaised } on success; never throws.
 */
export async function raiseDispute(
  input: RaiseDisputeInput,
): Promise<RaiseDisputeResult> {
  const { invoiceId, raisedBy, grounds, files = [] } = input;

  if (grounds.trim().length === 0) {
    return { ok: false, error: "grounds_required" };
  }

  try {
    const supabase = createAdminClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, org_agent_id, issued_at")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!invoice) return { ok: false, error: "not_found" };

    const invoiceRow = invoice as {
      id: string;
      org_agent_id: string;
      issued_at: string;
    };
    if (invoiceRow.org_agent_id !== raisedBy) {
      return { ok: false, error: "not_authorised" };
    }

    // Clause 9.5 window — 10 business days from issued_at.
    const holidays = await getEnglandWalesBankHolidays();
    const windowEnd = addBusinessDays(
      new Date(invoiceRow.issued_at),
      CLAUSE_9_5_WINDOW_BUSINESS_DAYS,
      holidays,
    );
    const properlyRaised = Date.now() <= windowEnd.getTime();

    // Upload evidence (optional). Paths namespaced by invoice id; client
    // filenames are reduced to a safe key that cannot traverse out.
    const storage = supabase.storage.from(EVIDENCE_BUCKET);
    const storagePaths: string[] = [];
    for (const [index, file] of files.entries()) {
      const path = `${invoiceId}/${Date.now()}-${index}-${safeName(file.name)}`;
      const { error: uploadError } = await storage.upload(path, file);
      if (uploadError) return { ok: false, error: "upload_failed" };
      storagePaths.push(path);
    }

    const { data: dispute, error: insertError } = await supabase
      .from("invoice_disputes")
      .insert({
        invoice_id: invoiceId,
        raised_by: raisedBy,
        grounds,
        evidence_storage_paths: storagePaths,
        properly_raised: properlyRaised,
      })
      .select("id")
      .single();
    if (insertError || !dispute) {
      const code = (insertError as { code?: string } | null)?.code;
      if (code === "23505") return { ok: false, error: "already_disputed" };
      return { ok: false, error: "insert_failed" };
    }
    const disputeId = (dispute as { id: string }).id;

    // Inside the window: freeze the dunning clock for THIS invoice only.
    if (properlyRaised) {
      const { error: transitionError } = await supabase.rpc(
        "transition_invoice",
        {
          p_id: invoiceId,
          p_event: "dispute_raised",
          p_actor: raisedBy,
        },
      );
      if (transitionError) {
        // The dispute row is recorded; the freeze didn't take. Audit-log
        // this so ops sees it — never throw.
        console.error("[truedeed] dispute_raised transition failed", {
          error_type: "TransitionError",
          invoice_id: invoiceId,
        });
      }
    }

    await supabase.from("truedeed_audit_log").insert({
      actor: raisedBy,
      action: "dispute_raised",
      entity: "invoice_disputes",
      entity_id: disputeId,
      detail: {
        invoice_id: invoiceId,
        properly_raised: properlyRaised,
        evidence_count: storagePaths.length,
      },
    });

    try {
      await inngest.send({
        name: "truedeed/dispute.raised",
        data: { disputeId, invoiceId, properlyRaised },
      });
    } catch (emitError: unknown) {
      console.error("[truedeed] dispute.raised emit failed", {
        error_type: errorType(emitError),
        dispute_id: disputeId,
      });
    }

    return { ok: true, disputeId, properlyRaised };
  } catch (error: unknown) {
    console.error("[truedeed] raiseDispute failed", {
      error_type: errorType(error),
      invoice_id: invoiceId,
    });
    return { ok: false, error: "insert_failed" };
  }
}

/**
 * Admin decision on an open dispute. A non-empty reason AND a non-empty
 * playbook category are both mandatory BEFORE any rpc fires — the dispute
 * playbook requires concessions and rejections both to be written down with
 * a category. Returns true only when the rpc succeeds. Never throws.
 */
export async function resolveDispute(
  input: ResolveDisputeInput,
): Promise<boolean> {
  const { disputeId, adminId, decision, category, reason } = input;

  if (reason.trim().length === 0) return false;
  if (!category || String(category).trim().length === 0) return false;

  try {
    const supabase = createAdminClient();

    const { error: decideError } = await supabase.rpc(
      "decide_invoice_dispute",
      {
        p_id: disputeId,
        p_admin: adminId,
        p_decision: decision,
        p_category: category,
        p_reason: reason,
      },
    );
    if (decideError) return false;

    await supabase.from("truedeed_audit_log").insert({
      actor: adminId,
      action: "dispute_resolved",
      entity: "invoice_disputes",
      entity_id: disputeId,
      detail: { decision, category },
    });

    try {
      await inngest.send({
        name: "truedeed/dispute.resolved",
        data: { disputeId, decision },
      });
    } catch (emitError: unknown) {
      console.error("[truedeed] dispute.resolved emit failed", {
        error_type: errorType(emitError),
        dispute_id: disputeId,
      });
    }

    return true;
  } catch (error: unknown) {
    console.error("[truedeed] resolveDispute failed", {
      error_type: errorType(error),
      dispute_id: disputeId,
    });
    return false;
  }
}

/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed rebuttal service (Phase 1).
 *
 * `submitRebuttal` lets the introduction's agent (or a team member on its
 * branch) dispute an introduction inside the rebuttal window. Evidence files
 * go to the private 'rebuttal-evidence' storage bucket (paths are namespaced
 * by introduction id) and the claimed prior-contact date must PRE-DATE our
 * occurred_at — otherwise the evidence cannot prove a prior introduction.
 *
 * `decideRebuttal` is admin-only moderation: a mandatory reason, then the
 * SECURITY DEFINER rpc `decide_rebuttal`; upholding additionally transitions
 * the introduction to 'rebutted' via `transition_introduction`.
 *
 * SECURITY NOTE: Applicant names/emails are never included in logs. Error
 * logs emit only error_type (the Error constructor name) and entity ids,
 * never PII. Evidence is referenced by storage path only — signed URLs are
 * minted at read time by the admin surface.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { RebuttalDecision } from "@/types/truedeed";

const EVIDENCE_BUCKET = "rebuttal-evidence";

export type SubmitRebuttalError =
  | "window_expired"
  | "not_authorised"
  | "evidence_not_predating"
  | "no_evidence"
  | "not_found"
  | "upload_failed"
  | "insert_failed";

export type SubmitRebuttalResult =
  | { ok: true; rebuttalId: string }
  | { ok: false; error: SubmitRebuttalError };

type SubmitRebuttalInput = {
  introductionId: string;
  userId: string;
  evidenceDatedAt: Date;
  files: File[];
};

type DecideRebuttalInput = {
  rebuttalId: string;
  adminId: string;
  decision: RebuttalDecision;
  reason: string;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Submits a rebuttal for an introduction. Window-checked, authorisation-
 * checked, and evidence-date-checked before any upload happens.
 */
export async function submitRebuttal(
  input: SubmitRebuttalInput,
): Promise<SubmitRebuttalResult> {
  const { introductionId, userId, evidenceDatedAt, files } = input;

  try {
    const supabase = createAdminClient();

    const { data: introduction } = await supabase
      .from("introductions")
      .select("id, agent_id, branch_id, occurred_at, rebuttal_deadline, status")
      .eq("id", introductionId)
      .maybeSingle();
    if (!introduction) return { ok: false, error: "not_found" };

    // 1. Window — rebuttals are only accepted up to the deadline.
    const deadline = introduction.rebuttal_deadline
      ? new Date(introduction.rebuttal_deadline)
      : null;
    if (!deadline || Date.now() > deadline.getTime()) {
      return { ok: false, error: "window_expired" };
    }

    // 2. Authorisation — the introduction's agent or a branch team member.
    if (userId !== introduction.agent_id) {
      const { data: members } = await supabase
        .from("agent_team_members")
        .select("user_id")
        .eq("branch_id", introduction.branch_id)
        .eq("user_id", userId);
      if (!Array.isArray(members) || members.length === 0) {
        return { ok: false, error: "not_authorised" };
      }
    }

    // 3. Claimed prior contact must pre-date our occurred_at.
    if (evidenceDatedAt.getTime() >= new Date(introduction.occurred_at).getTime()) {
      return { ok: false, error: "evidence_not_predating" };
    }

    // 4. Evidence is mandatory.
    if (files.length === 0) {
      return { ok: false, error: "no_evidence" };
    }

    // 5. Upload evidence — paths namespaced by introduction id. The client
    // filename is untrusted: strip any directory components and reduce it to
    // a safe character set so it can never traverse out of the
    // introduction's evidence folder (storage keys are evidence references).
    const storage = supabase.storage.from(EVIDENCE_BUCKET);
    const storagePaths: string[] = [];
    for (const [index, file] of files.entries()) {
      const safeName =
        (file.name.split(/[\\/]/).pop() ?? "evidence")
          .replace(/[^A-Za-z0-9._-]/g, "_")
          .replace(/^\.+/, "_") || "evidence";
      const path = `${introductionId}/${Date.now()}-${index}-${safeName}`;
      const { error: uploadError } = await storage.upload(path, file);
      if (uploadError) return { ok: false, error: "upload_failed" };
      storagePaths.push(path);
    }

    const { data: rebuttal, error: insertError } = await supabase
      .from("rebuttals")
      .insert({
        introduction_id: introductionId,
        submitted_by: userId,
        evidence_dated_at: evidenceDatedAt.toISOString().slice(0, 10),
        evidence_storage_paths: storagePaths,
      })
      .select("id")
      .single();
    if (insertError || !rebuttal) return { ok: false, error: "insert_failed" };

    await supabase.from("truedeed_audit_log").insert({
      actor: userId,
      action: "rebuttal_submitted",
      entity: "rebuttals",
      entity_id: rebuttal.id,
      detail: { introduction_id: introductionId, evidence_count: storagePaths.length },
    });

    return { ok: true, rebuttalId: rebuttal.id as string };
  } catch (error: unknown) {
    console.error("[truedeed] submitRebuttal failed", {
      error_type: errorType(error),
      introduction_id: introductionId,
    });
    return { ok: false, error: "insert_failed" };
  }
}

/**
 * Admin decision on a pending rebuttal. A non-empty reason is mandatory.
 * Upholding additionally transitions the introduction to 'rebutted'.
 * Returns true only when every step succeeded.
 */
export async function decideRebuttal(
  input: DecideRebuttalInput,
): Promise<boolean> {
  const { rebuttalId, adminId, decision, reason } = input;

  if (reason.trim().length === 0) return false;

  try {
    const supabase = createAdminClient();

    const { error: decideError } = await supabase.rpc("decide_rebuttal", {
      p_rebuttal_id: rebuttalId,
      p_admin_id: adminId,
      p_decision: decision,
      p_reason: reason,
    });
    if (decideError) return false;

    if (decision === "upheld") {
      const { data: rebuttal } = await supabase
        .from("rebuttals")
        .select("id, introduction_id")
        .eq("id", rebuttalId)
        .maybeSingle();
      if (!rebuttal) return false;

      const { error: transitionError } = await supabase.rpc(
        "transition_introduction",
        {
          p_id: rebuttal.introduction_id,
          p_new_status: "rebutted",
          p_reason: reason,
          p_actor: adminId,
        },
      );
      if (transitionError) return false;
    }

    return true;
  } catch (error: unknown) {
    console.error("[truedeed] decideRebuttal failed", {
      error_type: errorType(error),
      rebuttal_id: rebuttalId,
    });
    return false;
  }
}

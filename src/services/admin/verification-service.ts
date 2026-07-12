/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProviderReferenceStatus } from "@/types/provider-dashboard";

export type VerificationQueueItem = {
  id: string;
  full_name: string | null;
  email: string | null;
  verification_status: string | null;
  provider_details: Record<string, unknown> | null;
  created_at: string | null;
};

export async function getVerificationQueue(
  supabase: SupabaseClient,
): Promise<VerificationQueueItem[]> {
  // profiles has no full_name/email/verification_status columns. The display
  // name is `display_name`; provider verification state is
  // `provider_verification_status`. Email lives on auth.users, not profiles.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, provider_verification_status, created_at",
    )
    .eq("provider_verification_status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin:verification-service] getVerificationQueue failed", { error: error.message });
    return [];
  }
  const rows = (data as Array<{
    id: string;
    display_name: string | null;
    provider_verification_status: string | null;
    created_at: string | null;
  }>) ?? [];
  return rows.map((row) => ({
    id: row.id,
    full_name: row.display_name,
    email: null,
    verification_status: row.provider_verification_status,
    provider_details: null,
    created_at: row.created_at,
  }));
}

export async function reviewVerification(
  supabase: SupabaseClient,
  userId: string,
  decision: "approved" | "rejected",
  notes?: string,
): Promise<{ success: boolean }> {
  // Real column is provider_verification_status (enum
  // unverified|pending_review|verified|suspended|rejected). "approved" maps to
  // the enum's "verified". profiles has no notes column, so review notes are not
  // persisted here.
  const update: Record<string, unknown> = {
    provider_verification_status: decision === "approved" ? "verified" : "rejected",
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (error) return { success: false };

  // Best-effort: notify the trader of the outcome. Never fail the review.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", userId)
      .maybeSingle();
    const email = (profile as { email?: string } | null)?.email;
    if (email) {
      const { sendVerificationOutcome } = await import("@/services/email/email-service");
      await sendVerificationOutcome({
        userId,
        email,
        firstName: (profile as { first_name?: string } | null)?.first_name,
        outcome: decision,
        notes,
      });
    }
  } catch {
    // best-effort notification
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Per-reference admin review (vouching)
// ---------------------------------------------------------------------------

/**
 * A provider_references row as an admin reviewer sees it. Admins are the
 * reviewers, so the full referee_email is returned here — any masking is a UI
 * concern, not a service concern.
 */
export type AdminReferenceView = {
  id: string;
  reference_type: "client" | "peer";
  referee_name: string;
  referee_email: string;
  relationship: string | null;
  status: ProviderReferenceStatus;
  reference_text: string | null;
  work_date: string | null;
  rating: number | null;
  requested_at: string | null;
  submitted_at: string | null;
  declined_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
};

/**
 * Returns every provider_references row for a provider (all statuses), newest
 * request first, with the fields an admin needs to review each one.
 * Returns [] on any query error.
 */
export async function getProviderReferencesForAdmin(
  supabase: SupabaseClient,
  providerId: string,
): Promise<AdminReferenceView[]> {
  const { data, error } = await supabase
    .from("provider_references")
    .select(
      "id, reference_type, referee_name, referee_email, relationship, status, reference_text, work_date, rating, requested_at, submitted_at, declined_reason, reviewed_at, reviewed_by, review_reason",
    )
    .eq("provider_id", providerId)
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("[admin:verification-service] getProviderReferencesForAdmin failed", { error: error.message });
    return [];
  }
  return (data as AdminReferenceView[]) ?? [];
}

type ReviewReferenceParams = {
  referenceId: string;
  decision: "verify" | "reject" | "flag";
  reason?: string;
  adminId: string;
};

type ReviewReferenceResult =
  | { success: true }
  | {
      success: false;
      error: string;
      code?: "not_found" | "invalid_state" | "reason_required";
    };

/** Statuses that are eligible for admin review. */
const REVIEWABLE_STATUSES = ["submitted", "flagged"] as const;

/**
 * Applies an admin decision to a single reference.
 *
 * Guards:
 *  - the row must exist (not_found)
 *  - current status must be 'submitted' or 'flagged' (invalid_state otherwise)
 *  - 'reject' and 'flag' require a non-empty reason (reason_required)
 *
 * Mapping: verify -> verified (+ verified_at); reject -> rejected; flag ->
 * flagged. Always stamps reviewed_at / reviewed_by, and review_reason when a
 * reason is supplied.
 *
 * This does the DB write + validation only. Audit logging is the API route's
 * job (T9) — do not call the audit logger here.
 */
export async function reviewReference(
  supabase: SupabaseClient,
  params: ReviewReferenceParams,
  now: Date = new Date(),
): Promise<ReviewReferenceResult> {
  const { referenceId, decision, reason, adminId } = params;

  const { data: row, error: fetchError } = await supabase
    .from("provider_references")
    .select("id, status")
    .eq("id", referenceId)
    .maybeSingle();

  if (fetchError) {
    console.error("[admin:verification-service] reviewReference fetch failed", { error: fetchError.message });
    return { success: false, error: "Failed to load reference" };
  }
  if (!row) return { success: false, error: "Reference not found", code: "not_found" };

  const current = (row as { status: string }).status;
  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(current)) {
    return {
      success: false,
      error: `Cannot review a reference in status '${current}'`,
      code: "invalid_state",
    };
  }

  const trimmedReason = reason?.trim();
  if ((decision === "reject" || decision === "flag") && !trimmedReason) {
    return {
      success: false,
      error: "A reason is required to reject or flag a reference",
      code: "reason_required",
    };
  }

  const nowIso = now.toISOString();
  const update: Record<string, unknown> = {
    reviewed_at: nowIso,
    reviewed_by: adminId,
  };
  if (trimmedReason) update.review_reason = trimmedReason;

  if (decision === "verify") {
    update.status = "verified";
    update.verified_at = nowIso;
  } else if (decision === "reject") {
    update.status = "rejected";
  } else {
    update.status = "flagged";
  }

  // The UPDATE is the serialization point: filtering on the status we validated
  // means a concurrent admin who already reviewed this row moves it out of
  // `current`, so this write matches 0 rows. This makes double-clicks safe
  // without a read-then-write race.
  const { data: updated, error: updateError } = await supabase
    .from("provider_references")
    .update(update)
    .eq("id", referenceId)
    .eq("status", current)
    .select("id");

  if (updateError) {
    console.error("[admin:verification-service] reviewReference update failed", { error: updateError.message });
    return { success: false, error: "Failed to save decision" };
  }

  if (!updated || (updated as unknown[]).length === 0) {
    return {
      success: false,
      code: "invalid_state",
      error: "This reference was already reviewed.",
    };
  }

  return { success: true };
}

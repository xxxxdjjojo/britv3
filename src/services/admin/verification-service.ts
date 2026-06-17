/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { SupabaseClient } from "@supabase/supabase-js";

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
  void notes;
  const update: Record<string, unknown> = {
    provider_verification_status: decision === "approved" ? "verified" : "rejected",
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  return { success: !error };
}

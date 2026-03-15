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
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, verification_status, provider_details, created_at",
    )
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as VerificationQueueItem[]) ?? [];
}

export async function reviewVerification(
  supabase: SupabaseClient,
  userId: string,
  decision: "approved" | "rejected",
  notes?: string,
): Promise<{ success: boolean }> {
  const update: Record<string, unknown> = {
    verification_status: decision,
  };
  if (notes !== undefined) {
    update.verification_notes = notes;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  return { success: !error };
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type GdprRequest = {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  export_url: string | null;
  export_expires_at: string | null;
  notes: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

export async function getGdprQueue(
  supabase: SupabaseClient,
): Promise<GdprRequest[]> {
  const { data, error } = await supabase
    .from("gdpr_requests")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data as GdprRequest[]) ?? [];
}

export async function fulfilGdprRequest(
  supabase: SupabaseClient,
  requestId: string,
  adminId: string,
): Promise<{ accepted: boolean; alreadyFulfilled: boolean }> {
  // Idempotency: check current status
  const { data: request } = await supabase
    .from("gdpr_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (request?.status !== "pending") {
    return { accepted: false, alreadyFulfilled: true };
  }

  // Mark in_progress — background Edge Function handles the rest
  const { error } = await supabase
    .from("gdpr_requests")
    .update({ status: "in_progress", fulfilled_by: adminId })
    .eq("id", requestId)
    .eq("status", "pending"); // optimistic lock

  return { accepted: !error, alreadyFulfilled: false };
}

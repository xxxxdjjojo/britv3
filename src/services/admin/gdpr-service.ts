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
  page = 0,
  limit = 50,
): Promise<{ requests: GdprRequest[]; total: number }> {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("gdpr_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: true })
    .range(from, to);
  if (error) {
    console.error("[admin:gdpr-service] getGdprQueue failed", { error: error.message });
    return { requests: [], total: 0 };
  }
  return { requests: (data as GdprRequest[]) ?? [], total: count ?? 0 };
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

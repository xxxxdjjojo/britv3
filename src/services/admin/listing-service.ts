import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminListing = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  owner_id: string | null;
};

export async function getListingQueue(
  supabase: SupabaseClient,
  statusFilter?: string,
  page = 0,
  limit = 50,
): Promise<{ listings: AdminListing[]; total: number }> {
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("properties")
    .select("id, title, status, created_at, owner_id", { count: "exact" })
    .order("created_at", { ascending: true })
    .range(from, to);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin:listing-service] getListingQueue failed", { error: error.message });
    return { listings: [], total: 0 };
  }
  return { listings: (data as AdminListing[]) ?? [], total: count ?? 0 };
}

export async function approveListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("properties")
    .update({ status: "active" })
    .eq("id", listingId);
  return { success: !error };
}

export async function rejectListing(
  supabase: SupabaseClient,
  listingId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("properties")
    .update({ status: "rejected" as const, ...(reason ? { rejection_reason: reason } : {}) })
    .eq("id", listingId);
  return { success: !error };
}

export async function flagListing(
  supabase: SupabaseClient,
  listingId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("properties")
    .update({ status: "flagged" as const, ...(reason ? { flag_reason: reason } : {}) })
    .eq("id", listingId);
  return { success: !error };
}

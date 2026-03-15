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
): Promise<AdminListing[]> {
  let query = supabase
    .from("properties")
    .select("id, title, status, created_at, owner_id")
    .order("created_at", { ascending: true });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data as AdminListing[]) ?? [];
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
  const update: Record<string, unknown> = { status: "rejected" };
  if (reason) update.rejection_reason = reason;
  const { error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", listingId);
  return { success: !error };
}

export async function flagListing(
  supabase: SupabaseClient,
  listingId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  const update: Record<string, unknown> = { status: "flagged" };
  if (reason) update.flag_reason = reason;
  const { error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", listingId);
  return { success: !error };
}

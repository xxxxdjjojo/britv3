import type { SupabaseClient } from "@supabase/supabase-js";
import type { SellerViewing, ViewingStatus } from "@/types/seller";

export async function getSellerViewings(
  supabase: SupabaseClient,
  filter?: "upcoming" | "past",
): Promise<SellerViewing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  let query = supabase
    .from("seller_viewings")
    .select("*, listing:listing_id (id, address_line_1, city, postcode, photos)")
    .eq("seller_id", user.id)
    .order("viewing_datetime", { ascending: true });

  if (filter === "upcoming") {
    query = query
      .gte("viewing_datetime", new Date().toISOString())
      .in("status", ["pending", "confirmed", "rescheduled"]);
  } else if (filter === "past") {
    query = query.lt("viewing_datetime", new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SellerViewing[];
}

export async function updateViewingStatus(
  supabase: SupabaseClient,
  viewingId: string,
  status: ViewingStatus,
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from("seller_viewings")
    .update({ status, notes: notes ?? null })
    .eq("id", viewingId);
  if (error) throw error;
}

export async function rescheduleViewing(
  supabase: SupabaseClient,
  viewingId: string,
  newDatetime: string,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("seller_viewings")
    .update({ viewing_datetime: newDatetime, status: "rescheduled", notes: reason ?? null })
    .eq("id", viewingId);
  if (error) throw error;
}

export async function addViewingFeedback(
  supabase: SupabaseClient,
  viewingId: string,
  feedback: string,
): Promise<void> {
  const { error } = await supabase
    .from("seller_viewings")
    .update({ feedback })
    .eq("id", viewingId);
  if (error) throw error;
}

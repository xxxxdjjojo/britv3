import type { SupabaseClient } from "@supabase/supabase-js";
import type { SellerOffer, OfferStatus } from "@/types/seller";

export async function getSellerOffers(
  supabase: SupabaseClient,
  listingId?: string,
): Promise<SellerOffer[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  let query = supabase
    .from("seller_offers")
    .select("*, listing:listing_id (id, address_line_1, city, postcode, asking_price, photos)")
    .eq("seller_id", user.id)
    .order("offered_at", { ascending: false });

  if (listingId) query = query.eq("listing_id", listingId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SellerOffer[];
}

export async function respondToOffer(
  supabase: SupabaseClient,
  offerId: string,
  response: Readonly<{
    status: OfferStatus;
    solicitor_name?: string;
    solicitor_email?: string;
    solicitor_phone?: string;
    counter_amount?: number; // pence
    counter_message?: string;
  }>,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data, error } = await supabase
    .from("seller_offers")
    .update({
      status: response.status,
      solicitor_name: response.solicitor_name ?? null,
      solicitor_email: response.solicitor_email ?? null,
      solicitor_phone: response.solicitor_phone ?? null,
      counter_amount: response.counter_amount ?? null,
      counter_message: response.counter_message ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("seller_id", user.id)
    .eq("status", "pending")
    .select()
    .single();

  if (error?.code === "PGRST116") {
    throw new Error("Offer not found, not owned by you, or already actioned");
  }
  if (error) throw error;
}

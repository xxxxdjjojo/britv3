/**
 * Viewings service.
 * Handles fetching and mutating viewing records via Supabase RPCs.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ViewingWithDetails = {
  id: string;
  listing_id: string;
  slot_id: string;
  notes: string | null;
  status: "confirmed" | "cancelled" | "rescheduled" | "completed";
  created_at: string;
  viewing_slots: {
    id: string;
    start_time: string;
    end_time: string;
    type: "in_person" | "virtual";
    listings: {
      id: string;
      address: string;
    } | null;
  } | null;
};

export type BookingResult =
  | { success: true; viewingId: string }
  | { success: false; error: string };

/**
 * Get all viewings for a user, ordered by slot start_time.
 */
export async function getViewings(
  supabase: SupabaseClient,
  userId: string,
): Promise<ViewingWithDetails[]> {
  const { data, error } = await supabase
    .from("viewings")
    .select(
      "id, listing_id, slot_id, notes, status, created_at, viewing_slots(id, start_time, end_time, type, listings(id, address))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get viewings: ${error.message}`);
  }

  return (data ?? []) as ViewingWithDetails[];
}

/**
 * Book a viewing slot via the book_viewing_slot RPC.
 * Returns {success:true, viewingId} or {success:false, error}.
 */
export async function bookViewingSlot(
  supabase: SupabaseClient,
  userId: string,
  slotId: string,
  listingId: string,
  type: "in_person" | "virtual",
): Promise<BookingResult> {
  const { data, error } = await supabase.rpc("book_viewing_slot", {
    p_slot_id: slotId,
    p_user_id: userId,
    p_listing_id: listingId,
    p_type: type,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; viewing_id?: string };

  if (!result.success) {
    return { success: false, error: result.error ?? "BOOKING_FAILED" };
  }

  return { success: true, viewingId: result.viewing_id ?? "" };
}

/**
 * Cancel a viewing via the cancel_viewing RPC.
 */
export async function cancelViewing(
  supabase: SupabaseClient,
  viewingId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("cancel_viewing", {
    p_viewing_id: viewingId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  return result;
}

/**
 * Reschedule a viewing to a new slot via the reschedule_viewing RPC.
 */
export async function rescheduleViewing(
  supabase: SupabaseClient,
  viewingId: string,
  newSlotId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("reschedule_viewing", {
    p_viewing_id: viewingId,
    p_new_slot_id: newSlotId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  return result;
}

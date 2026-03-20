/**
 * Viewings service — buyer-facing viewing operations.
 * All mutations go through SECURITY DEFINER RPCs to ensure atomicity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceError } from "@/types/service-error";

export type { ServiceError };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewingStatus = "confirmed" | "cancelled" | "rescheduled" | "completed";

export type Viewing = Readonly<{
  id: string;
  property_address: string;
  scheduled_at: string;
  status: ViewingStatus;
  viewing_slot_id: string;
  listing_id: string;
  type: "in_person" | "virtual";
  notes: string | null;
  created_at: string;
}>;

export type ViewingSlot = Readonly<{
  id: string;
  listing_id: string;
  start_time: string;
  end_time: string;
  type: "in_person" | "virtual";
  status: "available" | "booked" | "cancelled";
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isServiceError(val: unknown): val is ServiceError {
  return typeof val === "object" && val !== null && "error" in val;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Get all viewings for a buyer. Fetches viewings + viewing_slots, then resolves
 * property addresses via a separate listings query.
 *
 * Two-step approach because viewing_slots.listing_id has no FK constraint to
 * listings in the migration (no Supabase foreign-key expand available).
 */
export async function getViewings(
  supabase: SupabaseClient,
  userId: string,
): Promise<Viewing[] | ServiceError> {
  try {
    // Step 1: Fetch viewings with slot data
    const { data: viewingsData, error: viewingsError } = await supabase
      .from("viewings")
      .select(
        "id, status, type, notes, created_at, slot_id, listing_id, viewing_slots!inner(start_time, end_time)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (viewingsError) {
      console.error("[viewings-service] getViewings failed", { error: viewingsError });
      return { error: viewingsError.message };
    }

    if (!viewingsData || viewingsData.length === 0) {
      return [];
    }

    type RawRow = {
      id: string;
      status: string;
      type: string;
      notes: string | null;
      created_at: string;
      slot_id: string;
      listing_id: string;
      viewing_slots: { start_time: string; end_time: string };
    };

    const rows = viewingsData as unknown as RawRow[];

    // Step 2: Resolve listing addresses
    const listingIds = [...new Set(rows.map((r) => r.listing_id))];
    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, address")
      .in("id", listingIds);

    const addressMap = new Map<string, string>(
      (listingsData as Array<{ id: string; address: string }> ?? []).map((l) => [l.id, l.address]),
    );

    return rows.map((row) => ({
      id: row.id,
      property_address: addressMap.get(row.listing_id) ?? "Unknown address",
      scheduled_at: row.viewing_slots.start_time,
      status: row.status as ViewingStatus,
      viewing_slot_id: row.slot_id,
      listing_id: row.listing_id,
      type: row.type as "in_person" | "virtual",
      notes: row.notes,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.error("[viewings-service] getViewings threw", { err });
    return { error: "Failed to fetch viewings" };
  }
}

/**
 * Get available viewing slots for a listing.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ViewingSlot[] | ServiceError> {
  try {
    const { data, error } = await supabase
      .from("viewing_slots")
      .select("id, listing_id, start_time, end_time, type, status")
      .eq("listing_id", listingId)
      .eq("status", "available")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("[viewings-service] getAvailableSlots failed", { error });
      return { error: error.message };
    }

    return (data ?? []) as ViewingSlot[];
  } catch (err) {
    console.error("[viewings-service] getAvailableSlots threw", { err });
    return { error: "Failed to fetch available slots" };
  }
}

// ---------------------------------------------------------------------------
// Mutations (via SECURITY DEFINER RPCs)
// ---------------------------------------------------------------------------

type RpcResult = { success: boolean; error?: string; viewing_id?: string };

export type BookViewingResult = Readonly<{ viewingId: string }> | ServiceError;

/**
 * Book a viewing slot atomically. Detects race-condition slot conflicts.
 */
export async function bookViewing(
  supabase: SupabaseClient,
  userId: string,
  viewingSlotId: string,
  listingId: string,
  type: "in_person" | "virtual",
): Promise<BookViewingResult> {
  try {
    const { data, error } = await supabase.rpc("book_viewing_slot", {
      p_slot_id: viewingSlotId,
      p_user_id: userId,
      p_listing_id: listingId,
      p_type: type,
    });

    if (error) {
      console.error("[viewings-service] bookViewing RPC error", { error });
      return { error: error.message };
    }

    const result = data as RpcResult;

    if (!result.success) {
      const code = result.error ?? "UNKNOWN";
      if (code === "SLOT_UNAVAILABLE") {
        return { error: "SLOT_UNAVAILABLE" };
      }
      if (code === "UNAUTHORIZED") {
        return { error: "UNAUTHORIZED" };
      }
      return { error: `Booking failed: ${code}` };
    }

    return { viewingId: result.viewing_id! };
  } catch (err) {
    console.error("[viewings-service] bookViewing threw", { err });
    return { error: "Failed to book viewing" };
  }
}

/**
 * Cancel a viewing and free the slot atomically.
 * Ownership is enforced by the RPC's SECURITY DEFINER context + RLS — the
 * caller does not need to pass userId.
 */
export async function cancelViewing(
  supabase: SupabaseClient,
  viewingId: string,
): Promise<null | ServiceError> {
  try {
    const { data, error } = await supabase.rpc("cancel_viewing", {
      p_viewing_id: viewingId,
    });

    if (error) {
      console.error("[viewings-service] cancelViewing RPC error", { error });
      return { error: error.message };
    }

    const result = data as RpcResult;
    if (!result.success) {
      return { error: result.error ?? "Cancel failed" };
    }

    return null;
  } catch (err) {
    console.error("[viewings-service] cancelViewing threw", { err });
    return { error: "Failed to cancel viewing" };
  }
}

/**
 * Reschedule a viewing to a new slot atomically.
 * Ownership is enforced by the RPC's SECURITY DEFINER context + RLS — the
 * caller does not need to pass userId.
 */
export async function rescheduleViewing(
  supabase: SupabaseClient,
  viewingId: string,
  newSlotId: string,
): Promise<null | ServiceError> {
  try {
    const { data, error } = await supabase.rpc("reschedule_viewing", {
      p_viewing_id: viewingId,
      p_new_slot_id: newSlotId,
    });

    if (error) {
      console.error("[viewings-service] rescheduleViewing RPC error", { error });
      return { error: error.message };
    }

    const result = data as RpcResult;
    if (!result.success) {
      const code = result.error ?? "UNKNOWN";
      if (code === "SLOT_UNAVAILABLE") {
        return { error: "SLOT_UNAVAILABLE" };
      }
      return { error: `Reschedule failed: ${code}` };
    }

    return null;
  } catch (err) {
    console.error("[viewings-service] rescheduleViewing threw", { err });
    return { error: "Failed to reschedule viewing" };
  }
}

export { isServiceError };

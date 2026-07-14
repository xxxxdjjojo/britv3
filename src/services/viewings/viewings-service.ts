/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Viewings service — buyer-facing viewing operations.
 * All mutations go through SECURITY DEFINER RPCs to ensure atomicity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceError } from "@/types/service-error";
import { isUuid } from "@/lib/validation/uuid";

export type { ServiceError };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rescheduled"
  | "completed"
  | "declined";

export type Viewing = Readonly<{
  id: string;
  property_address: string;
  scheduled_at: string;
  status: ViewingStatus;
  viewing_slot_id: string | null;
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

/**
 * Resolve human-readable addresses for a set of listing ids. The address lives
 * on `properties` (via `listings.property_id`), not on `listings` itself.
 * Returns a Map keyed by listing id.
 */
export async function resolveListingAddresses(
  supabase: SupabaseClient,
  listingIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = [...new Set(listingIds)].filter(Boolean);
  if (ids.length === 0) return map;

  const { data: listings } = await supabase
    .from("listings")
    .select("id, property_id")
    .in("id", ids);

  const rows = (listings as Array<{ id: string; property_id: string }> | null) ?? [];
  const propertyToListing = new Map<string, string>();
  for (const l of rows) {
    if (l.property_id) propertyToListing.set(l.property_id, l.id);
  }
  if (propertyToListing.size === 0) return map;

  const { data: properties } = await supabase
    .from("properties")
    .select("id, address_line1, city, postcode")
    .in("id", [...propertyToListing.keys()]);

  for (const p of (properties as Array<{
    id: string;
    address_line1: string | null;
    city: string | null;
    postcode: string | null;
  }> | null) ?? []) {
    const listingId = propertyToListing.get(p.id);
    if (!listingId) continue;
    const parts = [p.address_line1, p.city, p.postcode].filter(Boolean);
    map.set(listingId, parts.length > 0 ? parts.join(", ") : "Unknown address");
  }
  return map;
}

/**
 * Return the id of the caller's open (pending/confirmed/rescheduled) viewing for
 * a listing, or null. Guards against non-UUID (mock/demo) listing ids so it
 * never issues a doomed uuid-cast query.
 */
export async function getExistingViewingId(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<string | null> {
  if (!isUuid(listingId)) return null;

  const { data } = await supabase
    .from("viewings")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .in("status", ["pending", "confirmed", "rescheduled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
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
    // Step 1: Fetch viewings with slot data. OUTER embed on viewing_slots so
    // slot-less "requested" (pending) viewings are not silently dropped.
    const { data: viewingsData, error: viewingsError } = await supabase
      .from("viewings")
      .select(
        "id, status, type, notes, created_at, preferred_time, slot_id, listing_id, viewing_slots(start_time, end_time)",
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
      preferred_time: string | null;
      slot_id: string | null;
      listing_id: string;
      viewing_slots: { start_time: string; end_time: string } | null;
    };

    const rows = viewingsData as unknown as RawRow[];

    // Step 2: Resolve listing addresses (address lives on properties).
    const addressMap = await resolveListingAddresses(
      supabase,
      rows.map((r) => r.listing_id),
    );

    return rows.map((row) => ({
      id: row.id,
      property_address: addressMap.get(row.listing_id) ?? "Unknown address",
      scheduled_at: row.viewing_slots?.start_time ?? row.preferred_time ?? row.created_at,
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

export type PendingViewingRequest = Readonly<{
  id: string;
  listing_id: string;
  property_address: string;
  requester_name: string;
  preferred_time: string | null;
  notes: string | null;
  created_at: string;
}>;

/**
 * Get pending (slot-less) viewing requests on the host's listings, newest first.
 * Scoped to listings owned by the host OR listings where the host is an active
 * represented agent (parity with agent viewing slot scoping).
 */
export async function getPendingViewingRequests(
  supabase: SupabaseClient,
  hostId: string,
): Promise<PendingViewingRequest[]> {
  const [ownedResult, repResult] = await Promise.all([
    supabase.from("listings").select("id").eq("user_id", hostId),
    supabase
      .from("listing_agents")
      .select("listing_id")
      .eq("agent_id", hostId)
      .eq("status", "active"),
  ]);

  const ownedIds = ((ownedResult.data as Array<{ id: string }> | null) ?? []).map(
    (l) => l.id,
  );
  const repIds = ((repResult.data as Array<{ listing_id: string }> | null) ?? []).map(
    (r) => r.listing_id,
  );
  const listingIds = [...new Set([...ownedIds, ...repIds])];
  if (listingIds.length === 0) return [];

  const { data: rows } = await supabase
    .from("viewings")
    .select("id, listing_id, preferred_time, notes, created_at, user_id")
    .in("listing_id", listingIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requests = (rows as Array<{
    id: string;
    listing_id: string;
    preferred_time: string | null;
    notes: string | null;
    created_at: string;
    user_id: string;
  }> | null) ?? [];
  if (requests.length === 0) return [];

  const addressMap = await resolveListingAddresses(
    supabase,
    requests.map((r) => r.listing_id),
  );

  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  const nameMap = new Map<string, string>(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) ?? []).map((p) => [
      p.id,
      p.display_name ?? "A buyer",
    ]),
  );

  return requests.map((r) => ({
    id: r.id,
    listing_id: r.listing_id,
    property_address: addressMap.get(r.listing_id) ?? "Unknown address",
    requester_name: nameMap.get(r.user_id) ?? "A buyer",
    preferred_time: r.preferred_time,
    notes: r.notes,
    created_at: r.created_at,
  }));
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

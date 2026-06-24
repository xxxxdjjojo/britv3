/**
 * Saved properties (shortlist) service.
 * Handles save/unsave operations with favorite_count tracking.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavedProperty, Listing, Property } from "@/types/property";

/**
 * A saved property record with joined listing and property data.
 *
 * `listing` / `property` are nullable: Row-Level Security hides a listing from a
 * non-owner once it leaves `active` (under offer, sold, withdrawn) or is deleted,
 * so the embedded relation can legitimately come back null. Consumers must handle
 * the "no longer available" case rather than assuming a listing is always present.
 */
export type SavedPropertyWithDetails = {
  id: string;
  user_id: string;
  listing_id: string;
  notes: string | null;
  created_at: string;
  listing: Listing | null;
  property: Property | null;
};

/**
 * Save a property to the user's shortlist.
 * Handles duplicate saves gracefully (unique constraint violation returns without error).
 * Increments the listing's favorite_count.
 */
export async function saveProperty(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  notes?: string,
): Promise<SavedProperty | null> {
  const { data, error } = await supabase
    .from("saved_properties")
    .insert({
      user_id: userId,
      listing_id: listingId,
      notes: notes ?? null,
    })
    .select()
    .single();

  // Handle duplicate key gracefully (code 23505 = unique_violation)
  if (error) {
    if (error.code === "23505") {
      return null;
    }
    throw new Error(`Failed to save property: ${error.message}`);
  }

  // Increment favorite_count on the listing (fire-and-forget)
  supabase
    .rpc("increment_favorite_count", {
      p_listing_id: listingId,
      p_delta: 1,
    })
    .then(() => undefined, () => undefined);

  return data as SavedProperty;
}

/**
 * Remove a property from the user's shortlist.
 * Decrements the listing's favorite_count.
 */
export async function unsaveProperty(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<void> {
  await supabase
    .from("saved_properties")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  // Decrement favorite_count on the listing (fire-and-forget)
  supabase
    .rpc("increment_favorite_count", {
      p_listing_id: listingId,
      p_delta: -1,
    })
    .then(() => undefined, () => undefined);
}

/**
 * Get all saved properties for a user, with full listing and property details.
 */
export async function getSavedProperties(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedPropertyWithDetails[]> {
  const { data, error } = await supabase
    .from("saved_properties")
    .select("*, listings(*, properties(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get saved properties: ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const listing = (row.listings as Record<string, unknown> | null) ?? null;
    const property =
      (listing?.properties as Record<string, unknown> | null) ?? null;

    return {
      id: row.id as string,
      user_id: row.user_id as string,
      listing_id: row.listing_id as string,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      listing: listing as unknown as Listing | null,
      property: property as unknown as Property | null,
    };
  });
}

/**
 * Check if a specific property is saved by a user.
 */
export async function isPropertySaved(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  return data != null;
}

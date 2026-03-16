/**
 * Offers service.
 * Handles fetching and mutating offer records via Supabase.
 *
 * @see src/lib/currency.ts — offers.amount is stored in INTEGER PENCE.
 * Always call penceToGBP() when reading and GBPToPence() when writing.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { GBPToPence } from "@/lib/currency";

export type OfferStatus =
  | "submitted"
  | "solicitors_instructed"
  | "searches"
  | "survey"
  | "mortgage_approved"
  | "exchange"
  | "completion"
  | "withdrawn";

export type Offer = {
  id: string;
  listing_id: string;
  agent_id: string;
  /** Amount in PENCE. Use penceToGBP() to display. @see src/lib/currency.ts */
  amount: number;
  conditions: string | null;
  aip_document_path: string | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  listings: { id: string; address: string; price: number } | null;
};

export type OfferStatusHistory = {
  id: string;
  offer_id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  created_at: string;
};

export type SubmitOfferResult =
  | { success: true; offer: Offer }
  | { error: "DUPLICATE_OFFER" | "INVALID_LISTING" | string };

/**
 * Get all offers submitted by a user, with listing details joined.
 */
export async function getMyOffers(
  supabase: SupabaseClient,
  userId: string,
): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id, listing_id, agent_id, amount, conditions, aip_document_path, status, created_at, updated_at, listings(id, address, price)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get offers: ${error.message}`);
  }

  return (data ?? []) as unknown as Offer[];
}

/**
 * Submit a new offer on a listing.
 * Converts amountGBP to pence before storing.
 * Returns DUPLICATE_OFFER if an active (non-withdrawn) offer already exists.
 * Returns INVALID_LISTING if the listing or agent FK is violated.
 */
export async function submitOffer(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  agentId: string,
  amountGBP: number,
  conditions?: string,
): Promise<SubmitOfferResult> {
  // Check for an existing active offer on this listing
  const { data: existing, error: checkError } = await supabase
    .from("offers")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .not("status", "eq", "withdrawn")
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check existing offers: ${checkError.message}`);
  }

  if (existing) {
    return { error: "DUPLICATE_OFFER" };
  }

  const amountPence = GBPToPence(amountGBP);

  const { data, error } = await supabase
    .from("offers")
    .insert({
      user_id: userId,
      listing_id: listingId,
      agent_id: agentId,
      amount: amountPence,
      conditions: conditions ?? null,
    })
    .select(
      "id, listing_id, agent_id, amount, conditions, aip_document_path, status, created_at, updated_at, listings(id, address, price)",
    )
    .single();

  if (error) {
    // FK violation: listing or agent does not exist
    if (error.code === "23503") {
      return { error: "INVALID_LISTING" };
    }
    throw new Error(`Failed to submit offer: ${error.message}`);
  }

  return { success: true, offer: data as unknown as Offer };
}

/**
 * Get the status history for a specific offer, ordered oldest-first.
 */
export async function getOfferStatusHistory(
  supabase: SupabaseClient,
  offerId: string,
): Promise<OfferStatusHistory[]> {
  const { data, error } = await supabase
    .from("offer_status_history")
    .select("id, offer_id, from_status, to_status, notes, created_at")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get offer status history: ${error.message}`);
  }

  return (data ?? []) as OfferStatusHistory[];
}

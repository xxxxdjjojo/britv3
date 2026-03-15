/**
 * Offers service — buyer-facing offer operations.
 * Amounts stored in pence (integer) in the database.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { gbpToPence } from "@/lib/currency";
import type { ServiceError } from "@/types/service-error";

export type { ServiceError };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OfferStatus =
  | "submitted"
  | "solicitors_instructed"
  | "searches"
  | "survey"
  | "mortgage_approved"
  | "exchange"
  | "completion"
  | "withdrawn";

export type OfferStatusHistoryEntry = Readonly<{
  id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  created_at: string;
}>;

export type BuyerOffer = Readonly<{
  id: string;
  listing_id: string;
  property_address: string;
  /** Amount in pence */
  amount_pence: number;
  status: OfferStatus;
  conditions: string | null;
  aip_document_path: string | null;
  created_at: string;
  updated_at: string;
  status_history: ReadonlyArray<OfferStatusHistoryEntry>;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isServiceError(val: unknown): val is ServiceError {
  return typeof val === "object" && val !== null && "error" in val;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Get all offers submitted by a buyer, with status history and property address.
 * Two-step: fetch offers + history, then resolve addresses from listings.
 */
export async function getOffers(
  supabase: SupabaseClient,
  userId: string,
): Promise<BuyerOffer[] | ServiceError> {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select(
        "id, listing_id, amount, status, conditions, aip_document_path, created_at, updated_at, offer_status_history(id, from_status, to_status, notes, created_at)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[offers-service] getOffers failed", { error });
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return [];
    }

    type RawOffer = {
      id: string;
      listing_id: string;
      amount: number;
      status: string;
      conditions: string | null;
      aip_document_path: string | null;
      created_at: string;
      updated_at: string;
      offer_status_history: Array<{
        id: string;
        from_status: string | null;
        to_status: string;
        notes: string | null;
        created_at: string;
      }>;
    };

    const rows = data as RawOffer[];

    // Resolve listing addresses
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
      listing_id: row.listing_id,
      property_address: addressMap.get(row.listing_id) ?? "Unknown address",
      amount_pence: row.amount,
      status: row.status as OfferStatus,
      conditions: row.conditions,
      aip_document_path: row.aip_document_path,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status_history: row.offer_status_history.map((h) => ({
        id: h.id,
        from_status: h.from_status,
        to_status: h.to_status,
        notes: h.notes,
        created_at: h.created_at,
      })),
    }));
  } catch (err) {
    console.error("[offers-service] getOffers threw", { err });
    return { error: "Failed to fetch offers" };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type SubmitOfferResult = Readonly<{ offerId: string }> | ServiceError;

/**
 * Submit a new offer on a listing.
 * - Checks for existing open offer on the same listing first.
 * - Converts GBP float to pence before insertion.
 */
export async function submitOffer(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  amountGBP: number,
  agentId: string,
  aipDocumentId?: string,
): Promise<SubmitOfferResult> {
  try {
    // Check for existing open offer on this listing
    const { data: existing, error: checkError } = await supabase
      .from("offers")
      .select("id, status")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .not("status", "in", "(withdrawn)")
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("[offers-service] submitOffer duplicate check failed", { checkError });
      return { error: checkError.message };
    }

    if (existing) {
      return { error: "DUPLICATE_OFFER" };
    }

    const amountPence = gbpToPence(amountGBP);

    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      listing_id: listingId,
      agent_id: agentId,
      amount: amountPence,
    };

    if (aipDocumentId) {
      insertPayload.aip_document_path = aipDocumentId;
    }

    const { data, error } = await supabase
      .from("offers")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("[offers-service] submitOffer insert failed", { error });
      return { error: error.message };
    }

    return { offerId: (data as { id: string }).id };
  } catch (err) {
    console.error("[offers-service] submitOffer threw", { err });
    return { error: "Failed to submit offer" };
  }
}

/**
 * Withdraw an offer (update status to 'withdrawn').
 * Uses service-role bypass via API route — direct client update is blocked by RLS.
 */
export async function withdrawOffer(
  supabase: SupabaseClient,
  userId: string,
  offerId: string,
): Promise<null | ServiceError> {
  try {
    // Note: offers_update_blocked RLS prevents direct updates from the client.
    // This service is called from API routes which use the anon client with
    // session context. Since the migration blocks all UPDATE via RLS, the
    // API route should use the service-role client. We surface the error clearly.
    const { error } = await supabase
      .from("offers")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("user_id", userId);

    if (error) {
      console.error("[offers-service] withdrawOffer failed", { error });
      return { error: error.message };
    }

    return null;
  } catch (err) {
    console.error("[offers-service] withdrawOffer threw", { err });
    return { error: "Failed to withdraw offer" };
  }
}

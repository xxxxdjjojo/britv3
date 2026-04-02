/**
 * Agent Offer Service — manage property offers, counter-offers, and status transitions.
 * Automatically triggers sale progression creation on offer acceptance.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentOffer,
  AgentOfferHistory,
  CreateOfferInput,
} from "@/types/agent";
import { createSaleProgression } from "./agent-sale-service";

/**
 * Get all offers for an agent, with optional property and status filters.
 */
export async function getAgentOffers(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
  status?: string,
): Promise<AgentOffer[]> {
  let query = supabase
    .from("agent_offers")
    .select("*")
    .eq("agent_id", agentId);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  return (data ?? []) as AgentOffer[];
}

/**
 * Get a single offer by ID, including its full history.
 */
export async function getOfferById(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
): Promise<(AgentOffer & { history: AgentOfferHistory[] }) | null> {
  const { data: offer, error: offerError } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (offerError) {
    if (offerError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch offer: ${offerError.message}`);
  }

  if (!offer) {
    return null;
  }

  const { data: history, error: historyError } = await supabase
    .from("agent_offer_history")
    .select("*")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });

  if (historyError) {
    throw new Error(`Failed to fetch offer history: ${historyError.message}`);
  }

  return {
    ...(offer as AgentOffer),
    history: (history ?? []) as AgentOfferHistory[],
  };
}

/**
 * Create a new offer with initial 'pending' status.
 * Also inserts the initial history entry.
 */
export async function createOffer(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateOfferInput,
): Promise<AgentOffer> {
  const { data: offer, error: offerError } = await supabase
    .from("agent_offers")
    .insert({
      agent_id: agentId,
      property_id: input.property_id,
      lead_id: input.lead_id ?? null,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email ?? null,
      buyer_phone: input.buyer_phone ?? null,
      amount: input.amount,
      conditions: input.conditions ?? null,
      solicitor_details: input.solicitor_details ?? null,
      aip_status: input.aip_status ?? "not_provided",
      status: "pending",
      counter_amount: null,
      vendor_notified: false,
    })
    .select()
    .single();

  if (offerError || !offer) {
    throw new Error(
      `Failed to create offer: ${offerError?.message ?? "no data"}`,
    );
  }

  // Insert initial history entry
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: offer.id,
      previous_status: null,
      new_status: "pending",
      actor_id: agentId,
      note: null,
    });

  if (historyError) {
    // Non-fatal — offer was created; log and continue
    console.error("Failed to create initial offer history:", historyError);
  }

  return offer as AgentOffer;
}

/**
 * Update an offer's status and record a history entry.
 * If the new status is 'accepted', automatically creates a sale progression.
 */
export async function updateOfferStatus(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  newStatus: string,
  note?: string,
): Promise<AgentOffer> {
  const { data: current, error: fetchError } = await supabase
    .from("agent_offers")
    .select("status, property_id")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !current) {
    throw new Error(
      `Offer not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  const previousStatus = current.status as string;

  const { data: updated, error: updateError } = await supabase
    .from("agent_offers")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(
      `Failed to update offer status: ${updateError?.message ?? "no data"}`,
    );
  }

  // Record history
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: offerId,
      previous_status: previousStatus,
      new_status: newStatus,
      actor_id: agentId,
      note: note ?? null,
    });

  if (historyError) {
    console.error("Failed to record offer history:", historyError);
  }

  // Trigger sale progression on acceptance
  if (newStatus === "accepted") {
    try {
      await createSaleProgression(
        supabase,
        agentId,
        offerId,
        current.property_id as string,
      );
    } catch (saleError) {
      console.error("Failed to create sale progression:", saleError);
    }

    // Update listing status to under_offer
    try {
      await supabase
        .from("listings")
        .update({ status: "under_offer", updated_at: new Date().toISOString() })
        .eq("id", current.property_id);
    } catch (listingError) {
      console.error("Failed to update listing status to under_offer:", listingError);
    }
  }

  return updated as AgentOffer;
}

/**
 * Submit a counter-offer — updates status to 'countered' and sets counter_amount.
 */
export async function counterOffer(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  counterAmount: number,
  note?: string,
): Promise<AgentOffer> {
  const { data: current, error: fetchError } = await supabase
    .from("agent_offers")
    .select("status")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !current) {
    throw new Error(
      `Offer not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  const previousStatus = current.status as string;

  const { data: updated, error: updateError } = await supabase
    .from("agent_offers")
    .update({
      status: "countered",
      counter_amount: counterAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(
      `Failed to submit counter-offer: ${updateError?.message ?? "no data"}`,
    );
  }

  // Record history
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: offerId,
      previous_status: previousStatus,
      new_status: "countered",
      actor_id: agentId,
      note: note ?? null,
    });

  if (historyError) {
    console.error("Failed to record counter-offer history:", historyError);
  }

  return updated as AgentOffer;
}

/**
 * Get the full history for an offer, ordered by creation time.
 */
export async function getOfferHistory(
  supabase: SupabaseClient,
  offerId: string,
): Promise<AgentOfferHistory[]> {
  const { data, error } = await supabase
    .from("agent_offer_history")
    .select("*")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch offer history: ${error.message}`);
  }

  return (data ?? []) as AgentOfferHistory[];
}

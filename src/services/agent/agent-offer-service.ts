/**
 * Agent offer service -- CRUD for offers, status transitions, counter-offers,
 * and offer history tracking.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentOffer,
  AgentOfferHistory,
  CreateOfferInput,
  OfferStatus,
} from "@/types/agent";
import { createOfferSchema } from "@/types/agent";
import { createSaleProgression } from "./agent-sale-service";

// -- Service functions --------------------------------------------------------

/**
 * List offers for an agent, optionally filtered by property and/or status.
 * Results ordered by created_at descending.
 */
export async function getAgentOffers(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
  status?: OfferStatus,
): Promise<AgentOffer[]> {
  let query = supabase
    .from("agent_offers")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  return (data ?? []) as AgentOffer[];
}

/**
 * Fetch a single offer with its full status history.
 */
export async function getOfferById(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
): Promise<{ offer: AgentOffer; history: AgentOfferHistory[] }> {
  const { data: offer, error: offerErr } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (offerErr || !offer) {
    throw new Error(offerErr?.message ?? "Offer not found");
  }

  const { data: history, error: histErr } = await supabase
    .from("agent_offer_history")
    .select("*")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });

  if (histErr) {
    throw new Error(`Failed to fetch offer history: ${histErr.message}`);
  }

  return {
    offer: offer as AgentOffer,
    history: (history ?? []) as AgentOfferHistory[],
  };
}

/**
 * Create a new offer with status 'pending' and log the initial history entry.
 */
export async function createOffer(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateOfferInput,
): Promise<AgentOffer> {
  const parsed = createOfferSchema.parse(input);

  const insertData = {
    agent_id: agentId,
    property_id: parsed.property_id,
    lead_id: parsed.lead_id || null,
    buyer_name: parsed.buyer_name,
    buyer_email: parsed.buyer_email || null,
    buyer_phone: parsed.buyer_phone || null,
    amount: parsed.amount,
    conditions: parsed.conditions || null,
    aip_status: parsed.aip_status ?? "not_provided",
    status: "pending" as OfferStatus,
  };

  const { data, error } = await supabase
    .from("agent_offers")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  const offer = data as AgentOffer;

  // Create initial history entry
  await supabase.from("agent_offer_history").insert({
    offer_id: offer.id,
    previous_status: null,
    new_status: "pending",
    actor_id: agentId,
    note: `Offer of £${offer.amount} created for ${offer.buyer_name}`,
  });

  return offer;
}

/**
 * Transition an offer to a new status, log history, and notify vendor.
 * If the new status is 'accepted', a sale progression record is created
 * automatically.
 */
export async function updateOfferStatus(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  newStatus: OfferStatus,
  note?: string,
): Promise<AgentOffer> {
  // Fetch current offer for previous status
  const { data: current, error: fetchErr } = await supabase
    .from("agent_offers")
    .select("status, property_id")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !current) {
    throw new Error(fetchErr?.message ?? "Offer not found");
  }

  const prev = current as Record<string, unknown>;
  const previousStatus = prev.status as string;
  const propertyId = prev.property_id as string;

  const { data, error } = await supabase
    .from("agent_offers")
    .update({
      status: newStatus,
      vendor_notified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update offer status: ${error.message}`);
  }

  const offer = data as AgentOffer;

  // Log history entry
  await supabase.from("agent_offer_history").insert({
    offer_id: offerId,
    previous_status: previousStatus,
    new_status: newStatus,
    actor_id: agentId,
    note: note ?? `Status changed from ${previousStatus} to ${newStatus}`,
  });

  // Auto-create sale progression when offer is accepted
  if (newStatus === "accepted") {
    await createSaleProgression(supabase, agentId, offerId, propertyId);
  }

  return offer;
}

/**
 * Counter an existing offer with a new amount.
 */
export async function counterOffer(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  counterAmount: number,
  note?: string,
): Promise<AgentOffer> {
  // Fetch current status for history
  const { data: current, error: fetchErr } = await supabase
    .from("agent_offers")
    .select("status")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !current) {
    throw new Error(fetchErr?.message ?? "Offer not found");
  }

  const previousStatus = (current as Record<string, unknown>).status as string;

  const { data, error } = await supabase
    .from("agent_offers")
    .update({
      status: "countered" as OfferStatus,
      counter_amount: counterAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to counter offer: ${error.message}`);
  }

  const offer = data as AgentOffer;

  // Log history entry
  await supabase.from("agent_offer_history").insert({
    offer_id: offerId,
    previous_status: previousStatus,
    new_status: "countered",
    actor_id: agentId,
    note: note ?? `Counter offer of £${counterAmount}`,
  });

  return offer;
}

/**
 * Get the full status history for an offer, ordered chronologically.
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

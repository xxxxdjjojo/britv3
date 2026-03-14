/**
 * Agent offer service — offer management, negotiation, and status transitions
 * with full audit trail. Offer acceptance triggers sale progression creation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentOffer,
  AgentOfferHistory,
  CreateOfferInput,
  OfferStatus,
} from "@/types/agent";
import { createSaleProgression } from "@/services/agent/agent-sale-service";

// ============================================================================
// Offer query functions
// ============================================================================

/**
 * Get all offers managed by an agent.
 * Optional filters: property_id and status.
 * Includes buyer details and AIP status.
 * Ordered by created_at DESC.
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
 * Get a single offer by ID with full history from agent_offer_history.
 */
export async function getOfferById(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
): Promise<AgentOffer & { history: AgentOfferHistory[] }> {
  const { data: offer, error: offerError } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (offerError || !offer) {
    throw new Error("Offer not found or access denied");
  }

  const history = await getOfferHistory(supabase, offerId);

  return { ...(offer as AgentOffer), history };
}

// ============================================================================
// Offer mutation functions
// ============================================================================

/**
 * Create a new offer in 'pending' status.
 * Creates an initial history entry recording the submission.
 */
export async function createOffer(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateOfferInput,
): Promise<AgentOffer> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: offer, error } = await supabase
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
      solicitor_details: input.solicitor_details ?? {},
      aip_status: input.aip_status ?? "not_provided",
      status: "pending",
      vendor_notified: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  const typedOffer = offer as AgentOffer;

  // Create initial history entry
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: typedOffer.id,
      previous_status: null,
      new_status: "pending",
      actor_id: user.id,
      note: "Offer submitted",
    });

  if (historyError) {
    // Non-fatal: offer was created, history recording failed
    console.error("Failed to create offer history entry:", historyError.message);
  }

  return typedOffer;
}

/**
 * Update offer status with audit trail.
 * Sets vendor_notified=true on every status change.
 * If status transitions to 'accepted', creates a sale progression record.
 */
export async function updateOfferStatus(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  newStatus: OfferStatus,
  note?: string,
): Promise<AgentOffer> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Fetch current offer to record previous status
  const { data: existing, error: fetchError } = await supabase
    .from("agent_offers")
    .select("status, property_id")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Offer not found or access denied");
  }

  const previousStatus = existing.status as OfferStatus;

  const { data: updatedOffer, error: updateError } = await supabase
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

  if (updateError) {
    throw new Error(`Failed to update offer status: ${updateError.message}`);
  }

  // Create history entry
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: offerId,
      previous_status: previousStatus,
      new_status: newStatus,
      actor_id: user.id,
      note: note ?? null,
    });

  if (historyError) {
    console.error("Failed to create offer history entry:", historyError.message);
  }

  // If accepted, initialize the sale progression pipeline
  if (newStatus === "accepted") {
    try {
      await createSaleProgression(
        supabase,
        agentId,
        offerId,
        existing.property_id as string,
      );
    } catch (saleError) {
      // Log but do not roll back the status change
      console.error(
        "Failed to create sale progression after offer acceptance:",
        saleError,
      );
    }
  }

  return updatedOffer as AgentOffer;
}

/**
 * Submit a counter-offer.
 * Updates status to 'countered', records the counter_amount, and creates an audit entry.
 */
export async function counterOffer(
  supabase: SupabaseClient,
  offerId: string,
  agentId: string,
  counterAmount: number,
  note?: string,
): Promise<AgentOffer> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("agent_offers")
    .select("status")
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Offer not found or access denied");
  }

  const previousStatus = existing.status as OfferStatus;

  const { data: updatedOffer, error: updateError } = await supabase
    .from("agent_offers")
    .update({
      status: "countered",
      counter_amount: counterAmount,
      vendor_notified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to submit counter-offer: ${updateError.message}`);
  }

  // Create history entry
  const { error: historyError } = await supabase
    .from("agent_offer_history")
    .insert({
      offer_id: offerId,
      previous_status: previousStatus,
      new_status: "countered",
      actor_id: user.id,
      note: note ?? `Counter-offer submitted at ${counterAmount} pence`,
    });

  if (historyError) {
    console.error("Failed to create offer history entry:", historyError.message);
  }

  return updatedOffer as AgentOffer;
}

/**
 * Get all history entries for an offer, ordered by created_at ASC.
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

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AgentLeadInput = Readonly<{
  contactEmail: string;
  contactPhone?: string | null;
  contactPreference: "email" | "phone";
  sellingTimeline?: string | null;
  agentId?: string | null;
  agencyId?: string | null;
  noticeVersion: string;
  sourceRoute: string;
}>;

export type AgentLeadOutcome = { leadId: string; sharedFields: string[] } | { error: "not_found" | "failed" };

/**
 * Create an agent lead ONLY for a valuation the user owns, recording exactly
 * which fields are shared and a granular consent event (purpose 'agent_contact').
 * Email verification never implies this — a lead is created only here, on an
 * explicit request. No marketing consent is recorded.
 */
export async function createAgentLead(
  userId: string,
  valuationId: string,
  input: AgentLeadInput,
): Promise<AgentLeadOutcome> {
  const supabase = createAdminClient();

  // Authorisation: the valuation must belong to the requesting user.
  const { data: owned } = await supabase
    .from("valuation_results")
    .select("id")
    .eq("id", valuationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!owned) return { error: "not_found" };

  const sharedFields = [
    "property_address",
    "indicative_estimate",
    "property_details",
    "contact_email",
    ...(input.contactPhone ? ["contact_phone"] : []),
  ];

  const { data: lead, error } = await supabase
    .from("valuation_agent_leads")
    .insert({
      valuation_id: valuationId,
      user_id: userId,
      agent_id: input.agentId ?? null,
      agency_id: input.agencyId ?? null,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone ?? null,
      contact_preference: input.contactPreference,
      selling_timeline: input.sellingTimeline ?? null,
      shared_fields: sharedFields,
      status: "submitted",
    })
    .select("id")
    .single();
  if (error || !lead) return { error: "failed" };

  // Granular, audited consent — agent_contact only, never marketing.
  await supabase.from("valuation_consent_events").insert({
    valuation_id: valuationId,
    user_id: userId,
    agent_id: input.agentId ?? null,
    agency_id: input.agencyId ?? null,
    purpose: "agent_contact",
    notice_version: input.noticeVersion,
    consent_state: "granted",
    source_route: input.sourceRoute,
  });

  return { leadId: lead.id, sharedFields };
}

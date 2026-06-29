// Lead + viewing creation. Writes use the service-role client because public
// visitors are unauthenticated — RLS grants no public INSERT (so leads can
// never be read cross-org), and the server validates everything first.

import { createAdminClient } from "@/lib/supabase/admin";
import type { DevelopmentLeadInput } from "@/lib/new-homes/lead-schema";
import type {
  DevelopmentEventType,
  DevelopmentLeadType,
} from "@/lib/new-homes/types";
import { logDevelopmentEvent } from "./events-service";

type Row = Record<string, unknown>;

export interface CreateLeadResult {
  ok: boolean;
  leadId?: string;
  error?: string;
}

/** Map a lead surface to the analytics event it should emit. */
const LEAD_EVENT: Record<DevelopmentLeadType, DevelopmentEventType> = {
  register_interest: "enquiry_submitted",
  ask_question: "enquiry_submitted",
  request_brochure: "brochure_requested",
  book_viewing: "viewing_requested",
};

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Validate-then-insert a development lead. Confirms the development exists and
 * is published before writing, emits the matching funnel event, and (for
 * book_viewing) creates a linked viewing request.
 */
export async function createDevelopmentLead(
  input: DevelopmentLeadInput,
): Promise<CreateLeadResult> {
  const admin = createAdminClient();

  // Guard: the development must exist and be published.
  const { data: dev, error: devError } = await admin
    .from("developments")
    .select("id, is_published")
    .eq("id", input.developmentId)
    .maybeSingle();

  if (devError || !dev || (dev as Row).is_published !== true) {
    return { ok: false, error: "Development not found" };
  }

  const { data: leadRow, error: insertError } = await admin
    .from("development_leads")
    .insert({
      development_id: input.developmentId,
      unit_id: input.unitId ?? null,
      lead_type: input.leadType,
      status: "new",
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: emptyToNull(input.phone),
      buyer_status: input.buyerStatus ?? null,
      budget: input.budget ?? null,
      desired_move_date: emptyToNull(input.desiredMoveDate),
      mortgage_position: input.mortgagePosition ?? null,
      has_property_to_sell: input.hasPropertyToSell ?? null,
      preferred_plot: emptyToNull(input.preferredPlot),
      message: emptyToNull(input.message),
      source_route: emptyToNull(input.sourceRoute),
      utm_source: emptyToNull(input.utm?.source),
      utm_medium: emptyToNull(input.utm?.medium),
      utm_campaign: emptyToNull(input.utm?.campaign),
      utm_term: emptyToNull(input.utm?.term),
      utm_content: emptyToNull(input.utm?.content),
    })
    .select("id")
    .single();

  if (insertError || !leadRow) {
    return { ok: false, error: "Could not save your enquiry" };
  }

  const leadId = String((leadRow as Row).id);

  // For viewing requests, also create the viewing record.
  if (input.leadType === "book_viewing") {
    const scheduledFor = emptyToNull(input.preferredViewingAt);
    await admin.from("development_viewings").insert({
      development_id: input.developmentId,
      lead_id: leadId,
      unit_id: input.unitId ?? null,
      scheduled_for: scheduledFor && /^\d{4}-\d{2}-\d{2}/.test(scheduledFor) ? scheduledFor : null,
      status: "requested",
      notes: emptyToNull(input.message),
    });
  }

  await logDevelopmentEvent({
    eventType: LEAD_EVENT[input.leadType],
    developmentId: input.developmentId,
    unitId: input.unitId ?? null,
    leadId,
    metadata: { leadType: input.leadType, source: input.utm?.source ?? null },
  });

  return { ok: true, leadId };
}

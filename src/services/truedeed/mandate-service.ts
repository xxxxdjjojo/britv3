/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed mandate service (billing spec §1 — Bacs mandate lifecycle).
 *
 * `applyMandateEvent` reflects GoCardless mandate webhooks (cancelled /
 * expired / failed) onto agent_agency_profiles.mandate_status, keyed by
 * gocardless_mandate_id, with an audit row. The webhook route pairs it with
 * inngest 'truedeed/mandate.broken' to start the clause 8.3
 * 10-business-day re-establishment clock.
 *
 * `createMandateSetupFlow` starts onboarding: a GoCardless Billing Request
 * flow (hosted page) for the org's director. gocardless_customer_id /
 * gocardless_mandate_id are NOT known at this stage — they land via the
 * billing-request webhook once the director completes the hosted flow —
 * so this only records the flow start (audit) and hands back the
 * authorisation URL for the UI to redirect to.
 *
 * SECURITY NOTE: Logs carry only error_type (the Error constructor name)
 * and entity ids — never emails, names or other PII. GoCardless mandate /
 * flow ids are opaque references, not PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBillingRequestFlow,
  isGoCardlessConfigured,
} from "@/lib/truedeed/gocardless-client";

/** Mandate webhook actions we mirror onto mandate_status (spec §1). */
const MANDATE_STATUS_BY_ACTION: Record<string, string> = {
  cancelled: "cancelled",
  expired: "expired",
  failed: "failed",
};

export type ApplyMandateEventInput = {
  /** GoCardless mandate id (links.mandate on the webhook event). */
  mandateId: string;
  /** Webhook action: cancelled | expired | failed. */
  action: string;
};

export type MandateSetupFlowResult =
  | { authorisationUrl: string }
  | { error: "not_configured" | "not_found" | "internal" };

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Marks the org's mandate broken: sets mandate_status from the webhook
 * action on the profile matching gocardless_mandate_id and writes an audit
 * row. Returns false for unknown actions, unknown mandates or any failure.
 * Never throws.
 */
export async function applyMandateEvent(
  input: ApplyMandateEventInput,
): Promise<boolean> {
  const { mandateId, action } = input;
  const mandateStatus = MANDATE_STATUS_BY_ACTION[action];
  if (!mandateStatus || !mandateId) return false;

  try {
    const supabase = createAdminClient();

    const { data: profile, error: updateError } = await supabase
      .from("agent_agency_profiles")
      .update({ mandate_status: mandateStatus })
      .eq("gocardless_mandate_id", mandateId)
      .select("agent_id")
      .maybeSingle();
    if (updateError || !profile) return false;

    await supabase.from("truedeed_audit_log").insert({
      action: "mandate_status_changed",
      entity: "agent_agency_profiles",
      entity_id: (profile as { agent_id: string }).agent_id,
      detail: { gocardless_mandate_id: mandateId, mandate_status: mandateStatus },
    });

    return true;
  } catch (error: unknown) {
    console.error("[truedeed] applyMandateEvent failed", {
      error_type: errorType(error),
    });
    return false;
  }
}

/**
 * Starts the hosted Bacs mandate setup for an agent's org (spec §1
 * onboarding): resolves the director's email (profile contact_email,
 * falling back to the auth user), creates the GoCardless Billing Request
 * flow and returns the hosted-page URL. The mandate / customer ids are
 * persisted later by the webhook when the flow completes. Never throws.
 */
export async function createMandateSetupFlow(
  agentId: string,
  redirectUri: string,
  exitUri: string,
): Promise<MandateSetupFlowResult> {
  if (!isGoCardlessConfigured()) {
    return { error: "not_configured" };
  }

  try {
    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("agent_agency_profiles")
      .select("contact_email")
      .eq("agent_id", agentId)
      .maybeSingle();
    if (profileError || !profile) {
      return { error: "not_found" };
    }

    let customerEmail = (profile as { contact_email?: string | null })
      .contact_email;
    if (!customerEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(agentId);
      customerEmail = authUser?.user?.email ?? null;
    }
    if (!customerEmail) {
      return { error: "not_found" };
    }

    const flow = await createBillingRequestFlow({
      customerEmail,
      orgId: agentId,
      redirectUri,
      exitUri,
    });

    await supabase.from("truedeed_audit_log").insert({
      action: "mandate_setup_started",
      entity: "agent_agency_profiles",
      entity_id: agentId,
      detail: { gocardless_flow_id: flow.flowId },
    });

    return { authorisationUrl: flow.authorisationUrl };
  } catch (error: unknown) {
    console.error("[truedeed] createMandateSetupFlow failed", {
      error_type: errorType(error),
      agent_id: agentId,
    });
    return { error: "internal" };
  }
}

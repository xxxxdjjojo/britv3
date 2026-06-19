/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Tenant referencing orchestration.
 *
 * - getProvider(): selects the adapter from REFERENCING_PROVIDER (default "mock")
 * - startReferencing(): kicks off a check, stamps the application as pending,
 *   and emits an Inngest event so the (potentially slow) provider call runs
 *   out-of-band
 * - applyReferencingOutcome(): maps a provider outcome back onto the
 *   application's credit_check_status / references_status (called from the
 *   provider webhook)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { inngest } from "@/inngest/client";
import type { ReferencingProvider } from "@/services/referencing/referencing-provider";
import { MockReferencingAdapter } from "@/services/referencing/adapters/mock-adapter";

let _provider: ReferencingProvider | null = null;

/** Resolve the active referencing provider. Only "mock" is wired today. */
export function getProvider(): ReferencingProvider {
  if (_provider) return _provider;
  // Real adapters (goodlord/homelet) plug in here keyed on REFERENCING_PROVIDER.
  _provider = new MockReferencingAdapter();
  return _provider;
}

/**
 * Begin referencing for an application. Sets credit_check_status and
 * references_status to "pending", records the provider + external ref, and
 * emits `referencing/check.requested`. Safe to call when the application has
 * just transitioned into the "referencing" state.
 */
export async function startReferencing(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<void> {
  const { data: application, error } = await supabase
    .from("tenant_applications")
    .select(
      "id, status, applicant_name, applicant_email, monthly_income, employment_status",
    )
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    throw new Error(`Application not found: ${error?.message ?? applicationId}`);
  }

  if (application.status !== "referencing") {
    // Only run referencing for applications in the referencing stage.
    return;
  }

  const provider = getProvider();
  const initiation = await provider.initiateCheck({
    applicationId: application.id as string,
    applicantName: application.applicant_name as string,
    applicantEmail: application.applicant_email as string,
    monthlyIncome: application.monthly_income as number | null,
    employmentStatus: application.employment_status as string | null,
  });

  const { error: updateError } = await supabase
    .from("tenant_applications")
    .update({
      credit_check_status: "pending",
      references_status: "pending",
      referencing_provider: provider.name,
      referencing_external_ref: initiation.externalRef,
      referencing_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) {
    throw new Error(`Failed to mark referencing pending: ${updateError.message}`);
  }

  await inngest.send({
    name: "referencing/check.requested",
    data: { applicationId, externalRef: initiation.externalRef, provider: provider.name },
  });
}

/**
 * Apply a provider outcome to the application. Maps:
 *   passed  -> credit_check_status="passed", references_status="verified"
 *   failed  -> credit_check_status="failed"
 *   pending -> no-op (still in progress)
 * Uses the admin client (webhooks are unauthenticated) and matches on the
 * provider's external reference.
 */
export async function applyReferencingOutcome(
  supabase: SupabaseClient,
  externalRef: string,
  outcome: "passed" | "failed" | "pending",
): Promise<{ matched: boolean }> {
  if (outcome === "pending") return { matched: true };

  const updates: Record<string, unknown> = {
    credit_check_status: outcome,
    updated_at: new Date().toISOString(),
  };
  if (outcome === "passed") {
    updates.references_status = "verified";
  }

  const { data, error } = await supabase
    .from("tenant_applications")
    .update(updates)
    .eq("referencing_external_ref", externalRef)
    .select("id");

  if (error) {
    throw new Error(`Failed to apply referencing outcome: ${error.message}`);
  }

  return { matched: (data?.length ?? 0) > 0 };
}

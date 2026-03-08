import { createClient } from "@/lib/supabase/client";
import type { ProviderVerification, VerificationLevel, VerificationStage } from "@/types/auth";
import { VERIFICATION_STAGES } from "@/lib/constants";

/**
 * Pure function to compute verification level from completed stages.
 * Duplicated from role-service to avoid importing server-only module in client code.
 */
function computeVerificationLevel(completedStages: VerificationStage[]): VerificationLevel {
  const stages = new Set(completedStages);
  const hasEmail = stages.has("email");
  const hasPhone = stages.has("phone");
  const hasIdentity = stages.has("identity");
  const hasInsurance = stages.has("insurance");
  const hasQualifications = stages.has("qualifications");
  const hasAdminReview = stages.has("admin_review");

  if (hasEmail && hasPhone && hasIdentity && hasInsurance && hasQualifications && hasAdminReview) {
    return "professional";
  }
  if (hasEmail && hasPhone && hasIdentity) {
    return "enhanced";
  }
  if (hasEmail && hasPhone) {
    return "standard";
  }
  return "basic";
}

type VerificationServiceResult<T = null> = {
  data: T;
  error: { message: string } | null;
};

/** Ordered stage values for sequential validation. */
const STAGE_ORDER: VerificationStage[] = VERIFICATION_STAGES.map((s) => s.value);

/**
 * Get all verification records for a user, ordered by stage sequence.
 */
export async function getVerificationStatus(
  userId: string,
): Promise<VerificationServiceResult<ProviderVerification[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("provider_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: { message: error.message } };
  }

  return { data: data ?? [], error: null };
}

/**
 * Get verification progress summary for a user.
 */
export async function getVerificationProgress(
  userId: string,
): Promise<VerificationServiceResult<{
  completedStages: VerificationStage[];
  currentStage: VerificationStage | null;
  level: ReturnType<typeof computeVerificationLevel>;
  percentage: number;
}>> {
  const { data: records, error } = await getVerificationStatus(userId);

  if (error) {
    return {
      data: { completedStages: [], currentStage: "email", level: "basic", percentage: 0 },
      error,
    };
  }

  const completedStages = records
    .filter((r) => r.status === "approved")
    .map((r) => r.stage);

  const completedSet = new Set(completedStages);
  const currentStage = STAGE_ORDER.find((s) => !completedSet.has(s)) ?? null;
  const level = computeVerificationLevel(completedStages);
  const percentage = (completedStages.length / STAGE_ORDER.length) * 100;

  return {
    data: { completedStages, currentStage, level, percentage },
    error: null,
  };
}

/**
 * Submit a verification stage for a user.
 * Enforces sequential stage order and prevents user submission of admin_review.
 */
export async function submitVerification(
  userId: string,
  stage: VerificationStage,
  documentUrl?: string,
): Promise<VerificationServiceResult<ProviderVerification | null>> {
  // Admin review cannot be submitted by user
  if (stage === "admin_review") {
    return {
      data: null,
      error: { message: "The admin review stage cannot be submitted by users" },
    };
  }

  const supabase = createClient();

  // Fetch existing verifications to check stage order
  const { data: existing, error: fetchError } = await supabase
    .from("provider_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return { data: null, error: { message: fetchError.message } };
  }

  const approvedStages = new Set(
    (existing ?? []).filter((r: ProviderVerification) => r.status === "approved").map((r: ProviderVerification) => r.stage),
  );

  // Validate stage order: all previous stages must be approved
  const stageIndex = STAGE_ORDER.indexOf(stage);
  for (let i = 0; i < stageIndex; i++) {
    if (!approvedStages.has(STAGE_ORDER[i])) {
      return {
        data: null,
        error: {
          message: `Cannot submit "${stage}" -- previous stage "${STAGE_ORDER[i]}" must be approved first`,
        },
      };
    }
  }

  // Upsert the verification record
  const { data: record, error: upsertError } = await supabase
    .from("provider_verifications")
    .upsert(
      {
        user_id: userId,
        stage,
        status: "submitted" as const,
        document_url: documentUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,stage" },
    )
    .select("*")
    .single();

  if (upsertError) {
    return { data: null, error: { message: upsertError.message } };
  }

  return { data: record, error: null };
}

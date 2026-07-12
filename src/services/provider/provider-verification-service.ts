/**
 * provider-verification-service.ts
 *
 * Verification steps, reference requests, badges, and document uploads for
 * the provider dashboard. All functions accept a SupabaseClient as a parameter
 * so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProviderBadge, ProviderReference } from "@/types/provider-dashboard";
import type { VerificationDocumentType } from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ordered list of 5 verification steps. */
export const VERIFICATION_STEPS = [
  {
    stepId: "id_check",
    label: "Identity Verification",
    description: "Upload a government-issued photo ID (passport, driving licence).",
    required: true,
    document_types: ["identity_proof", "dbs_check"] as VerificationDocumentType[],
  },
  {
    stepId: "insurance",
    label: "Insurance",
    description: "Provide proof of public liability insurance.",
    required: true,
    document_types: [
      "insurance_certificate",
      "public_liability_insurance",
    ] as VerificationDocumentType[],
  },
  {
    stepId: "qualifications",
    label: "Qualifications & Certifications",
    description: "Upload relevant trade qualifications and certifications.",
    required: false,
    document_types: [
      "qualification_certificate",
      "gas_safe_certificate",
      "niceic_registration",
      "napit_registration",
      "cscs_card",
      "part_p_certificate",
      "acs_qualification",
    ] as VerificationDocumentType[],
  },
  {
    stepId: "client_references",
    label: "Client References",
    description: "Request references from past clients.",
    required: false,
    reference_type: "client" as const,
  },
  {
    stepId: "peer_references",
    label: "Peer References",
    description: "Request references from industry peers.",
    required: false,
    reference_type: "peer" as const,
  },
] as const;

/**
 * Reference statuses that count as still in flight for a verification step —
 * requested/awaiting-response, not yet a terminal (verified/failed) state.
 */
const IN_FLIGHT = ["submitted", "sent", "pending"] as const;

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type VerificationStep = Readonly<{
  /** Step identifier e.g. 'id_check' | 'insurance' | 'qualifications' | 'client_references' | 'peer_references' */
  stepId: string;
  /** Human-readable label */
  label: string;
  /** Friendly description */
  description: string;
  /**
   * Step status:
   * 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
   */
  status: "not_started" | "in_progress" | "submitted" | "approved" | "rejected";
  /** Whether this step is required for the Verified badge */
  required: boolean;
  /** Optional ISO 8601 timestamp when this step was last updated */
  updatedAt: string | null;
  /** Step order (1-indexed) */
  step_number: number;
  /** Reason for rejection (only set when status is 'rejected') */
  rejectionReason: string | null;
}>;

export type UpdateBadgeResult = Readonly<{
  providerId: string;
  badgeType: string;
  status: string;
  updatedAt: string;
}>;

// ---------------------------------------------------------------------------
// getVerificationSteps
// ---------------------------------------------------------------------------

/**
 * Returns an ordered array of 5 verification steps with their current status.
 * Status is derived by checking provider_documents (for id_check, insurance,
 * qualifications) and provider_references (for client_references, peer_references).
 *
 * Falls back to 'not_started' for every step on any database error.
 *
 * @param providerId  - The provider's UUID
 * @param supabase    - Supabase client
 */
export async function getVerificationSteps(
  providerId: string,
  supabase: SupabaseClient,
): Promise<VerificationStep[]> {
  try {
    const [docsResult, refsResult] = await Promise.allSettled([
      supabase
        .from("provider_documents")
        .select("document_type, status, updated_at, rejection_reason")
        .eq("provider_id", providerId),

      supabase
        .from("provider_references")
        .select("reference_type, status, requested_at")
        .eq("provider_id", providerId),
    ]);

    const docs: Array<{ document_type: string; status: string; updated_at: string | null; rejection_reason?: string | null }> =
      docsResult.status === "fulfilled" && !docsResult.value.error
        ? (docsResult.value.data ?? [])
        : [];

    const refs: Array<{ reference_type: string; status: string; requested_at: string | null }> =
      refsResult.status === "fulfilled" && !refsResult.value.error
        ? (refsResult.value.data ?? [])
        : [];

    return VERIFICATION_STEPS.map((step, idx): VerificationStep => {
      let status: VerificationStep["status"] = "not_started";
      let updatedAt: string | null = null;
      let rejectionReason: string | null = null;

      if ("document_types" in step) {
        const matchingDocs = docs.filter((d) =>
          (step.document_types as readonly string[]).includes(d.document_type),
        );

        if (matchingDocs.length > 0) {
          const hasApproved = matchingDocs.some((d) => d.status === "approved");
          const hasRejected = matchingDocs.some((d) => d.status === "rejected");
          const hasPending = matchingDocs.some((d) => d.status === "pending");

          if (hasApproved) status = "approved";
          else if (hasRejected) {
            status = "rejected";
            const rejectedDoc = matchingDocs.find((d) => d.status === "rejected");
            rejectionReason = rejectedDoc?.rejection_reason ?? null;
          }
          else if (hasPending) status = "submitted";
          else status = "in_progress";

          const sorted = matchingDocs
            .map((d) => d.updated_at)
            .filter(Boolean)
            .sort()
            .reverse();
          updatedAt = sorted[0] ?? null;
        }
      } else {
        // reference steps
        const matchingRefs = refs.filter((r) => r.reference_type === step.reference_type);

        if (matchingRefs.length > 0) {
          // Only 'verified' counts as done. 'submitted'/'sent'/'pending' are
          // still in flight. Terminal-fail statuses ('rejected'/'declined'/
          // 'expired'/'revoked'/'flagged') do not count toward either — a step
          // with only failed refs reads as not_started (nothing usable), unless
          // there is also an in-flight ref.
          const hasVerified = matchingRefs.some((r) => r.status === "verified");
          const hasInFlight = matchingRefs.some((r) =>
            (IN_FLIGHT as readonly string[]).includes(r.status),
          );

          if (hasVerified) status = "approved";
          else if (hasInFlight) status = "in_progress";
          else status = "not_started";

          const sorted = matchingRefs
            .map((r) => r.requested_at)
            .filter(Boolean)
            .sort()
            .reverse();
          updatedAt = sorted[0] ?? null;
        }
      }

      return {
        stepId: step.stepId,
        label: step.label,
        description: step.description,
        status,
        required: step.required,
        updatedAt,
        step_number: idx + 1,
        rejectionReason,
      };
    });
  } catch {
    return VERIFICATION_STEPS.map(
      (step, idx): VerificationStep => ({
        stepId: step.stepId,
        label: step.label,
        description: step.description,
        status: "not_started",
        required: step.required,
        updatedAt: null,
        step_number: idx + 1,
        rejectionReason: null,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// getProviderReferences
// ---------------------------------------------------------------------------

/**
 * Returns ProviderReference[] for the given provider, filtered by reference_type.
 * Uses the `reference_type` column (not `type`).
 */
export async function getProviderReferences(
  supabase: SupabaseClient,
  providerId: string,
  type: "client" | "peer",
): Promise<ProviderReference[]> {
  const { data, error } = await supabase
    .from("provider_references")
    .select("*")
    .eq("provider_id", providerId)
    .eq("reference_type", type)
    .order("requested_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderReference[];
}

// NOTE: The former client-side `sendReferenceRequest` insert was removed —
// provider_references RLS now blocks trader writes. Requesting a reference goes
// through POST /api/provider/references (service-role write + Inngest event).

// ---------------------------------------------------------------------------
// getProviderBadges
// ---------------------------------------------------------------------------

/**
 * Returns active ProviderBadge[] for the given provider, ordered by earned_at DESC.
 */
export async function getProviderBadges(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ProviderBadge[]> {
  const { data, error } = await supabase
    .from("provider_badges")
    .select("*")
    .eq("provider_id", providerId)
    .eq("is_active", true)
    .order("earned_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderBadge[];
}

// ---------------------------------------------------------------------------
// updateBadgeStatus
// ---------------------------------------------------------------------------

/**
 * Updates (or creates) the is_active flag / status for a provider badge.
 * Maps the incoming string status to is_active: true/false.
 *
 * Returns { providerId, badgeType, status, updatedAt }.
 * Throws when badgeType doesn't exist for this provider.
 */
export async function updateBadgeStatus(
  providerId: string,
  badgeType: string,
  status: "pending" | "approved" | "revoked",
  supabase: SupabaseClient,
): Promise<UpdateBadgeResult> {
  const isActive = status === "approved";

  const { data, error } = await supabase
    .from("provider_badges")
    .update({ is_active: isActive })
    .eq("provider_id", providerId)
    .eq("badge_type", badgeType)
    .select("id, badge_type, is_active, earned_at")
    .single();

  if (error) {
    throw new Error(`Failed to update badge status: ${error.message}`);
  }

  const updatedAt = new Date().toISOString();

  return {
    providerId,
    badgeType: (data as { badge_type: string }).badge_type,
    status,
    updatedAt,
  };
}

// ---------------------------------------------------------------------------
// uploadVerificationDocument
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Uploads a verification document to Supabase Storage and upserts the
 * provider_documents row. Validates file type (PDF, JPEG, PNG) and size (≤ 10 MB).
 */
export async function uploadVerificationDocument(
  supabase: SupabaseClient,
  providerId: string,
  documentType: VerificationDocumentType,
  file: File,
): Promise<{ storage_path: string; document_id: string }> {
  // Validate mime type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds the 10 MB limit.");
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${providerId}/${documentType}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("provider-documents")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: upsertData, error: upsertError } = await supabase
    .from("provider_documents")
    .upsert(
      {
        provider_id: providerId,
        document_type: documentType,
        storage_path: storagePath,
        status: "pending",
      },
      { onConflict: "provider_id,document_type" },
    )
    .select("id")
    .single();

  if (upsertError) throw new Error(`Document record upsert failed: ${upsertError.message}`);

  return {
    storage_path: storagePath,
    document_id: (upsertData as { id: string }).id,
  };
}

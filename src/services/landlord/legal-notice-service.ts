/**
 * Legal notice service -- generate and manage Section 21 / Section 8 notices.
 * validateSection21Requirements is a pure function (no Supabase dependency)
 * that can be called client-side for pre-flight validation before generating PDF.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegalNotice, NoticeStatus } from "@/types/landlord";

// -- Pure validation (no side effects) ----------------------------------------

export type Section21ValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validate that all Section 21 prerequisites are met before generating the notice.
 * This is a pure function — safe to call client-side.
 *
 * Blocks if:
 * - EPC not provided to tenant
 * - Gas Safety Certificate not provided within 28 days
 * - Deposit protection scheme reference is missing
 * - Possession date is not set
 */
export function validateSection21Requirements(
  notice: Partial<LegalNotice>,
): Section21ValidationResult {
  const errors: string[] = [];

  if (!notice.epc_provided) {
    errors.push("EPC must have been provided to tenant");
  }

  if (!notice.gas_safety_provided) {
    errors.push("Gas Safety Certificate must have been provided within 28 days");
  }

  if (!notice.deposit_scheme_reference?.trim()) {
    errors.push("Deposit protection scheme reference is required");
  }

  if (!notice.possession_date) {
    errors.push("Possession date is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// -- Service functions --------------------------------------------------------

/**
 * Create a new legal notice (Section 21 or Section 8) as a draft.
 */
export async function createNotice(
  supabase: SupabaseClient,
  data: Omit<LegalNotice, "id" | "created_at">,
): Promise<LegalNotice> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: record, error } = await supabase
    .from("legal_notices")
    .insert({
      ...data,
      landlord_id: user.id,
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to create legal notice: ${error?.message ?? "no data"}`,
    );
  }

  return record as LegalNotice;
}

/**
 * List all legal notices for the authenticated landlord.
 * Optionally filters by propertyId.
 */
export async function listNotices(
  supabase: SupabaseClient,
  propertyId?: string,
): Promise<LegalNotice[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  let query = supabase
    .from("legal_notices")
    .select("*")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch legal notices: ${error.message}`);
  }

  return (data ?? []) as LegalNotice[];
}

/**
 * Update the status of a notice (draft -> generated -> served).
 * Optionally records the PDF storage path when generating.
 */
export async function updateNoticeStatus(
  supabase: SupabaseClient,
  noticeId: string,
  status: NoticeStatus,
  pdfPath?: string,
): Promise<LegalNotice> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const updates: Record<string, unknown> = { status };

  if (pdfPath) {
    updates.pdf_storage_path = pdfPath;
  }

  if (status === "served") {
    updates.served_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("legal_notices")
    .update(updates)
    .eq("id", noticeId)
    .eq("landlord_id", user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update notice status: ${error?.message ?? "no data"}`,
    );
  }

  return data as LegalNotice;
}

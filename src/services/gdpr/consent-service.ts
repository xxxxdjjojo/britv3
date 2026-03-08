/**
 * GDPR consent management service -- CRUD operations for consent records
 * and deletion requests. Audit logging handled by DB trigger on consent_records.
 */

import type { ConsentType } from "@/types/gdpr";
import { createClient } from "@/lib/supabase/server";

/**
 * Initialize consent records for a new user (called after signup).
 * Creates one consent_record per ConsentType.
 */
export async function initializeConsent(
  userId: string,
  consents: Record<ConsentType, boolean>,
  ip: string,
  userAgent: string,
) {
  const supabase = await createClient();

  const records = (Object.entries(consents) as [ConsentType, boolean][]).map(
    ([consentType, granted]) => ({
      user_id: userId,
      consent_type: consentType,
      granted,
      ip_address: ip,
      user_agent: userAgent,
    }),
  );

  const { data, error } = await supabase
    .from("consent_records")
    .insert(records)
    .select();

  return { data, error };
}

/**
 * Get all consent records for a user.
 */
export async function getConsent(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consent_records")
    .select()
    .eq("user_id", userId);

  return { data, error };
}

/**
 * Update a single consent type for a user. Uses upsert so it works
 * even if the record doesn't exist yet. The DB trigger on consent_records
 * automatically creates a consent_audit_log entry.
 */
export async function updateConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  ip: string,
  userAgent: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consent_records")
    .upsert(
      {
        user_id: userId,
        consent_type: consentType,
        granted,
        ip_address: ip,
        user_agent: userAgent,
      },
      { onConflict: "user_id,consent_type" },
    )
    .select()
    .single();

  return { data, error };
}

/**
 * Create a deletion request with 30-day grace period.
 */
export async function createDeletionRequest(userId: string) {
  const supabase = await createClient();

  const scheduledPurgeAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("deletion_requests")
    .insert({
      user_id: userId,
      status: "pending",
      scheduled_purge_at: scheduledPurgeAt,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Check if user has an existing pending deletion request.
 */
export async function hasPendingDeletion(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("deletion_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return data !== null;
}

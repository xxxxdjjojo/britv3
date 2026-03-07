/**
 * GDPR data export service -- queries all user data across tables
 * and returns a structured JSON object for download.
 * Uses admin client to bypass RLS for complete data export.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Export all user data as a structured JSON object.
 * Queries multiple tables to compile a complete data export.
 */
export async function exportUserData(userId: string) {
  const supabase = createAdminClient();

  // Query all user-related tables in parallel
  const [
    profileResult,
    rolesResult,
    consentResult,
    consentAuditResult,
    authAuditResult,
    verificationsResult,
    deletionResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, phone, avatar_url, created_at, updated_at")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("user_roles")
      .select("role, is_primary, created_at")
      .eq("user_id", userId),
    supabase
      .from("consent_records")
      .select("consent_type, granted, created_at, updated_at")
      .eq("user_id", userId),
    supabase
      .from("consent_audit_log")
      .select("consent_type, old_value, new_value, created_at")
      .eq("user_id", userId),
    supabase
      .from("auth_audit_log")
      .select("event_type, ip_address, created_at")
      .eq("user_id", userId),
    supabase
      .from("provider_verifications")
      .select("stage, status, created_at, verified_at")
      .eq("user_id", userId),
    supabase
      .from("deletion_requests")
      .select("status, requested_at, scheduled_purge_at")
      .eq("user_id", userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profileResult.data ?? null,
    roles: rolesResult.data ?? [],
    consent: consentResult.data ?? [],
    consent_history: consentAuditResult.data ?? [],
    auth_events: authAuditResult.data ?? [],
    verifications: verificationsResult.data ?? [],
    deletion_requests: deletionResult.data ?? [],
  };
}

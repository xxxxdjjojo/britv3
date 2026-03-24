/**
 * GDPR data export service -- queries all user data across tables
 * and returns a structured JSON object for download.
 * Uses admin client to bypass RLS for complete data export.
 *
 * UK GDPR Articles 15 & 20 require export of ALL personal data.
 * Tables that do not yet exist will return empty arrays via null fallback.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Export all user data as a structured JSON object.
 * Queries 20+ tables to compile a complete data export.
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
    messagesResult,
    conversationsResult,
    savedPropertiesResult,
    savedSearchesResult,
    viewingHistoryResult,
    offersResult,
    reviewsWrittenResult,
    reviewsReceivedResult,
    bookingsAsUserResult,
    bookingsAsProviderResult,
    serviceRequestsResult,
    quotesResult,
    notificationPrefsResult,
    privacySettingsResult,
    sellerListingsResult,
    rentalPropertiesResult,
    tenanciesResult,
    maintenanceRequestsResult,
    financialEntriesResult,
    providerServicesResult,
    providerInvoicesResult,
  ] = await Promise.all([
    // --- Existing tables ---
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url, active_role, verification_level, created_at, updated_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_roles")
      .select("role, granted_at")
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
      .select("stage, status, created_at, reviewed_at")
      .eq("user_id", userId),
    supabase
      .from("deletion_requests")
      .select("status, requested_at, scheduled_purge_at")
      .eq("user_id", userId),

    // --- Communication ---
    supabase
      .from("messages")
      .select("id, content, created_at, conversation_id")
      .eq("sender_id", userId),
    supabase
      .from("conversations")
      .select("id, context_type, created_at")
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`),

    // --- Property engagement ---
    supabase
      .from("saved_properties")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("viewing_history")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("offers")
      .select("*")
      .eq("user_id", userId),

    // --- Reviews ---
    supabase
      .from("reviews")
      .select("*")
      .eq("reviewer_id", userId),
    supabase
      .from("reviews")
      .select("id, rating, content, created_at")
      .eq("provider_id", userId),

    // --- Bookings & services ---
    supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", userId),
    supabase
      .from("service_requests")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("quotes")
      .select("*")
      .eq("provider_id", userId),

    // --- Preferences (from profiles table) ---
    supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .single(),
    supabase
      .from("profiles")
      .select("privacy_settings")
      .eq("id", userId)
      .single(),

    // --- Role-specific data ---
    supabase
      .from("seller_listings")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("rental_properties")
      .select("*")
      .eq("landlord_id", userId),
    supabase
      .from("tenancies")
      .select("*")
      .eq("tenant_id", userId),
    supabase
      .from("maintenance_requests")
      .select("*")
      .eq("reported_by", userId),
    supabase
      .from("financial_entries")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("provider_services")
      .select("*")
      .eq("provider_id", userId),
    supabase
      .from("provider_invoices")
      .select("*")
      .eq("provider_id", userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,

    // Identity & access
    profile: profileResult.data ?? null,
    roles: rolesResult.data ?? [],

    // Consent & audit
    consent: consentResult.data ?? [],
    consent_history: consentAuditResult.data ?? [],
    auth_events: authAuditResult.data ?? [],
    verifications: verificationsResult.data ?? [],
    deletion_requests: deletionResult.data ?? [],

    // Communication
    messages_sent: messagesResult.data ?? [],
    conversations: conversationsResult.data ?? [],

    // Property engagement
    saved_properties: savedPropertiesResult.data ?? [],
    saved_searches: savedSearchesResult.data ?? [],
    viewing_history: viewingHistoryResult.data ?? [],
    offers: offersResult.data ?? [],

    // Reviews
    reviews_written: reviewsWrittenResult.data ?? [],
    reviews_received: reviewsReceivedResult.data ?? [],

    // Bookings & services
    bookings_as_user: bookingsAsUserResult.data ?? [],
    bookings_as_provider: bookingsAsProviderResult.data ?? [],
    service_requests: serviceRequestsResult.data ?? [],
    quotes: quotesResult.data ?? [],

    // Preferences
    notification_preferences: notificationPrefsResult.data?.notification_preferences ?? null,
    privacy_settings: privacySettingsResult.data?.privacy_settings ?? null,

    // Role-specific data
    seller_listings: sellerListingsResult.data ?? [],
    rental_properties: rentalPropertiesResult.data ?? [],
    tenancies: tenanciesResult.data ?? [],
    maintenance_requests: maintenanceRequestsResult.data ?? [],
    financial_entries: financialEntriesResult.data ?? [],
    provider_services: providerServicesResult.data ?? [],
    provider_invoices: providerInvoicesResult.data ?? [],
  };
}

/**
 * Seed Demo — Cleanup
 *
 * Deletes all demo data in reverse FK order so foreign key constraints
 * are respected. Uses DEMO_USER_IDS and DEMO_PROPERTY_IDS from config
 * to identify demo rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USER_IDS, DEMO_PROPERTY_IDS } from "./config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function deleteWhere(
  supabase: SupabaseClient,
  table: string,
  column: string,
  ids: string[],
): Promise<{ deleted: boolean; error?: string }> {
  const { error } = await supabase.from(table).delete().in(column, ids);
  if (error) {
    // Table may not exist yet — treat as non-fatal
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      console.log(`  [skip] ${table} — table does not exist`);
      return { deleted: false };
    }
    console.error(`  [warn] ${table}: ${error.message}`);
    return { deleted: false, error: error.message };
  }
  console.log(`  [ok]   ${table}`);
  return { deleted: true };
}

// ---------------------------------------------------------------------------
// Main Cleanup
// ---------------------------------------------------------------------------

/**
 * Deletes all demo-seeded data in reverse FK dependency order.
 * Safe to run multiple times (idempotent).
 */
export async function cleanup(supabase: SupabaseClient): Promise<void> {
  console.log("\n══════════════════════════════════════════");
  console.log("  DEMO DATA CLEANUP");
  console.log("══════════════════════════════════════════\n");
  console.log(`Deleting data for ${DEMO_USER_IDS.length} demo users...\n`);

  // Fetch demo listing IDs (properties are linked via listings)
  const { data: demoListings } = await supabase
    .from("listings")
    .select("id")
    .in("user_id", DEMO_USER_IDS);
  const demoListingIds = (demoListings ?? []).map((l: { id: string }) => l.id);

  // Fetch tenancy IDs for deposit cleanup
  const { data: demoTenancies } = await supabase
    .from("tenancies")
    .select("id")
    .in("landlord_id", DEMO_USER_IDS);
  const demoTenancyIds = (demoTenancies ?? []).map((t: { id: string }) => t.id);

  // ── Step 1: Activity & audit logs ──────────────────────────────────────
  console.log("Step 1: Activity & audit logs");
  await deleteWhere(supabase, "activity_log", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "admin_audit_log", "actor_id", DEMO_USER_IDS);

  // ── Step 2: Reviews ────────────────────────────────────────────────────
  console.log("\nStep 2: Reviews");
  await deleteWhere(supabase, "reviews", "reviewer_id", DEMO_USER_IDS);

  // ── Step 3: Messages & conversations ───────────────────────────────────
  console.log("\nStep 3: Messages & conversations");
  await deleteWhere(supabase, "messages", "sender_id", DEMO_USER_IDS);
  // Conversations where any participant is a demo user
  const { data: demoConvos } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .in("user_id", DEMO_USER_IDS);
  const demoConvoIds = [...new Set((demoConvos ?? []).map((c: { conversation_id: string }) => c.conversation_id))];
  if (demoConvoIds.length > 0) {
    await deleteWhere(supabase, "conversation_participants", "conversation_id", demoConvoIds);
    await deleteWhere(supabase, "conversations", "id", demoConvoIds);
  }

  // ── Step 4: Financial entries ──────────────────────────────────────────
  console.log("\nStep 4: Financial entries");
  await deleteWhere(supabase, "financial_entries", "user_id", DEMO_USER_IDS);

  // ── Step 5: Deposit registrations (via tenancies) ──────────────────────
  console.log("\nStep 5: Deposit registrations");
  if (demoTenancyIds.length > 0) {
    await deleteWhere(supabase, "deposit_registrations", "tenancy_id", demoTenancyIds);
  }

  // ── Step 6: Maintenance requests ───────────────────────────────────────
  console.log("\nStep 6: Maintenance requests");
  await deleteWhere(supabase, "maintenance_requests", "reported_by", DEMO_USER_IDS);

  // ── Step 7: Property documents ─────────────────────────────────────────
  console.log("\nStep 7: Property documents");
  if (demoListingIds.length > 0) {
    await deleteWhere(supabase, "property_documents", "listing_id", demoListingIds);
  }

  // ── Step 8: Tenant applications ────────────────────────────────────────
  console.log("\nStep 8: Tenant applications");
  await deleteWhere(supabase, "tenant_applications", "applicant_id", DEMO_USER_IDS);

  // ── Step 9: Tenancies ──────────────────────────────────────────────────
  console.log("\nStep 9: Tenancies");
  await deleteWhere(supabase, "tenancies", "landlord_id", DEMO_USER_IDS);

  // ── Step 10: Agent tables ──────────────────────────────────────────────
  console.log("\nStep 10: Agent tables");
  await deleteWhere(supabase, "viewing_feedback", "agent_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "viewing_slots", "agent_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "offers", "agent_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "commissions", "agent_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "leads", "agent_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "agency_profiles", "user_id", DEMO_USER_IDS);

  // ── Step 11: Seller tables ─────────────────────────────────────────────
  console.log("\nStep 11: Seller tables");
  await deleteWhere(supabase, "listing_analytics_events", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "seller_offers", "seller_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "seller_viewings", "seller_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "agent_enquiries", "seller_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "seller_listings", "user_id", DEMO_USER_IDS);

  // ── Step 12: Provider tables ───────────────────────────────────────────
  console.log("\nStep 12: Provider tables");
  await deleteWhere(supabase, "provider_documents", "provider_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "provider_invoices", "provider_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "bookings", "provider_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "quotes", "provider_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "service_requests", "provider_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "provider_details", "user_id", DEMO_USER_IDS);

  // ── Step 13: Homebuyer tables ──────────────────────────────────────────
  console.log("\nStep 13: Homebuyer tables");
  await deleteWhere(supabase, "viewings", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "viewing_slots", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "saved_searches", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "saved_properties", "user_id", DEMO_USER_IDS);

  // ── Step 14: Property media ────────────────────────────────────────────
  console.log("\nStep 14: Property media");
  if (demoListingIds.length > 0) {
    await deleteWhere(supabase, "property_media", "listing_id", demoListingIds);
  }

  // ── Step 15: Listings & properties ─────────────────────────────────────
  console.log("\nStep 15: Listings & properties");
  await deleteWhere(supabase, "listings", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "properties", "id", DEMO_PROPERTY_IDS);

  // ── Step 16: Subscriptions, user_roles, profiles ────────────────────────
  console.log("\nStep 16: Subscriptions, user_roles, profiles");
  await deleteWhere(supabase, "subscriptions", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "user_roles", "user_id", DEMO_USER_IDS);
  await deleteWhere(supabase, "profiles", "id", DEMO_USER_IDS);

  // ── Step 17: Auth users ────────────────────────────────────────────────
  console.log("\nStep 17: Auth users");
  for (const userId of DEMO_USER_IDS) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      if (error.message.includes("not found") || error.message.includes("User not found")) {
        console.log(`  [skip] auth.users ${userId} — not found`);
      } else {
        console.error(`  [warn] auth.users ${userId}: ${error.message}`);
      }
    } else {
      console.log(`  [ok]   auth.users ${userId}`);
    }
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  CLEANUP COMPLETE");
  console.log("══════════════════════════════════════════\n");
}

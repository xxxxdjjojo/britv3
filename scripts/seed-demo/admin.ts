/**
 * Seed Demo — Admin Data (Audit Log & Activity Log)
 *
 * Seeds 50+ admin audit log entries and 100+ user activity log entries
 * spanning 30 days. Activity is densest in the last 24 hours.
 *
 * UUID prefix: m0000000
 *
 * NOTE: activity_log uses BIGSERIAL PK (auto-generated), so we omit `id`
 * and use direct insert instead of seedTable() upsert.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USERS, DEMO_PROPERTIES, type Scenario } from "./config";
import { DEMO_LISTING_IDS } from "./properties";
import { minutesAgo, hoursAgo, daysAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN = DEMO_USERS.ADMIN;
const SARAH = DEMO_USERS.HOMEBUYER;
const JAMES = DEMO_USERS.RENTER;
const EMMA = DEMO_USERS.SELLER;
const ROBERT = DEMO_USERS.LANDLORD;
const VICTORIA = DEMO_USERS.AGENT;
const MIKE = DEMO_USERS.PROVIDER;

const ALL_USERS = [SARAH, JAMES, EMMA, ROBERT, VICTORIA, MIKE, ADMIN];
const NON_ADMIN_USERS = [SARAH, JAMES, EMMA, ROBERT, VICTORIA, MIKE];

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (m0000000 prefix)
// ---------------------------------------------------------------------------

/** Audit log IDs */
function auditId(n: number): string {
  return `m0000000-01${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// ---------------------------------------------------------------------------
// Admin Audit Log (50+ entries spanning 30 days)
// ---------------------------------------------------------------------------

function buildAuditLogRows(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  let idx = 1;

  // --- User registration events (7 — one per demo user) ---
  for (const user of ALL_USERS) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: "user.registered",
      target_type: "user",
      target_id: user.id,
      metadata: JSON.stringify({
        email: user.email,
        role: user.role,
        source: "demo_seed",
      }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(30).toISOString(),
    });
  }

  // --- Profile verification events (6 — non-admin users) ---
  for (const user of NON_ADMIN_USERS) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: "user.verified",
      target_type: "user",
      target_id: user.id,
      metadata: JSON.stringify({
        verification_level: "professional",
        verified_by: "admin_review",
      }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(29).toISOString(),
    });
  }

  // --- Profile update events ---
  const profileUpdates = [
    { user: SARAH, field: "phone", daysAgo: 25 },
    { user: JAMES, field: "avatar_url", daysAgo: 24 },
    { user: VICTORIA, field: "business_name", daysAgo: 23 },
    { user: MIKE, field: "services", daysAgo: 22 },
    { user: ROBERT, field: "phone", daysAgo: 20 },
    { user: EMMA, field: "display_name", daysAgo: 18 },
  ];
  for (const update of profileUpdates) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: "user.profile_updated",
      target_type: "user",
      target_id: update.user.id,
      metadata: JSON.stringify({
        field_changed: update.field,
        updated_by: update.user.id,
      }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(update.daysAgo).toISOString(),
    });
  }

  // --- Listing creation events ---
  const listingProperties = DEMO_PROPERTIES.slice(0, 10);
  for (const prop of listingProperties) {
    const listingId = DEMO_LISTING_IDS[prop.id];
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: "listing.created",
      target_type: "listing",
      target_id: listingId,
      metadata: JSON.stringify({
        property_id: prop.id,
        listing_type: prop.listing_type,
        price: prop.price,
        status: prop.listing_status,
        created_by: DEMO_USERS[prop.owner_key].id,
      }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(28 - listingProperties.indexOf(prop)).toISOString(),
    });
  }

  // --- Moderation actions ---
  const moderationActions = [
    {
      action: "content.approved",
      target_type: "review",
      description: "Review approved after content check",
      daysAgo: 20,
    },
    {
      action: "content.approved",
      target_type: "review",
      description: "Review approved after content check",
      daysAgo: 18,
    },
    {
      action: "content.flagged",
      target_type: "review",
      description: "Review flagged for potential fake content",
      daysAgo: 15,
    },
    {
      action: "content.approved",
      target_type: "listing",
      description: "Listing photos approved after review",
      daysAgo: 14,
    },
    {
      action: "content.rejected",
      target_type: "message",
      description: "Message rejected — spam content detected",
      daysAgo: 12,
    },
    {
      action: "report.resolved",
      target_type: "report",
      description: "User report resolved — no action taken",
      daysAgo: 10,
    },
    {
      action: "report.resolved",
      target_type: "report",
      description: "User report resolved — warning issued",
      daysAgo: 8,
    },
    {
      action: "content.approved",
      target_type: "review",
      description: "Batch: 3 reviews approved",
      daysAgo: 6,
    },
  ];
  for (const mod of moderationActions) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: mod.action,
      target_type: mod.target_type,
      target_id: `target-${idx}`,
      metadata: JSON.stringify({ description: mod.description }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(mod.daysAgo).toISOString(),
    });
  }

  // --- System events ---
  const systemEvents = [
    { action: "system.maintenance_window", description: "Scheduled maintenance completed", daysAgo: 21 },
    { action: "system.backup_completed", description: "Database backup successful", daysAgo: 14 },
    { action: "system.rls_audit", description: "RLS policy audit — all tables compliant", daysAgo: 7 },
    { action: "system.backup_completed", description: "Database backup successful", daysAgo: 7 },
    { action: "system.cache_purge", description: "CDN cache purged for static assets", daysAgo: 3 },
    { action: "system.backup_completed", description: "Database backup successful", daysAgo: 1 },
  ];
  for (const evt of systemEvents) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: evt.action,
      target_type: "system",
      target_id: "platform",
      metadata: JSON.stringify({ description: evt.description }),
      ip_address: "127.0.0.1",
      created_at: daysAgo(evt.daysAgo).toISOString(),
    });
  }

  // --- Recent admin actions (last 3 days) ---
  const recentActions = [
    { action: "user.role_changed", target_type: "user", target_id: VICTORIA.id, metadata: { from_role: "homebuyer", to_role: "agent" }, daysAgo: 2 },
    { action: "listing.status_changed", target_type: "listing", target_id: DEMO_LISTING_IDS[DEMO_PROPERTIES[1].id], metadata: { from: "active", to: "under_offer" }, daysAgo: 2 },
    { action: "user.suspended", target_type: "user", target_id: "fake-user-001", metadata: { reason: "Suspected fake reviews", duration: "7_days" }, daysAgo: 1 },
    { action: "listing.removed", target_type: "listing", target_id: "removed-listing-001", metadata: { reason: "Duplicate listing reported", reported_by: SARAH.id }, daysAgo: 1 },
    { action: "feature_flag.toggled", target_type: "feature_flag", target_id: "ai_property_valuation", metadata: { enabled: true }, hoursAgo: 18 },
    { action: "content.approved", target_type: "listing", target_id: DEMO_LISTING_IDS[DEMO_PROPERTIES[4].id], metadata: { photos_count: 8, approved_by: "auto_moderation" }, hoursAgo: 6 },
    { action: "system.health_check", target_type: "system", target_id: "platform", metadata: { status: "healthy", response_time_ms: 142 }, hoursAgo: 2 },
  ];
  for (const ra of recentActions) {
    rows.push({
      id: auditId(idx++),
      admin_id: ADMIN.id,
      action: ra.action,
      target_type: ra.target_type,
      target_id: ra.target_id,
      metadata: JSON.stringify(ra.metadata),
      ip_address: "127.0.0.1",
      created_at: ("hoursAgo" in ra ? hoursAgo(ra.hoursAgo as number) : daysAgo(ra.daysAgo as number)).toISOString(),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Activity Log (100+ entries, densest in last 24 hours)
// ---------------------------------------------------------------------------

function buildActivityLogRows(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  const propertyIds = DEMO_PROPERTIES.map((p) => p.id);
  const listingIds = DEMO_PROPERTIES.map((p) => DEMO_LISTING_IDS[p.id]);

  // --- Historical activity (days 30-2, ~40 entries) ---

  // Property views spread across users and days
  const historicalViews = [
    { user: SARAH, propIdx: 0, daysAgo: 28 },
    { user: SARAH, propIdx: 1, daysAgo: 27 },
    { user: SARAH, propIdx: 4, daysAgo: 25 },
    { user: SARAH, propIdx: 5, daysAgo: 22 },
    { user: JAMES, propIdx: 7, daysAgo: 26 },
    { user: JAMES, propIdx: 8, daysAgo: 24 },
    { user: JAMES, propIdx: 9, daysAgo: 20 },
    { user: JAMES, propIdx: 11, daysAgo: 18 },
    { user: EMMA, propIdx: 0, daysAgo: 25 },
    { user: ROBERT, propIdx: 4, daysAgo: 23 },
    { user: ROBERT, propIdx: 5, daysAgo: 21 },
    { user: VICTORIA, propIdx: 0, daysAgo: 27 },
    { user: VICTORIA, propIdx: 1, daysAgo: 26 },
    { user: VICTORIA, propIdx: 2, daysAgo: 24 },
  ];
  for (const v of historicalViews) {
    rows.push({
      user_id: v.user.id,
      event_type: "property.viewed",
      description: `Viewed property listing`,
      metadata: JSON.stringify({
        property_id: propertyIds[v.propIdx],
        listing_id: listingIds[v.propIdx],
      }),
      created_at: daysAgo(v.daysAgo).toISOString(),
    });
  }

  // Search events
  const searches = [
    { user: SARAH, query: "3 bed house Battersea", daysAgo: 28 },
    { user: SARAH, query: "family home SW11", daysAgo: 25 },
    { user: SARAH, query: "Victorian terrace London", daysAgo: 20 },
    { user: JAMES, query: "2 bed flat London rent", daysAgo: 26 },
    { user: JAMES, query: "flat near Hyde Park", daysAgo: 22 },
    { user: JAMES, query: "1 bed Manchester rent", daysAgo: 15 },
    { user: ROBERT, query: "letting agent Birmingham", daysAgo: 20 },
    { user: ROBERT, query: "rental yield calculator", daysAgo: 18 },
  ];
  for (const s of searches) {
    rows.push({
      user_id: s.user.id,
      event_type: "search.performed",
      description: `Searched: "${s.query}"`,
      metadata: JSON.stringify({ query: s.query }),
      created_at: daysAgo(s.daysAgo).toISOString(),
    });
  }

  // Property saves
  const saves = [
    { user: SARAH, propIdx: 0, daysAgo: 27 },
    { user: SARAH, propIdx: 4, daysAgo: 24 },
    { user: SARAH, propIdx: 6, daysAgo: 20 },
    { user: JAMES, propIdx: 7, daysAgo: 25 },
    { user: JAMES, propIdx: 9, daysAgo: 19 },
    { user: JAMES, propIdx: 11, daysAgo: 17 },
  ];
  for (const s of saves) {
    rows.push({
      user_id: s.user.id,
      event_type: "property.saved",
      description: "Saved property to favourites",
      metadata: JSON.stringify({
        property_id: propertyIds[s.propIdx],
        listing_id: listingIds[s.propIdx],
      }),
      created_at: daysAgo(s.daysAgo).toISOString(),
    });
  }

  // Message sends
  const messageSends = [
    { user: SARAH, daysAgo: 20, to: "Victoria Stone" },
    { user: JAMES, daysAgo: 18, to: "Robert Williams" },
    { user: EMMA, daysAgo: 15, to: "Victoria Stone" },
    { user: ROBERT, daysAgo: 14, to: "Mike Johnson" },
    { user: VICTORIA, daysAgo: 12, to: "Mike Johnson" },
    { user: MIKE, daysAgo: 10, to: "Robert Williams" },
    { user: SARAH, daysAgo: 8, to: "Emma Thompson" },
    { user: JAMES, daysAgo: 6, to: "Mike Johnson" },
  ];
  for (const m of messageSends) {
    rows.push({
      user_id: m.user.id,
      event_type: "message.sent",
      description: `Sent message to ${m.to}`,
      metadata: JSON.stringify({ recipient_name: m.to }),
      created_at: daysAgo(m.daysAgo).toISOString(),
    });
  }

  // Review posts
  const reviewPosts = [
    { user: ROBERT, daysAgo: 22, provider: "Mike Johnson", rating: 5 },
    { user: SARAH, daysAgo: 18, provider: "Mike Johnson", rating: 5 },
    { user: ROBERT, daysAgo: 15, provider: "Mike Johnson", rating: 4 },
    { user: EMMA, daysAgo: 12, provider: "Mike Johnson", rating: 3 },
  ];
  for (const r of reviewPosts) {
    rows.push({
      user_id: r.user.id,
      event_type: "review.posted",
      description: `Reviewed ${r.provider} (${r.rating}/5)`,
      metadata: JSON.stringify({
        provider_name: r.provider,
        rating: r.rating,
      }),
      created_at: daysAgo(r.daysAgo).toISOString(),
    });
  }

  // --- Last 24 hours activity (dense — 60+ entries) ---

  // Batch of property views in last 24 hours
  const recentViews = [
    { user: SARAH, propIdx: 0, hoursAgo: 22 },
    { user: SARAH, propIdx: 2, hoursAgo: 20 },
    { user: SARAH, propIdx: 3, hoursAgo: 18 },
    { user: SARAH, propIdx: 5, hoursAgo: 14 },
    { user: SARAH, propIdx: 6, hoursAgo: 8 },
    { user: SARAH, propIdx: 13, hoursAgo: 4 },
    { user: SARAH, propIdx: 15, hoursAgo: 2 },
    { user: JAMES, propIdx: 7, hoursAgo: 23 },
    { user: JAMES, propIdx: 8, hoursAgo: 21 },
    { user: JAMES, propIdx: 9, hoursAgo: 17 },
    { user: JAMES, propIdx: 10, hoursAgo: 12 },
    { user: JAMES, propIdx: 11, hoursAgo: 6 },
    { user: EMMA, propIdx: 0, hoursAgo: 19 },
    { user: EMMA, propIdx: 1, hoursAgo: 15 },
    { user: ROBERT, propIdx: 8, hoursAgo: 16 },
    { user: ROBERT, propIdx: 9, hoursAgo: 10 },
    { user: ROBERT, propIdx: 10, hoursAgo: 5 },
    { user: VICTORIA, propIdx: 4, hoursAgo: 20 },
    { user: VICTORIA, propIdx: 5, hoursAgo: 16 },
    { user: VICTORIA, propIdx: 6, hoursAgo: 11 },
    { user: VICTORIA, propIdx: 13, hoursAgo: 7 },
    { user: VICTORIA, propIdx: 14, hoursAgo: 3 },
    { user: MIKE, propIdx: 0, hoursAgo: 18 },
    { user: MIKE, propIdx: 7, hoursAgo: 9 },
  ];
  for (const v of recentViews) {
    if (v.propIdx < propertyIds.length) {
      rows.push({
        user_id: v.user.id,
        event_type: "property.viewed",
        description: "Viewed property listing",
        metadata: JSON.stringify({
          property_id: propertyIds[v.propIdx],
          listing_id: listingIds[v.propIdx],
        }),
        created_at: hoursAgo(v.hoursAgo).toISOString(),
      });
    }
  }

  // Recent searches
  const recentSearches = [
    { user: SARAH, query: "3 bed Victorian SW11", hoursAgo: 21 },
    { user: SARAH, query: "houses near Clapham Common", hoursAgo: 13 },
    { user: SARAH, query: "first time buyer London", hoursAgo: 5 },
    { user: JAMES, query: "2 bed flat zone 2 rent", hoursAgo: 22 },
    { user: JAMES, query: "pet friendly rental London", hoursAgo: 15 },
    { user: JAMES, query: "studio flat Manchester cheap", hoursAgo: 7 },
    { user: ROBERT, query: "property management fees comparison", hoursAgo: 14 },
    { user: ROBERT, query: "buy to let mortgage rates 2026", hoursAgo: 8 },
    { user: VICTORIA, query: "new listings Bristol", hoursAgo: 19 },
    { user: VICTORIA, query: "market trends South East", hoursAgo: 10 },
  ];
  for (const s of recentSearches) {
    rows.push({
      user_id: s.user.id,
      event_type: "search.performed",
      description: `Searched: "${s.query}"`,
      metadata: JSON.stringify({ query: s.query }),
      created_at: hoursAgo(s.hoursAgo).toISOString(),
    });
  }

  // Recent saves
  const recentSaves = [
    { user: SARAH, propIdx: 2, hoursAgo: 19 },
    { user: SARAH, propIdx: 5, hoursAgo: 13 },
    { user: JAMES, propIdx: 10, hoursAgo: 11 },
    { user: JAMES, propIdx: 11, hoursAgo: 5 },
  ];
  for (const s of recentSaves) {
    rows.push({
      user_id: s.user.id,
      event_type: "property.saved",
      description: "Saved property to favourites",
      metadata: JSON.stringify({
        property_id: propertyIds[s.propIdx],
        listing_id: listingIds[s.propIdx],
      }),
      created_at: hoursAgo(s.hoursAgo).toISOString(),
    });
  }

  // Recent messages
  const recentMessages = [
    { user: VICTORIA, hoursAgo: 20, to: "Sarah Mitchell" },
    { user: SARAH, hoursAgo: 18, to: "Victoria Stone" },
    { user: ROBERT, hoursAgo: 16, to: "Mike Johnson" },
    { user: MIKE, hoursAgo: 14, to: "Robert Williams" },
    { user: JAMES, hoursAgo: 12, to: "Robert Williams" },
    { user: ROBERT, hoursAgo: 10, to: "James Cooper" },
    { user: EMMA, hoursAgo: 8, to: "Victoria Stone" },
    { user: VICTORIA, hoursAgo: 6, to: "Emma Thompson" },
    { user: MIKE, hoursAgo: 4, to: "James Cooper" },
    { user: SARAH, hoursAgo: 2, to: "Emma Thompson" },
  ];
  for (const m of recentMessages) {
    rows.push({
      user_id: m.user.id,
      event_type: "message.sent",
      description: `Sent message to ${m.to}`,
      metadata: JSON.stringify({ recipient_name: m.to }),
      created_at: hoursAgo(m.hoursAgo).toISOString(),
    });
  }

  // Login events (all users in last 24h)
  for (const user of ALL_USERS) {
    rows.push({
      user_id: user.id,
      event_type: "auth.login",
      description: "Signed in",
      metadata: JSON.stringify({ method: "email", device: "desktop" }),
      created_at: hoursAgo(Math.floor(Math.random() * 20) + 1).toISOString(),
    });
  }

  // Application submissions (renter)
  rows.push({
    user_id: JAMES.id,
    event_type: "application.submitted",
    description: "Submitted rental application",
    metadata: JSON.stringify({
      listing_id: listingIds[7],
      property_address: "Flat 12, Crescent House, 45 Park Road",
    }),
    created_at: daysAgo(5).toISOString(),
  });
  rows.push({
    user_id: JAMES.id,
    event_type: "application.submitted",
    description: "Submitted rental application",
    metadata: JSON.stringify({
      listing_id: listingIds[9],
      property_address: "28 Victoria Terrace",
    }),
    created_at: hoursAgo(9).toISOString(),
  });

  // Notification preference changes
  rows.push({
    user_id: SARAH.id,
    event_type: "settings.updated",
    description: "Updated notification preferences",
    metadata: JSON.stringify({ section: "notifications", changes: ["email_digest: daily"] }),
    created_at: daysAgo(3).toISOString(),
  });
  rows.push({
    user_id: ROBERT.id,
    event_type: "settings.updated",
    description: "Updated notification preferences",
    metadata: JSON.stringify({ section: "notifications", changes: ["sms_alerts: enabled"] }),
    created_at: hoursAgo(15).toISOString(),
  });

  // Viewing requests
  rows.push({
    user_id: SARAH.id,
    event_type: "viewing.requested",
    description: "Requested property viewing",
    metadata: JSON.stringify({
      listing_id: listingIds[0],
      preferred_date: "Saturday 10am",
    }),
    created_at: daysAgo(4).toISOString(),
  });
  rows.push({
    user_id: SARAH.id,
    event_type: "viewing.confirmed",
    description: "Viewing confirmed by agent",
    metadata: JSON.stringify({
      listing_id: listingIds[0],
      confirmed_date: "Saturday 10am",
      agent: "Victoria Stone",
    }),
    created_at: daysAgo(3).toISOString(),
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function seedAdmin(
  supabase: SupabaseClient,
  _scenario: Scenario,
): Promise<void> {
  console.log("\n--- Seeding Admin Data ---");

  // 1. Admin audit log (has UUID PK, use seedTable)
  const auditRows = buildAuditLogRows();
  await seedTable(supabase, "admin_audit_log", auditRows);

  // 2. Activity log (BIGSERIAL PK, partitioned table — use direct insert)
  const activityRows = buildActivityLogRows();
  console.log(`  Seeding activity_log: ${activityRows.length} rows...`);

  // Insert in batches to avoid hitting row limits
  const BATCH_SIZE = 50;
  let insertedCount = 0;
  for (let i = 0; i < activityRows.length; i += BATCH_SIZE) {
    const batch = activityRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("activity_log").insert(batch);
    if (error) {
      console.error(`  ERROR seeding activity_log batch: ${error.message}`);
      return;
    }
    insertedCount += batch.length;
  }
  console.log(`  Seeded activity_log: ${insertedCount} rows`);
}

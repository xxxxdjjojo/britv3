/**
 * scripts/seed-onboarding-fixture.mjs
 *
 * Seeds the stable onboarding E2E fixture for the partner-ingestion vertical.
 * Idempotent: keyed on stable slugs/identifiers; re-running is a safe no-op.
 *
 * What it creates (on top of the all-role users from seed-test-users.ts):
 *   - organisations row   (slug: e2e-onboarding-agency)
 *   - organisation_memberships row  (test-agent as owner)
 *   - agent_feed_integrations row   (provider: sandbox, disconnected)
 *
 * RESET MODE (--reset):
 *   Establishes a clean baseline for test-agent BEFORE re-seeding. Scoped
 *   strictly to test-agent / e2e-onboarding-agency — no other user's data
 *   is touched. Safe to run before every E2E run.
 *
 *   Deletion order (FK-safe):
 *     1. Snapshot property_ids from feed_listing_links for test-agent
 *     2. feed_media_links    (agent_id = test-agent)
 *     3. feed_listing_links  (agent_id = test-agent)
 *     4. feed_branch_links   (agent_id = test-agent)
 *     5. feed_import_items   (agent_id = test-agent)
 *     6. feed_import_runs    (integration_id IN test-agent's integrations)
 *     7. listings            (user_id = test-agent)
 *     8. properties          (id IN snapshot from step 1 that have no remaining listing)
 *     9. agent_feed_integrations: delete ALL for test-agent, recreate exactly
 *        ONE sandbox/disconnected row.
 *   Organisation + membership are preserved (stable, not mutable by tests).
 *
 * SAFETY: requires SUPABASE_URL to contain 127.0.0.1 or localhost.
 * The script refuses to run against any other host to prevent prod writes.
 *
 * Usage:
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key> \
 *   node scripts/seed-onboarding-fixture.mjs            # idempotent seed only
 *
 *   node scripts/seed-onboarding-fixture.mjs --reset    # baseline then seed
 *   node scripts/seed-onboarding-fixture.mjs --clean    # remove all fixture rows
 *
 * The runner (scripts/e2e-onboarding-local.sh) always passes --reset so every
 * E2E run starts from the same known state.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// SAFETY ASSERTION — must be the very first thing that runs.
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("[seed-onboarding-fixture] FATAL: SUPABASE_URL is not set.");
  console.error(
    "  Pass the local API URL: SUPABASE_URL=http://127.0.0.1:54321 node scripts/seed-onboarding-fixture.mjs",
  );
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    "[seed-onboarding-fixture] FATAL: SUPABASE_SERVICE_ROLE_KEY is not set.",
  );
  process.exit(1);
}

// CRITICAL: refuse to run against anything other than 127.0.0.1 / localhost.
// .env.local points at PROD (supabase.co) — never let that URL reach here.
// Require an explicit local host (with optional port). This rejects tunnel
// hostnames such as "https://x.localhost.run" which contain "localhost" but
// are NOT a local stack.
const LOCAL_HOST_RE = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;
const isLocalTarget = LOCAL_HOST_RE.test(SUPABASE_URL);
if (!isLocalTarget) {
  console.error(
    "[seed-onboarding-fixture] FATAL: SUPABASE_URL does not point at a local stack.",
  );
  console.error(`  Received: ${SUPABASE_URL}`);
  console.error(
    "  This script only runs against 127.0.0.1/localhost to prevent production writes.",
  );
  process.exit(1);
}

console.log(`[seed-onboarding-fixture] Target: ${SUPABASE_URL} (local ✓)`);

// ---------------------------------------------------------------------------
// Client (admin / service role — writes bypass RLS)
// ---------------------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AGENT_EMAIL = "test-agent@britestate.test";
const ORG_SLUG = "e2e-onboarding-agency";
const ORG_NAME = "E2E Onboarding Agency";
const CLEAN_ONLY = process.argv.includes("--clean");
const RESET_MODE = process.argv.includes("--reset");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fatal(label, error) {
  console.error(`[seed-onboarding-fixture] FATAL — ${label}:`, error?.message ?? error);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// resetTestAgentState: clean baseline scoped to test-agent only
// ---------------------------------------------------------------------------
async function resetTestAgentState(agentUserId, orgId) {
  console.log("[seed-onboarding-fixture] Resetting test-agent feed state...");

  // Step 0: Collect all integration ids for this agent (needed for run deletion)
  // and snapshot property_ids from feed_listing_links before we wipe them.
  const { data: integrations, error: intFetchErr } = await supabase
    .from("agent_feed_integrations")
    .select("id")
    .eq("agent_id", agentUserId);
  if (intFetchErr) fatal("fetch integrations for reset", intFetchErr);
  const integrationIds = (integrations ?? []).map((r) => r.id);

  // Snapshot property_ids linked via feed before clearing feed_listing_links
  const { data: feedLinks, error: linkFetchErr } = await supabase
    .from("feed_listing_links")
    .select("property_id")
    .eq("agent_id", agentUserId);
  if (linkFetchErr) fatal("fetch feed_listing_links property_ids for reset", linkFetchErr);
  const feedPropertyIds = [...new Set(
    (feedLinks ?? []).map((r) => r.property_id).filter(Boolean)
  )];

  // 1. feed_media_links (agent_id = test-agent)
  {
    const { error } = await supabase
      .from("feed_media_links")
      .delete()
      .eq("agent_id", agentUserId);
    if (error) fatal("reset feed_media_links", error);
    console.log("  feed_media_links: cleared");
  }

  // 2. feed_listing_links (agent_id = test-agent)
  {
    const { error } = await supabase
      .from("feed_listing_links")
      .delete()
      .eq("agent_id", agentUserId);
    if (error) fatal("reset feed_listing_links", error);
    console.log("  feed_listing_links: cleared");
  }

  // 3. feed_branch_links (agent_id = test-agent)
  {
    const { error } = await supabase
      .from("feed_branch_links")
      .delete()
      .eq("agent_id", agentUserId);
    if (error) fatal("reset feed_branch_links", error);
    console.log("  feed_branch_links: cleared");
  }

  // 4. feed_import_items (agent_id = test-agent)
  {
    const { error } = await supabase
      .from("feed_import_items")
      .delete()
      .eq("agent_id", agentUserId);
    if (error) fatal("reset feed_import_items", error);
    console.log("  feed_import_items: cleared");
  }

  // 5. feed_import_runs (for test-agent's integrations)
  if (integrationIds.length > 0) {
    const { error } = await supabase
      .from("feed_import_runs")
      .delete()
      .in("integration_id", integrationIds);
    if (error) fatal("reset feed_import_runs", error);
    console.log("  feed_import_runs: cleared");
  } else {
    console.log("  feed_import_runs: nothing to clear (no integrations existed)");
  }

  // 6. listings (user_id = test-agent)
  //    After feed_listing_links is gone, the FK from feed_listing_links→listings
  //    no longer blocks deletion. The properties FK is listings→properties
  //    (listings.property_id references properties.id, not the other way), so
  //    deleting listings does NOT cascade to properties — we handle properties
  //    separately in step 7.
  {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("user_id", agentUserId);
    if (error) fatal("reset listings", error);
    console.log("  listings: cleared");
  }

  // 7. Properties that were linked via feed for test-agent.
  //    We use the ids we snapshotted in step 0. Only delete ones that have no
  //    remaining listing reference (guard against shared properties, though in
  //    practice feed-created properties are always exclusively owned).
  if (feedPropertyIds.length > 0) {
    // Find which of these property_ids still appear in listings (other users).
    const { data: stillReferenced, error: refErr } = await supabase
      .from("listings")
      .select("property_id")
      .in("property_id", feedPropertyIds);
    if (refErr) fatal("reset properties: check remaining references", refErr);
    const stillReferencedIds = new Set(
      (stillReferenced ?? []).map((r) => r.property_id).filter(Boolean)
    );
    const toDelete = feedPropertyIds.filter((id) => !stillReferencedIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", toDelete);
      if (error) fatal("reset properties", error);
      console.log(`  properties: ${toDelete.length} feed-origin properties removed`);
    } else {
      console.log("  properties: none to remove (all still referenced or none existed)");
    }
  } else {
    console.log("  properties: nothing to clear (no feed links existed)");
  }

  // 8. agent_feed_integrations: delete ALL for test-agent, then recreate
  //    exactly ONE sandbox/disconnected row so baseline is deterministic.
  {
    const { error: delErr } = await supabase
      .from("agent_feed_integrations")
      .delete()
      .eq("agent_id", agentUserId);
    if (delErr) fatal("reset agent_feed_integrations (delete all)", delErr);
    console.log("  agent_feed_integrations: all deleted");

    const { data: created, error: insErr } = await supabase
      .from("agent_feed_integrations")
      .insert({
        agent_id: agentUserId,
        provider: "sandbox",
        sync_status: "disconnected",
        organisation_id: orgId,
      })
      .select("id")
      .single();
    if (insErr) fatal("reset agent_feed_integrations (recreate sandbox)", insErr);
    console.log(`  agent_feed_integrations: 1 sandbox/disconnected recreated (id=${created.id})`);
  }

  console.log("[seed-onboarding-fixture] Reset complete — baseline: 0 csv integrations, 0 runs, 0 feed listings.");
}

// ---------------------------------------------------------------------------
// --clean: remove the fixture rows (reverse dependency order)
// ---------------------------------------------------------------------------
async function clean(agentUserId) {
  // 1. agent_feed_integrations keyed on agent_id (all providers)
  if (agentUserId) {
    const { error: intErr } = await supabase
      .from("agent_feed_integrations")
      .delete()
      .eq("agent_id", agentUserId);
    if (intErr) console.warn("  clean integration:", intErr.message);
    else console.log("  removed agent_feed_integrations rows (if existed)");
  }

  // 2. organisation (cascade deletes memberships via FK)
  const { error: orgErr } = await supabase
    .from("organisations")
    .delete()
    .eq("slug", ORG_SLUG);
  if (orgErr) console.warn("  clean organisation:", orgErr.message);
  else console.log("  removed organisation row (if existed)");

  console.log("[seed-onboarding-fixture] Clean complete.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // --- Look up test-agent user id via admin auth API ---
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) fatal("listUsers", listErr);

  const agentUser = userList.users.find((u) => u.email === AGENT_EMAIL);
  if (!agentUser) {
    console.error(
      `[seed-onboarding-fixture] FATAL: ${AGENT_EMAIL} not found in auth.users.`,
    );
    console.error(
      "  Run seed-test-users.ts first (the e2e-onboarding-local.sh runner does this).",
    );
    process.exit(1);
  }
  const agentUserId = agentUser.id;
  console.log(`  test-agent id: ${agentUserId}`);

  if (CLEAN_ONLY) {
    await clean(agentUserId);
    return;
  }

  // --- 1. Upsert organisation (keyed on slug) ---
  let orgId;
  {
    const { data: existing } = await supabase
      .from("organisations")
      .select("id")
      .eq("slug", ORG_SLUG)
      .maybeSingle();

    if (existing) {
      orgId = existing.id;
      console.log(`  organisation already exists (id=${orgId}) — skipping insert`);
    } else {
      const { data: created, error: orgErr } = await supabase
        .from("organisations")
        .insert({
          name: ORG_NAME,
          slug: ORG_SLUG,
          org_type: "estate_agency",
          verification_status: "unverified",
        })
        .select("id")
        .single();
      if (orgErr) fatal("insert organisation", orgErr);
      orgId = created.id;
      console.log(`  created organisation (id=${orgId})`);
    }
  }

  // --- 2. Upsert organisation_memberships (keyed on organisation_id + user_id) ---
  {
    const { data: existing } = await supabase
      .from("organisation_memberships")
      .select("id")
      .eq("organisation_id", orgId)
      .eq("user_id", agentUserId)
      .maybeSingle();

    if (existing) {
      console.log(`  organisation_memberships already exists (id=${existing.id}) — skipping insert`);
    } else {
      const { data: created, error: memErr } = await supabase
        .from("organisation_memberships")
        .insert({
          organisation_id: orgId,
          user_id: agentUserId,
          role: "owner",
          status: "active",
        })
        .select("id")
        .single();
      if (memErr) fatal("insert organisation_memberships", memErr);
      console.log(`  created organisation_memberships (id=${created.id})`);
    }
  }

  // --- 3. Reset mutable feed state (if --reset) then recreate baseline ---
  if (RESET_MODE) {
    await resetTestAgentState(agentUserId, orgId);
    console.log("\n[seed-onboarding-fixture] Done (reset + seed). Baseline state:");
    console.log(`  organisations (slug=${ORG_SLUG}): present`);
    console.log(`  organisation_memberships (agent=owner): present`);
    console.log(`  agent_feed_integrations: 1 sandbox/disconnected, 0 csv`);
    return;
  }

  // --- 3. Upsert agent_feed_integrations (keyed on agent_id + provider) ---
  {
    const { data: existing } = await supabase
      .from("agent_feed_integrations")
      .select("id")
      .eq("agent_id", agentUserId)
      .eq("provider", "sandbox")
      .maybeSingle();

    if (existing) {
      console.log(`  agent_feed_integrations already exists (id=${existing.id}) — skipping insert`);
    } else {
      const { data: created, error: intErr } = await supabase
        .from("agent_feed_integrations")
        .insert({
          agent_id: agentUserId,
          provider: "sandbox",
          sync_status: "disconnected",
          organisation_id: orgId,
        })
        .select("id")
        .single();
      if (intErr) fatal("insert agent_feed_integrations", intErr);
      console.log(`  created agent_feed_integrations (id=${created.id})`);
    }
  }

  console.log("\n[seed-onboarding-fixture] Done. Fixture summary:");
  console.log(`  organisations (slug=${ORG_SLUG}): present`);
  console.log(`  organisation_memberships (agent=owner): present`);
  console.log(`  agent_feed_integrations (provider=sandbox): present`);
}

main().catch((err) => {
  console.error("[seed-onboarding-fixture] Unhandled error:", err?.message ?? err);
  process.exit(1);
});

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
 * SAFETY: requires SUPABASE_URL to contain 127.0.0.1 or localhost.
 * The script refuses to run against any other host to prevent prod writes.
 *
 * Usage:
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key> \
 *   node scripts/seed-onboarding-fixture.mjs
 *
 *   # Remove the fixture:
 *   node scripts/seed-onboarding-fixture.mjs --clean
 *
 * The runner (scripts/e2e-onboarding-local.sh) invokes this after running
 * seed-test-users.ts; do not run in isolation against prod.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fatal(label, error) {
  console.error(`[seed-onboarding-fixture] FATAL — ${label}:`, error?.message ?? error);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// --clean: remove the fixture rows (reverse dependency order)
// ---------------------------------------------------------------------------
async function clean(agentUserId) {
  // 1. agent_feed_integrations keyed on (agent_id, provider='sandbox')
  if (agentUserId) {
    const { error: intErr } = await supabase
      .from("agent_feed_integrations")
      .delete()
      .eq("agent_id", agentUserId)
      .eq("provider", "sandbox");
    if (intErr) console.warn("  clean integration:", intErr.message);
    else console.log("  removed agent_feed_integrations row (if existed)");
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

  // --- Summary counts for idempotency verification ---
  const { data: orgCount } = await supabase
    .from("organisations")
    .select("id", { count: "exact", head: true })
    .eq("slug", ORG_SLUG);
  const { data: memCount } = await supabase
    .from("organisation_memberships")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", orgId)
    .eq("user_id", agentUserId);
  const { data: intCount } = await supabase
    .from("agent_feed_integrations")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentUserId)
    .eq("provider", "sandbox");

  // count is on the response object itself when head:true + count:'exact'
  // use psql to print actual counts since supabase-js head:true doesn't return rows
  console.log("\n[seed-onboarding-fixture] Done. Fixture summary:");
  console.log(`  organisations (slug=${ORG_SLUG}): present`);
  console.log(`  organisation_memberships (agent=owner): present`);
  console.log(`  agent_feed_integrations (provider=sandbox): present`);
}

main().catch((err) => {
  console.error("[seed-onboarding-fixture] Unhandled error:", err?.message ?? err);
  process.exit(1);
});

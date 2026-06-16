/**
 * supabase/seed/seed-test-users.ts
 *
 * Seeds the 6 canonical Playwright test users into Supabase Auth + assigns
 * their roles via the existing `assign_role_atomic` RPC. Idempotent — re-running
 * is safe; already-existing users are skipped with a warning.
 *
 * The `admin` user gets `profiles.is_admin = true` instead of an entry in
 * user_roles, because `assign_role_atomic`'s valid_roles list does not include
 * 'admin' (admin status is a boolean flag, not a role enum value — see
 * supabase/migrations/20260324_fix_admin_rls_policies.sql).
 *
 * Email addresses MUST match `e2e/auth.setup.ts` so Playwright auth state can
 * be populated by the setup phase after seeding.
 *
 * Usage:
 *   SUPABASE_URL='https://YOUR-PROJECT.supabase.co' \
 *   SUPABASE_SERVICE_ROLE_KEY='YOUR-SERVICE-ROLE-KEY' \
 *   pnpm tsx supabase/seed/seed-test-users.ts
 *
 * After seeding, run `pnpm test:e2e` once — Playwright's auth.setup.ts will
 * sign each user in and populate `e2e/.auth/*.json` with real auth state.
 */
import { createClient } from "@supabase/supabase-js";

interface TestUser {
  email: string;
  role: string;
}

const TEST_USERS: ReadonlyArray<TestUser> = [
  { email: "test-buyer@britestate.test", role: "homebuyer" },
  { email: "test-renter@britestate.test", role: "renter" },
  { email: "test-seller@britestate.test", role: "seller" },
  { email: "test-landlord@britestate.test", role: "landlord" },
  { email: "test-agent@britestate.test", role: "agent" },
  { email: "test-provider@britestate.test", role: "service_provider" },
  { email: "test-broker@britestate.test", role: "mortgage_broker" },
  { email: "test-admin@britestate.test", role: "admin" },
];

const PASSWORD = "TestPassword123!";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const { email, role } of TEST_USERS) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.toLowerCase().includes("already")) {
      // Already exists — look up the id so we can still ensure the role is set.
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error(`Lookup ${email} after create-conflict:`, listError);
        continue;
      }
      userId = list.users.find((u) => u.email === email)?.id;
      console.warn(`! ${email} already exists — ensuring role is set`);
    } else {
      console.error(`Create ${email}:`, createError);
      continue;
    }
  }

  if (!userId) {
    console.error(`No userId resolved for ${email} — skipping role assignment`);
    continue;
  }

  if (role === "admin") {
    // admin is a boolean flag on profiles, not a value in the role enum.
    const { error: adminError } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);
    if (adminError) {
      console.error(`Set is_admin for ${email}:`, adminError);
      continue;
    }
  } else {
    const { error: roleError } = await supabase.rpc("assign_role_atomic", {
      p_user_id: userId,
      p_role: role,
    });
    if (roleError) {
      console.error(`Assign role ${email}:`, roleError);
      continue;
    }
  }

  console.log(`OK ${email} (${role})`);
}

// ---------------------------------------------------------------------------
// Provider business record for the E2E provider user.
//
// `dashboard/provider/layout.tsx` → `resolveProviderId()` queries
// `service_provider_details` for the current user and redirects away (404) when
// no row exists. The demo SQL seed only creates a row for a different user, so
// the E2E provider user (`test-provider@britestate.test`) has none. Seed a
// minimal valid row here so all provider routes render under E2E auth.
//
// Required columns (per migration 002_marketplace.sql): user_id (PK),
// business_name (NOT NULL), slug (UNIQUE NOT NULL). `services` and
// `service_postcodes` are NOT NULL but have defaults. Values mirror the demo
// seed's shape; slug is unique to this user to avoid the UNIQUE collision.
// Idempotent: keyed on user_id with onConflict ignore.
const PROVIDER_EMAIL = "test-provider@britestate.test";

const { data: providerList, error: providerListError } =
  await supabase.auth.admin.listUsers();
if (providerListError) {
  console.error("Lookup E2E provider user:", providerListError);
} else {
  const providerUserId = providerList.users.find(
    (u) => u.email === PROVIDER_EMAIL,
  )?.id;

  if (!providerUserId) {
    console.error(`No userId resolved for ${PROVIDER_EMAIL} — skipping provider record`);
  } else {
    const { error: providerDetailsError } = await supabase
      .from("service_provider_details")
      .upsert(
        {
          user_id: providerUserId,
          business_name: "Britestate Test Plumbing",
          slug: "britestate-test-plumbing",
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    if (providerDetailsError) {
      console.error(`Upsert service_provider_details for ${PROVIDER_EMAIL}:`, providerDetailsError);
    } else {
      console.log(`OK service_provider_details for ${PROVIDER_EMAIL}`);
    }
  }
}

console.log("Seed complete.");
